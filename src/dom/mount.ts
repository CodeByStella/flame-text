import type opentype from 'opentype.js'
import { loadFontFromUrl } from '../fonts/load.js'
import { resolveFontUrlFromDocument } from '../fonts/resolve.js'
import {
  buildMaskFromCanvasText,
  buildMaskFromOpenType,
  type MaskResult,
} from '../geometry/mask.js'
import {
  emissionPointsFromOutlineEdges,
  filterIgnitionProgress,
  type EmissionPoint,
} from '../geometry/emission.js'
import {
  emissionPointsFromInteriorField,
  manhattanInteriorDistance,
} from '../geometry/emissionInterior.js'
import { buildFlameRadialStops, hexToRgb, mergeFlamePalette } from '../palette.js'
import {
  createParticleEngine,
  demoScaleForCanvasHeight,
  drawParticles,
  initPool,
  spawnParticle,
  stepParticle,
} from '../particles/engine.js'
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
  // Reference-style envelope: plume ~0.65× text height above + generous sides (≈1.5–2× text bbox)
  const padTop = o?.top ?? Math.max(fs * 1.55, h * 0.68, 88)
  const padX = o?.x ?? Math.max(fs * 0.62, h * 0.14, 32)
  const padBottom = o?.bottom ?? Math.max(fs * 0.58, h * 0.14, 28)
  return { padX, padTop, padBottom }
}

function shiftEmission(points: EmissionPoint[], ox: number, oy: number): EmissionPoint[] {
  return points.map((p) => ({ x: p.x + ox, y: p.y + oy }))
}

/**
 * Emit from the **full glyph interior** plus explicit **silhouette edges** so outer tips
 * and thin strokes stay lit (interior-only sampling skews toward thick stroke cores).
 */
