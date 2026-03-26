/** Default brand colors (stroke, fill, flame ramp). */
export const DEFAULT_FLAME_PALETTE = {
  textStroke: '#FEFFF4',
  textFill: '#F95128',
  /**
   * Five thermal anchors: white-hot core → warm → orange → deep red → ember.
   * `buildFlameRadialStops` maps center = bright, outer = red-shifted “cooler” side.
   */
  flame: ['#FFFAF4', '#FFC98A', '#E04A28', '#9A1410', '#4A0A08'] as const,
} as const

export type FlameHex5 = readonly [string, string, string, string, string]

export interface FlamePaletteInput {
  textStroke?: string
  textFill?: string
  /** Exactly five hex colors: same order as defaults. */
  flame?: readonly string[]
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace(/^#/, '')
  const n =
    h.length === 3
      ? parseInt(
          h
            .split('')
            .map((c) => c + c)
            .join(''),
          16
        )
      : parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function lerpRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  }
}

/** Outer flame: shift toward deep red (dampen green/blue) — “lower temperature” rim. */
function redCooler(rgb: { r: number; g: number; b: number }, amount: number): { r: number; g: number; b: number } {
  const u = Math.max(0, Math.min(1, amount))
  return {
    r: Math.min(255, Math.round(rgb.r + 22 * u)),
    g: Math.max(0, Math.round(rgb.g * (1 - 0.48 * u))),
    b: Math.max(0, Math.round(rgb.b * (1 - 0.58 * u))),
  }
}

function rgba(rgb: { r: number; g: number; b: number }, a: number): string {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
}

/**
 * Radial gradient: **center = high temperature** (bright white–yellow), **rim = red** (cooler side).
 * Uses the five palette anchors with extra red weight toward `pos → 1`.
 */
export function buildFlameRadialStops(flame: FlameHex5): ReadonlyArray<{ pos: number; css: string }> {
  const [c0, c1, c2, c3, c4] = flame.map(hexToRgb)

  const coreHot = {
    r: Math.min(255, c0.r + 14),
    g: Math.min(255, c0.g + 12),
    b: Math.min(255, c0.b + 10),
  }

  const inner = lerpRgb(coreHot, c1, 0.45)
  const midWarm = lerpRgb(c1, c2, 0.5)
  const midOrange = c2
  const outer = redCooler(lerpRgb(c2, c4, 0.5), 0.32)
  const rim = redCooler(lerpRgb(c4, c3, 0.35), 0.58)
  const edgeFade = redCooler(lerpRgb(c3, c4, 0.55), 0.72)

  return [
    { pos: 0, css: rgba(coreHot, 1) },
    { pos: 0.07, css: rgba(c0, 0.99) },
    { pos: 0.18, css: rgba(inner, 0.94) },
    { pos: 0.32, css: rgba(midWarm, 0.88) },
    { pos: 0.48, css: rgba(midOrange, 0.78) },
    { pos: 0.62, css: rgba(outer, 0.58) },
    { pos: 0.78, css: rgba(rim, 0.36) },
    { pos: 1, css: rgba(edgeFade, 0) },
  ] as const
}

export function mergeFlamePalette(override?: FlamePaletteInput): {
  textStroke: string
  textFill: string
  flame: FlameHex5
} {
  const o = override ?? {}
  const f = o.flame
  let flame: FlameHex5 = DEFAULT_FLAME_PALETTE.flame as unknown as FlameHex5
  if (f && f.length === 5) {
    flame = [f[0]!, f[1]!, f[2]!, f[3]!, f[4]!] as FlameHex5
  }
  return {
    textStroke: o.textStroke ?? DEFAULT_FLAME_PALETTE.textStroke,
    textFill: o.textFill ?? DEFAULT_FLAME_PALETTE.textFill,
    flame,
  }
}
