import { describe, expect, it } from 'vitest'
import { filterIgnitionProgress } from '../src/geometry/emission.js'

describe('filterIgnitionProgress', () => {
  const pts = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
  ]
  it('returns all when progress is 1', () => {
    expect(filterIgnitionProgress(pts, 1).length).toBe(3)
  })
  it('returns empty when progress is 0', () => {
    expect(filterIgnitionProgress(pts, 0).length).toBe(0)
  })
  it('returns subset when progress is partial', () => {
    const half = filterIgnitionProgress(pts, 0.5)
    expect(half.length).toBeGreaterThan(0)
    expect(half.length).toBeLessThan(3)
  })
})
