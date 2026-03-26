import type { EmissionPoint } from './emission.js'

const NB4 = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const

/**
 * Manhattan steps from each interior pixel to the nearest glyph boundary
 * (inside pixel touching outside or canvas edge). Thick strokes get larger values toward the middle.
 */
export function manhattanInteriorDistance(inside: Uint8Array, w: number, h: number): Int32Array {
  const n = w * h
  const dist = new Int32Array(n)
  const q: number[] = []

  for (let i = 0; i < n; i++) {
    dist[i] = inside[i] ? -1 : 0
  }

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const i = row * w + col
      if (!inside[i]) continue
      let boundary = row === 0 || row === h - 1 || col === 0 || col === w - 1
      if (!boundary) {
        for (const [dr, dc] of NB4) {
          const j = (row + dr) * w + (col + dc)
          if (!inside[j]) {
            boundary = true
            break
          }
        }
      }
      if (boundary) {
        dist[i] = 0
        q.push(i)
      }
    }
  }

  let qi = 0
  while (qi < q.length) {
    const i = q[qi++]
    const d = dist[i]
    const row = (i / w) | 0
    const col = i % w
    for (const [dr, dc] of NB4) {
      const nr = row + dr
      const nc = col + dc
      if (nr < 0 || nr >= h || nc < 0 || nc >= w) continue
      const j = nr * w + nc
      if (!inside[j] || dist[j] !== -1) continue
      dist[j] = d + 1
      q.push(j)
    }
  }

  return dist
}

/**
 * Dense samples on the glyph interior (follows every stroke), with extra weight where
 * `dist` is large (center of thick strokes = hotter).
 */
export function emissionPointsFromInteriorField(
  inside: Uint8Array,
  dist: Int32Array,
  w: number,
  h: number,
  dpr: number,
  strideCssPx = 2,
  maxPoints = 4500
): EmissionPoint[] {
  const stride = Math.max(1, Math.round(strideCssPx * dpr))
  const out: EmissionPoint[] = []

  for (let row = 0; row < h; row += stride) {
    for (let col = 0; col < w; col += stride) {
      const i = row * w + col
      if (!inside[i]) continue
      const d = dist[i]
      if (d < 0) continue
      const x = col / dpr
      const y = row / dpr
      out.push({ x, y })
      // Boundary pixels (dist 0–1) are easy to under-spawn vs thick interiors; boost them.
      const edgeBoost = d <= 0 ? 3 : d === 1 ? 2 : 0
      const coreBonus = d <= 0 ? 0 : Math.min(5, 1 + (d >> 1))
      const bonus = edgeBoost + coreBonus
      for (let b = 0; b < bonus; b++) {
        out.push({ x, y })
      }
    }
  }

  if (out.length <= maxPoints) return out
  const step = Math.ceil(out.length / maxPoints)
  const thinned: EmissionPoint[] = []
  for (let i = 0; i < out.length; i += step) {
    thinned.push(out[i]!)
  }
  return thinned
}
