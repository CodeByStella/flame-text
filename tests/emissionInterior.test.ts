import { describe, expect, it } from 'vitest'
import {
  emissionPointsFromInteriorField,
  manhattanInteriorDistance,
} from '../src/geometry/emissionInterior.js'

describe('manhattanInteriorDistance', () => {
  it('is 0 on boundary and higher in center of a solid block', () => {
    const w = 5
    const h = 5
    const inside = new Uint8Array(w * h).fill(1)
    const d = manhattanInteriorDistance(inside, w, h)
    const center = 2 * w + 2
    expect(d[center]).toBeGreaterThan(0)
    expect(d[0]).toBe(0)
    expect(d[center]).toBeGreaterThanOrEqual(d[w + 1]!)
  })
})

describe('emissionPointsFromInteriorField', () => {
  it('returns points only inside the mask', () => {
    const w = 4
    const h = 4
    const inside = new Uint8Array(w * h)
    inside[5] = 1
    inside[6] = 1
    const dist = manhattanInteriorDistance(inside, w, h)
    const pts = emissionPointsFromInteriorField(inside, dist, w, h, 1, 1, 100)
    expect(pts.length).toBeGreaterThan(0)
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThan(w)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThan(h)
    }
  })
})
