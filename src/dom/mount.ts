import type opentype from 'opentype.js'
import { loadFontFromUrl } from '../fonts/load.js'
import { resolveFontUrlFromDocument } from '../fonts/resolve.js'
import { buildMaskFromCanvasText, buildMaskFromOpenType } from '../geometry/mask.js'
import {
  emissionPointsFromTopEdge,
  filterIgnitionProgress,
  type EmissionPoint,
} from '../geometry/emission.js'
import {
  createParticleEngine,
  drawParticles,
  initPool,
  spawnParticle,
  stepParticle,
} from '../particles/engine.js'
import { temperaturePhysics } from '../temperature.js'
import type { FlameTextHandle, FlameTextOptions, IgnitionOptions } from '../types.js'

const fontCache = new Map<string, Promise<opentype.Font>>()

/** Default extra canvas beyond text bounds (CSS px) — large top band for plume visibility */
function resolvePadding(
  el: HTMLElement,
  override: FlameTextOptions['flamePadding']
): { padX: number; padTop: number; padBottom: number } {
  const cs = getComputedStyle(el)
  const fs = parseFloat(cs.fontSize) || 16
  const h = Math.max(1, el.offsetHeight)
  const o = override
  const padTop = o?.top ?? Math.max(fs * 1.2, h * 0.55, 56)
  const padX = o?.x ?? Math.max(fs * 0.45, 24)
  const padBottom = o?.bottom ?? Math.max(fs * 0.45, 20)
  return { padX, padTop, padBottom }
}

function shiftEmission(points: EmissionPoint[], ox: number, oy: number): EmissionPoint[] {
  return points.map((p) => ({ x: p.x + ox, y: p.y + oy }))
}

function getOpenTypeFont(url: string): Promise<opentype.Font> {
  let p = fontCache.get(url)
  if (!p) {
    p = loadFontFromUrl(url)
    fontCache.set(url, p)
  }
  return p
}

