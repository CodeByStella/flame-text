export interface IgnitionOptions {
  /** Total duration of intro (wet + spread) in ms */
  durationMs?: number
  /** Easing name: linear | ease-in-out */
  easing?: 'linear' | 'ease-in-out'
}

export interface FlameTextOptions {
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