function mergeAndShiftEmission(mask: MaskResult, ox: number, oy: number): EmissionPoint[] {
  const dist = manhattanInteriorDistance(mask.inside, mask.rasterW, mask.rasterH)
  const interior = emissionPointsFromInteriorField(
    mask.inside,
    dist,
    mask.rasterW,
    mask.rasterH,
    mask.dpr,
    1,
    4800
  )
  const outline = emissionPointsFromOutlineEdges(
    mask.topEdge,
    mask.bottomEdge,
    mask.leftEdge,
    mask.rightEdge,
    mask.dpr,
    1
  )
  // Extra outline copies so random spawn favors the outer silhouette (tips and thin strokes).
  const pts = interior.concat(outline, outline, outline)
  return shiftEmission(pts, ox, oy)
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

  const resolvedPalette = mergeFlamePalette(options.palette)
  const flameRadialStops = buildFlameRadialStops(resolvedPalette.flame)

  let temperature = options.temperature ?? 0.65
  let intensity = options.intensity ?? 1
  /** Default pool sized for laptops; raise `particleCount` for denser flame on fast GPUs. */
  const particleCount = Math.min(5000, Math.max(500, options.particleCount ?? 1000))
  const respectMotion = options.respectReducedMotion !== false

  const ignitionOpt = options.ignition
  const ignitionEnabled = Boolean(ignitionOpt)
  const ignitionDuration =
    typeof ignitionOpt === 'object' ? ignitionOpt.durationMs ?? 2400 : 2400
  const ignitionEasing =
    typeof ignitionOpt === 'object' ? ignitionOpt.easing ?? 'ease-in-out' : 'ease-in-out'

  const textStrokeEnabled = options.textStroke !== false
  const savedStrokeWidth = el.style.webkitTextStrokeWidth
  const savedStrokeColor = el.style.webkitTextStrokeColor
  const savedPaintOrder = el.style.paintOrder
  const savedFillColor = el.style.color
  const savedPointerEvents = el.style.pointerEvents

  function formatZIndex(z: number | string): string {
    return typeof z === 'number' && !Number.isFinite(z) ? '-1' : String(z)
  }

  let canvasZIndex: number | string = options.canvasZIndex ?? -1

  function applyCanvasZIndex(): void {
    canvas.style.zIndex = formatZIndex(canvasZIndex)
  }

  function syncTextDecor(): void {
    el.style.color = resolvedPalette.textFill
    if (!textStrokeEnabled) return
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16
    const strokePx = Math.max(2, Math.min(8, fs * (0.072 + temperature * 0.048)))
    el.style.webkitTextStrokeWidth = `${strokePx}px`
    el.style.webkitTextStrokeColor = resolvedPalette.textStroke
    el.style.paintOrder = 'stroke fill'
  }

  const wrapper = document.createElement('div')
  /**
   * Layout box matches the text only; canvas overflows with negative inset.
   * `pointer-events: none` on wrapper + text so the full line box / canvas overflow never steals clicks
   * from siblings (e.g. buttons under a huge `font-size`). Canvas stays non-interactive too.
   */
  wrapper.style.cssText =
    'position:relative;isolation:isolate;display:inline-block;max-width:100%;vertical-align:top;overflow:visible;pointer-events:none;'
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;pointer-events:none;'
  applyCanvasZIndex()
  canvas.setAttribute('aria-hidden', 'true')

  const parent = el.parentNode
  if (!parent) throw new Error('FlameText: element has no parent')
  parent.insertBefore(wrapper, el)
  wrapper.appendChild(el)
  wrapper.appendChild(canvas)
  el.style.pointerEvents = 'none'

  const ctxRaw = canvas.getContext('2d', { alpha: true })
  if (!ctxRaw) throw new Error('FlameText: 2d context')
  const ctx: CanvasRenderingContext2D = ctxRaw

  let otFont: opentype.Font | null = null
  let fontUrlResolved: string | null = options.fontUrl ?? null
  let rebuildToken = 0

  const pool = initPool(particleCount)
  const freeSlots: number[] = Array.from({ length: particleCount }, (_, i) => i)
  const engine = createParticleEngine(el.textContent ?? 'flame')

  let emission: EmissionPoint[] = []
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

    dpr = Math.min(2.5, window.devicePixelRatio || 1)

    canvas.width = Math.max(1, Math.floor(canvasW * dpr))
    canvas.height = Math.max(1, Math.floor(canvasH * dpr))
    canvas.style.width = `${canvasW}px`
    canvas.style.height = `${canvasH}px`
    canvas.style.left = `${-padX}px`
    canvas.style.top = `${-padTop}px`

    const computed = getComputedStyle(el)
    const font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`
    const textAlign = (computed.textAlign || 'left') as CanvasTextAlign
    const direction = (computed.direction || 'ltr') as CanvasDirection
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
          fontCss: font,
          direction,
        })
        emission = mergeAndShiftEmission(mask, padX, padTop)
      } else {
        const mask = buildMaskFromCanvasText({
          text,
          widthCss: textW,
          heightCss: textH,
          dpr,
          font,
          textAlign,
          direction,
        })
        emission = mergeAndShiftEmission(mask, padX, padTop)
      }
    } catch {
      emission = []
    }

    syncTextDecor()
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
      const rc = hexToRgb(resolvedPalette.textFill)
      ctx.fillStyle = `rgba(${rc.r},${rc.g},${rc.b},0.4)`
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

    const points =
      ignitionProgress < 1
        ? filterIgnitionProgress(emission, ignitionProgress)
        : emission

    const scale = demoScaleForCanvasHeight(canvasH)
    // Demo spawns 50/frame; scale by intensity, temperature, ignition, and free slots.
    const targetSpawn = Math.floor(
      50 *
        intensity *
        (0.45 + 0.55 * ignitionProgress) *
        (0.65 + 0.35 * temperature)
    )
    const spawnRate = Math.min(Math.max(0, targetSpawn), freeSlots.length)
    for (let i = 0; i < spawnRate; i++) {
      spawnParticle(pool, points, engine.rnd, scale, freeSlots)
    }

    for (let i = 0; i < pool.length; i++) {
      stepParticle(pool[i]!, i, freeSlots, scale)
    }

    drawParticles(ctx, pool, intensity, flameRadialStops)

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
      el.style.color = savedFillColor
      el.style.pointerEvents = savedPointerEvents
      if (textStrokeEnabled) {
        el.style.webkitTextStrokeWidth = savedStrokeWidth
        el.style.webkitTextStrokeColor = savedStrokeColor
        el.style.paintOrder = savedPaintOrder
      }
      if (canvas.parentNode === wrapper) wrapper.removeChild(canvas)
      if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(el, wrapper)
        wrapper.parentNode.removeChild(wrapper)
      }
    },
    setTemperature(t: number): void {
      temperature = Math.max(0, Math.min(1, t))
      syncTextDecor()
    },
    setIntensity(n: number): void {
      intensity = Math.max(0, Math.min(2, n))
    },
    setCanvasZIndex(z: number | string): void {
      canvasZIndex = z
      applyCanvasZIndex()
    },
  }
}

export function autoInit(): void {
  document.querySelectorAll<HTMLElement>('[data-flame-text]').forEach((el) => {
    mount(el, {})
  })
}
