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
   * Defaults scale with font size and text height (strong top bias).
   */
  flamePadding?: FlamePadding
  /** Explicit font file URL (recommended for reliable vector paths + CORS) */
  fontUrl?: string
  /** 0 = cool/slow/smoky, 1 = hot/fast/bright */
  temperature?: number
  /** Overall emission strength */
  intensity?: number
  /** Max simultaneous particles (quality) */
  particleCount?: number
  /** Horizontal wind bias (-1 … 1) */
  wind?: number
  /** Skip animation when user prefers reduced motion */
  respectReducedMotion?: boolean
  /** Intro: oil wet + ignition spread along paths */
  ignition?: boolean | IgnitionOptions
}

export interface FlameTextHandle {
  destroy(): void
  setTemperature(t: number): void
  setIntensity(n: number): void
}