function prefersReducedMotion(): boolean {
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ease(t: number, kind: IgnitionOptions['easing']): number {
  if (kind === 'ease-in-out') {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }
  return t
}

export function mount(target: string | Element, options: FlameTextOptions = {}): FlameTextHandle {
  const resolved = typeof target === 'string' ? document.querySelector(target) : target
  if (!resolved || !(resolved instanceof HTMLElement)) {
    throw new Error(`FlameText: element not found or not HTMLElement`)
  }
  const el: HTMLElement = resolved

  let temperature = options.temperature ?? 0.65
  let intensity = options.intensity ?? 1
  const particleCount = Math.min(800, Math.max(80, options.particleCount ?? 320))
  const wind = options.wind ?? 0
  const respectMotion = options.respectReducedMotion !== false

  const ignitionOpt = options.ignition
  const ignitionEnabled = Boolean(ignitionOpt)
  const ignitionDuration =
    typeof ignitionOpt === 'object' ? ignitionOpt.durationMs ?? 2400 : 2400
  const ignitionEasing =
    typeof ignitionOpt === 'object' ? ignitionOpt.easing ?? 'ease-in-out' : 'ease-in-out'

  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'position:relative;display:inline-block;max-width:100%;vertical-align:top;'
  const canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1;'
  canvas.setAttribute('aria-hidden', 'true')

  const parent = el.parentNode
  if (!parent) throw new Error('FlameText: element has no parent')
  parent.insertBefore(wrapper, el)
  wrapper.appendChild(el)
  wrapper.appendChild(canvas)

  const ctxRaw = canvas.getContext('2d', { alpha: true })
  if (!ctxRaw) throw new Error('FlameText: 2d context')
  const ctx: CanvasRenderingContext2D = ctxRaw

  let otFont: opentype.Font | null = null
  let fontUrlResolved: string | null = options.fontUrl ?? null
  let rebuildToken = 0

  const pool = initPool(particleCount)
  const engine = createParticleEngine(el.textContent ?? 'flame')

  let emission: ReturnType<typeof emissionPointsFromTopEdge> = []
  /** Text box (mask) size */
  let textW = 0
  let textH = 0
  /** Full canvas (text + padding) */
  let canvasW = 0
  let canvasH = 0
  let padX = 0
  let padTop = 0
  let padBottom = 0
  let dpr = 1
  let startTime = performance.now()
  let ignitionDone = !ignitionEnabled
  let raf = 0
  const reduced = respectMotion && prefersReducedMotion()

  async function resolveFont(): Promise<void> {
    const computed = getComputedStyle(el)
    const family = computed.fontFamily || 'sans-serif'
    if (!fontUrlResolved) {
      fontUrlResolved = resolveFontUrlFromDocument(family)
    }
    if (fontUrlResolved) {
      try {
        otFont = await getOpenTypeFont(fontUrlResolved)
      } catch {
        otFont = null
      }
    }
  }

  function rebuildGeometry(): void {
    const text = el.textContent ?? ''
    textW = Math.max(1, el.offsetWidth)
    textH = Math.max(1, el.offsetHeight)
    const pad = resolvePadding(el, options.flamePadding)
    padX = pad.padX
    padTop = pad.padTop
    padBottom = pad.padBottom
    canvasW = textW + padX * 2
    canvasH = textH + padTop + padBottom

    wrapper.style.paddingTop = `${padTop}px`
    wrapper.style.paddingLeft = `${padX}px`
    wrapper.style.paddingRight = `${padX}px`
    wrapper.style.paddingBottom = `${padBottom}px`

    dpr = Math.min(2.5, window.devicePixelRatio || 1)

    canvas.width = Math.max(1, Math.floor(canvasW * dpr))
    canvas.height = Math.max(1, Math.floor(canvasH * dpr))
    canvas.style.width = `${canvasW}px`
    canvas.style.height = `${canvasH}px`

    const computed = getComputedStyle(el)
    const font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`
    const textAlign = (computed.textAlign || 'left') as CanvasTextAlign
    const fontSizePx = parseFloat(computed.fontSize) || 16

    try {
      if (otFont && text) {
        const mask = buildMaskFromOpenType({
          font: otFont,
          text,
          widthCss: textW,
          heightCss: textH,
          dpr,
          fontSizePx,
          textAlign,
        })
        emission = shiftEmission(
          emissionPointsFromTopEdge(mask.topEdge, mask.dpr, 2),
          padX,
          padTop
        )
      } else {
        const mask = buildMaskFromCanvasText({
          text,
          widthCss: textW,
          heightCss: textH,
          dpr,
          font,
          textAlign,
        })
        emission = shiftEmission(
          emissionPointsFromTopEdge(mask.topEdge, mask.dpr, 2),
          padX,
          padTop
        )
      }
    } catch {
      emission = []
    }
  }

  let rebuildTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleRebuild(): void {
    if (rebuildTimer) clearTimeout(rebuildTimer)
    rebuildTimer = setTimeout(() => {
      rebuildTimer = null
      const token = ++rebuildToken
      void document.fonts.ready.then(async () => {
        await resolveFont()
        if (token !== rebuildToken) return
        rebuildGeometry()
      })
    }, 48)
  }

  const ro = new ResizeObserver(() => {
    scheduleRebuild()
  })

  ro.observe(el)

  const onWin = (): void => scheduleRebuild()
  window.addEventListener('resize', onWin)

  function loop(now: number): void {
    raf = requestAnimationFrame(loop)
    const w = el.offsetWidth
    const h = el.offsetHeight
    if (w !== textW || h !== textH) {
      rebuildGeometry()
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, canvasW, canvasH)

    if (reduced) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.35 * intensity
      ctx.fillStyle = 'rgba(255,120,40,0.4)'
      for (const p of emission) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      return
    }

    let ignitionProgress = 1
    if (ignitionEnabled && !ignitionDone) {
      const t = (now - startTime) / ignitionDuration
      if (t >= 1) {
        ignitionDone = true
        ignitionProgress = 1
      } else {
        ignitionProgress = ease(Math.max(0, t), ignitionEasing)
      }
    }

    const phys = temperaturePhysics(temperature)
    const points =
      ignitionProgress < 1
        ? filterIgnitionProgress(emission, ignitionProgress)
        : emission

    const spawnRate = Math.floor(4 * phys.spawn * intensity * (0.5 + ignitionProgress))
    for (let i = 0; i < spawnRate; i++) {
      spawnParticle(pool, points, engine.rnd, phys, ignitionProgress)
    }

    const turb = phys.turbulence
    for (const p of pool) {
      stepParticle(p, engine.noise2, engine.noise3, now, wind, turb)
    }

    drawParticles(ctx, pool, temperature, intensity)

    // Optional wet sheen during early ignition (transparent darkening on stroke only — subtle)
    if (ignitionEnabled && ignitionProgress < 0.35 && ignitionProgress > 0) {
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = (1 - ignitionProgress / 0.35) * 0.12 * intensity
      ctx.strokeStyle = 'rgba(20,25,40,0.6)'
      ctx.lineWidth = 1.5
      for (const p of points) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  const boot = async (): Promise<void> => {
    await document.fonts.ready
    await resolveFont()
    rebuildGeometry()
    startTime = performance.now()
    raf = requestAnimationFrame(loop)
  }
  void boot()

  return {
    destroy(): void {
      if (rebuildTimer) {
        clearTimeout(rebuildTimer)
        rebuildTimer = null
      }
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', onWin)
      if (canvas.parentNode === wrapper) wrapper.removeChild(canvas)
      if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(el, wrapper)
        wrapper.parentNode.removeChild(wrapper)
      }
    },
    setTemperature(t: number): void {
      temperature = Math.max(0, Math.min(1, t))
    },
    setIntensity(n: number): void {
      intensity = Math.max(0, Math.min(2, n))
    },
  }
}

export function autoInit(): void {
  document.querySelectorAll<HTMLElement>('[data-flame-text]').forEach((el) => {
    mount(el, {})
  })
}
