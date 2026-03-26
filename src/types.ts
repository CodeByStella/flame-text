import type { FlamePaletteInput } from './palette.js'

export type { FlamePaletteInput } from './palette.js'

export interface IgnitionOptions {
  /** Total duration of intro (wet + spread) in ms */
  durationMs?: number
  /** Easing name: linear | ease-in-out */
  easing?: 'linear' | 'ease-in-out'
}

export interface FlamePadding {
  /** Extra canvas space above the text (px) for the flame plume */
  top?: number
  /** Horizontal inset on each side (px) */
  x?: number
  /** Extra space below the text (px) */
  bottom?: number
}

export interface FlameTextOptions {
  /**
   * Extra canvas area beyond the text box so rising flames are not clipped.
   * Does **not** expand the wrapper in document flow: the canvas overflows with `position:absolute`
   * and negative inset; layout size stays the text’s box.
   */
  flamePadding?: FlamePadding
  /** Explicit font file URL (recommended for reliable vector paths + CORS) */
  fontUrl?: string
  /** Scales spawn rate together with `intensity` (particle motion uses the built-in demo model). */
  temperature?: number
  /** Overall emission strength (spawn budget per frame). */
  intensity?: number
  /** Max simultaneous particles (default 1000, clamped 500–5000). Higher = denser flame, more GPU/CPU cost. */
  particleCount?: number
  /** Reserved; particle motion does not apply wind (demo-style integrator only). */
  wind?: number
  /** Skip animation when user prefers reduced motion */
  respectReducedMotion?: boolean
  /** Intro: oil wet + ignition spread along paths */
  ignition?: boolean | IgnitionOptions
  /**
   * Outline (`-webkit-text-stroke`), color from `palette.textStroke` (default `#FEFFF4`).
   * Default `true`; set `false` to skip stroke only — `palette.textFill` still applies to the glyphs.
   */
  textStroke?: boolean
  /** Override default stroke / fill / flame gradient hex colors. */
  palette?: FlamePaletteInput
  /**
   * CSS `z-index` of the flame canvas (default `-1`, behind the text).
   * Use `0` or higher to paint flames above siblings; give the text `position: relative; z-index: 1` if it should stay on top.
   */
  canvasZIndex?: number | string
}

export interface FlameTextHandle {
  destroy(): void
  setTemperature(t: number): void
  setIntensity(n: number): void
  /** Update canvas stacking (`z-index`). */
  setCanvasZIndex(z: number | string): void
}
