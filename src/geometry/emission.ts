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
