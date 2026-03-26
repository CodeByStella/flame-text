/**
 * Canvas fire: minimal demo integrator (vx/vy/s, buoyancy, spring) + radial gradient
 * drawn with `lighter`. Gradient stops come from the shared brand palette.
 */
import type { EmissionPoint } from '../geometry/emission.js'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  /** Radius (demo `p.s`); also used in the spring term. */
  s: number
  /** Horizontal anchor (demo `p.dx`). */
  anchorX: number
  /** 0 = slot free / skip; 1 = alive */
  active: 0 | 1
}

export type FlameRadialStop = Readonly<{ pos: number; css: string }>

export function createParticleEngine(seed: string) {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  const rnd = mulberry32(s)
  return { rnd }
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Map full-window demo coords to our padded canvas height (CSS px). */
export function demoScaleForCanvasHeight(canvasCssH: number): number {
  return Math.max(0.12, Math.min(0.58, canvasCssH / 560))
}

export function spawnParticle(
  pool: Particle[],
  points: EmissionPoint[],
  rnd: () => number,
  scale: number,
  freeSlots: number[]
): void {
  const slot = freeSlots.pop()
  if (slot === undefined) return
  if (points.length === 0) {
    freeSlots.push(slot)
    return
  }
  const ep = points[Math.floor(rnd() * points.length)]
  if (!ep) {
    freeSlots.push(slot)
    return
  }
  const p = pool[slot]!
  const m = rnd
  p.active = 1
  p.x = ep.x + (m() - 0.5) * 4 * scale
  p.y = ep.y + (m() - 0.5) * 6 * scale
  p.vx = (m() * 10 - 5) * scale
  p.vy = (m() * 10 - 7) * scale
  p.s = (m() * 70 + 5) * scale
  p.anchorX = ep.x
}

export function stepParticle(
  p: Particle,
  slot: number,
  freeSlots: number[],
  scale: number
): void {
  if (p.active !== 1) return
  p.x += p.vx
  p.y += p.vy
  p.vy -= 0.2 * scale
  p.vx += (p.anchorX - p.x) / p.s / 2
  p.s -= 1.8 * scale
  if (p.s < 1) {
    p.active = 0
    p.s = 0
    freeSlots.push(slot)
  }
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  pool: Particle[],
  globalAlphaScale: number,
  radialStops: ReadonlyArray<FlameRadialStop>
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const p of pool) {
    if (p.active !== 1 || p.s < 1) continue
    ctx.globalAlpha = Math.min(1, 0.98 * globalAlphaScale)
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s)
    for (const st of radialStops) {
      g.addColorStop(st.pos, st.css)
    }
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function initPool(n: number): Particle[] {
  return Array.from({ length: n }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    s: 0,
    anchorX: 0,
    active: 0,
  }))
}
