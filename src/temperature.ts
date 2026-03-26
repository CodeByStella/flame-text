/** Map normalized temperature [0,1] to physics multipliers */
export function temperaturePhysics(t: number): {
  rise: number
  turbulence: number
  life: number
  spawn: number
} {
  const x = clamp01(t)
  return {
    rise: 0.42 + x * 1.35,
    turbulence: 0.45 + x * 0.95,
    life: 0.72 + x * 0.65,
    spawn: 0.58 + x * 0.9,
  }
}

/**
 * Reference-style fire: yellow–white at the fuel line, rich orange mid-plume,
 * wispy brown/grey transparent tips. `lifeRatio` 1 = newborn, 0 = dying.
 * @deprecated Prefer `flameColorForParticle` with variant for variety.
 */
export function flameColor(
  t: number,
  lifeRatio: number,
  fuelAttachment: number
): { r: number; g: number; b: number; a: number } {
  return flameColorForParticle(t, lifeRatio, fuelAttachment, 0.5)
}

/**
 * Per-particle color: same hot→smoke ramp as reference, shifted by `variant` (0–1)
 * so adjacent specks differ (ember / orange / deep red / smoke mix).
 */
export function flameColorForParticle(
  t: number,
  lifeRatio: number,
  fuelAttachment: number,
  variant: number
): { r: number; g: number; b: number; a: number } {
  const temp = clamp01(t)
  const young = clamp01(lifeRatio)
  const fuel = clamp01(fuelAttachment)
  const v = clamp01(variant)

  // Shift when smoke kicks in and slight hue spread (not all identical orange)
  const smokeBias = (v - 0.5) * 0.22
  const warmBias = (v - 0.5) * 0.12

  let r = 0.98 + warmBias * 0.08
  let g = 0.38 + temp * 0.22 + warmBias * 0.1
  let b = 0.06 + temp * 0.08

  const core = young * (0.55 + fuel * 0.45)
  r = lerp(r, 1, core * 0.42)
  g = lerp(g, 0.92 + temp * 0.06, core * 0.55)
  b = lerp(b, 0.42 + temp * 0.2, core * 0.65)

  const mid = clamp01(1 - Math.abs(young - 0.55) * 2.2)
  g = lerp(g, 0.52 + temp * 0.18 + v * 0.06, mid * 0.2)

  const age = clamp01(1 - young)
  const smokeStart = 0.25 + smokeBias
  if (age > smokeStart) {
    const s = (age - smokeStart) / Math.max(0.15, 1 - smokeStart)
    const sm = clamp01(s)
    r = lerp(r, 0.48 + v * 0.08, sm * 0.58)
    g = lerp(g, 0.3 + v * 0.05, sm * 0.64)
    b = lerp(b, 0.24 + v * 0.06, sm * 0.6)
  }

  let a = (0.28 + young * 0.58) * (0.52 + temp * 0.48)
  const fadeStart = 0.4 + (v - 0.5) * 0.15
  if (age > fadeStart) {
    a *= lerp(1, 0.2, clamp01((age - fadeStart) / (1 - fadeStart)))
  }

  return { r, g, b, a }
}

/**
 * Visual scale vs lifetime: **largest when young**, shrinks as particle ages (not bubble growth).
 */
export function flameRadiusLifeScale(lifeRatio: number): number {
  const u = clamp01(lifeRatio)
  return 0.26 + 0.74 * Math.pow(u, 0.78)
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
