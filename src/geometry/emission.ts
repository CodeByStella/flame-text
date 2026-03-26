export interface EmissionPoint {
  x: number
  y: number
}

/** Build sparse emission points along top edge (CSS pixels). */
export function emissionPointsFromTopEdge(
  topEdge: Int16Array,
  dpr: number,
  stepPx = 2
): EmissionPoint[] {
  const out: EmissionPoint[] = []
  const w = topEdge.length
  for (let col = 0; col < w; col += Math.max(1, Math.round(stepPx * dpr))) {
    const y = topEdge[col]
    if (y < 0) continue
    const x = col / dpr
    out.push({ x, y })
  }
  return out
}

/** Bottom edge of glyph per column (for fire along the base / lower strokes). */
export function emissionPointsFromBottomEdge(
  bottomEdge: Int16Array,
  dpr: number,
  stepPx = 3
): EmissionPoint[] {
  const out: EmissionPoint[] = []
  const w = bottomEdge.length
  for (let col = 0; col < w; col += Math.max(1, Math.round(stepPx * dpr))) {
    const y = bottomEdge[col]
    if (y < 0) continue
    const x = col / dpr
    out.push({ x, y })
  }
  return out
}

/**
 * Vertical mid-depth per column: `(top + bottom) / 2` — inside thick strokes, not the outer contour.
 * Mimics “hottest” core along the stroke body (see horizontal bar of 志, etc.).
 */
export function emissionPointsFromColumnMidDepth(
  topEdge: Int16Array,
  bottomEdge: Int16Array,
  dpr: number,
  stepPx = 2
): EmissionPoint[] {
  const out: EmissionPoint[] = []
  const w = topEdge.length
  const step = Math.max(1, Math.round(stepPx * dpr))
  for (let col = 0; col < w; col += step) {
    const yt = topEdge[col]
    const yb = bottomEdge[col]
    if (yt < 0 || yb < 0) continue
    const x = col / dpr
    out.push({ x, y: (yt + yb) / 2 })
  }
  return out
}

/**
 * Horizontal mid-depth per row: `(left + right) / 2` — core of vertical/diagonal strokes.
 */
export function emissionPointsFromRowMidDepth(
  leftEdge: Int16Array,
  rightEdge: Int16Array,
  dpr: number,
  stepPx = 3
): EmissionPoint[] {
  const out: EmissionPoint[] = []
  const h = leftEdge.length
  const step = Math.max(1, Math.round(stepPx * dpr))
  for (let row = 0; row < h; row += step) {
    const xl = leftEdge[row]
    const xr = rightEdge[row]
    if (xl < 0 || xr < 0) continue
    const y = row / dpr
    out.push({ x: (xl + xr) / 2, y })
  }
  return out
}

/**
 * Sample the outer silhouette in CSS space: top/bottom per column and left/right per row.
 * Ensures thin strokes and tips get spawn candidates (interior-only fields underweight `dist === 0`).
 */
export function emissionPointsFromOutlineEdges(
  topEdge: Int16Array,
  bottomEdge: Int16Array,
  leftEdge: Int16Array,
  rightEdge: Int16Array,
  dpr: number,
  stepPx = 1
): EmissionPoint[] {
  const step = Math.max(1, Math.round(stepPx * dpr))
  const out: EmissionPoint[] = []
  const w = topEdge.length
  const h = leftEdge.length

  for (let col = 0; col < w; col += step) {
    const yt = topEdge[col]!
    if (yt >= 0) out.push({ x: col / dpr, y: yt })
    const yb = bottomEdge[col]!
    if (yb >= 0) out.push({ x: col / dpr, y: yb })
  }
  for (let row = 0; row < h; row += step) {
    const xl = leftEdge[row]!
    if (xl >= 0) out.push({ x: xl, y: row / dpr })
    const xr = rightEdge[row]!
    if (xr >= 0) out.push({ x: xr, y: row / dpr })
  }
  return out
}

/** Only emit along first `progress` fraction of horizontal span (ignition spread). */
export function filterIgnitionProgress(points: EmissionPoint[], progress: number): EmissionPoint[] {
  if (progress >= 1) return points
  if (progress <= 0) return []
  if (points.length === 0) return []
  let minX = Infinity
  let maxX = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
  }
  const span = maxX - minX || 1
  const cutoff = minX + span * progress
  return points.filter((p) => p.x <= cutoff)
}
