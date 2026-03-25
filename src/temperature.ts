/** Map normalized temperature [0,1] to physics multipliers */
export function temperaturePhysics(t: number): {
  rise: number
  turbulence: number
  life: number
  spawn: number
} {
  const x = clamp01(t)
  return {
    rise: 0.35 + x * 1.25,
    turbulence: 0.4 + x * 0.9,
    life: 0.6 + x * 0.55,
    spawn: 0.5 + x * 0.85,
  }
}

/** RGBA for flame particle: t = temperature, f = fuel attachment 0 (plume) … 1 (edge) */
export function flameColor(
  t: number,
  lifeRatio: number,
  fuelAttachment: number
): { r: number; g: number; b: number; a: number } {
  const temp = clamp01(t)
  // Blackbody-ish core
  const hotR = 1
  const hotG = 0.85 + temp * 0.15
  const hotB = 0.35 + temp * 0.45
  // Cool fuel line (blue/indigo) when attached to edge
  const coolR = 0.2 + temp * 0.25
  const coolG = 0.25 + temp * 0.2
  const coolB = 0.85 + temp * 0.1

  const f = clamp01(fuelAttachment)
  let r = lerp(coolR, hotR, f * 0.35 + (1 - f) * 0.85)
  let g = lerp(coolG, hotG, f * 0.25 + (1 - f) * 0.9)
  let b = lerp(coolB, hotB, f * 0.5 + (1 - f) * 0.75)

  // Life: fade to dark red/smoke
  const age = clamp01(1 - lifeRatio)
  r = lerp(r * 0.35, r, lifeRatio)
  g = lerp(g * 0.2, g, lifeRatio)
  b = lerp(b * 0.15, b, lifeRatio)

  // Slight soot at end of life
  if (age > 0.6) {
    const s = (age - 0.6) / 0.4
    r *= 1 - s * 0.2
    g *= 1 - s * 0.35
    b *= 1 - s * 0.4
  }

  const a = Math.min(1, 0.15 + lifeRatio * 0.85) * (0.4 + temp * 0.6)

  return { r, g, b, a }
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
