import { createNoise2D, createNoise3D } from 'simplex-noise'
import { flameColor } from '../temperature.js'
import type { EmissionPoint } from '../geometry/emission.js'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  fuel: number
  seed: number
}

export function createParticleEngine(seed: string) {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  const rnd = mulberry32(s)
  const noise2 = createNoise2D(() => rnd())
  const noise3 = createNoise3D(() => rnd())

  return { rnd, noise2, noise3 }
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function spawnParticle(
  pool: Particle[],
  points: EmissionPoint[],
  rnd: () => number,
  physics: { rise: number; life: number },
  ignitionProgress: number
): void {
  const slot = pool.findIndex((p) => p.life <= 0)
  if (slot < 0 || points.length === 0) return
  const ep = points[Math.floor(rnd() * points.length)]
  if (!ep) return
  const p = pool[slot]!
  p.x = ep.x + (rnd() - 0.5) * 2
  p.y = ep.y + (rnd() - 0.5) * 1.5
  p.vx = (rnd() - 0.5) * 0.35 * physics.rise
  p.vy = (-1.8 - rnd() * 1.2) * physics.rise
  p.maxLife = (45 + rnd() * 55) * physics.life
  p.life = p.maxLife
  p.fuel = 0.4 + rnd() * 0.55 * Math.min(1, ignitionProgress + 0.3)
  p.seed = rnd() * 10000
}

export function stepParticle(
  p: Particle,
  noise2: ReturnType<typeof createNoise2D>,
  noise3: ReturnType<typeof createNoise3D>,
  time: number,
  wind: number,
  turbulence: number
): void {
  if (p.life <= 0) return
  const nx = noise3(p.x * 0.02, p.y * 0.02, time * 0.0008)
  const ny = noise2(p.x * 0.015 + time * 0.0003, p.y * 0.015)
  p.vx += nx * 0.08 * turbulence + wind * 0.02
  p.vy += ny * 0.04 * turbulence + 0.02
  p.x += p.vx
  p.y += p.vy
  p.life -= 1
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  pool: Particle[],
  temperature: number,
  globalAlphaScale: number
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const p of pool) {
    if (p.life <= 0) continue
    const lifeRatio = p.life / p.maxLife
    const fuelAttach = lifeRatio > 0.85 ? p.fuel : lifeRatio * 0.3
    const c = flameColor(temperature, lifeRatio, fuelAttach)
    const size = (0.8 + (1 - lifeRatio) * 2.5) * (0.5 + temperature * 0.5)
    ctx.globalAlpha = c.a * globalAlphaScale
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4)
    g.addColorStop(0, `rgba(255,255,255,${0.35})`)
    g.addColorStop(
      0.35,
      `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},0.5)`
    )
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2)
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
    life: 0,
    maxLife: 1,
    fuel: 0.5,
    seed: 0,
  }))
}
