import { describe, expect, it } from 'vitest'
import {
  emissionPointsFromColumnMidDepth,
  emissionPointsFromOutlineEdges,
  emissionPointsFromRowMidDepth,
  filterIgnitionProgress,
} from '../src/geometry/emission.js'

describe('emissionPointsFromColumnMidDepth', () => {
  it('places y at vertical midpoint of top/bottom per column', () => {
    const w = 4
    const top = new Int16Array(w)
    const bot = new Int16Array(w)
    for (let i = 0; i < w; i++) {
      top[i] = 8
      bot[i] = 24
    }
    const pts = emissionPointsFromColumnMidDepth(top, bot, 1, 1)
    expect(pts.length).toBe(4)
    for (const p of pts) expect(p.y).toBe(16)
  })
})

describe('emissionPointsFromRowMidDepth', () => {
  it('places x at horizontal midpoint of left/right per row', () => {
    const h = 3
    const left = new Int16Array(h)
    const right = new Int16Array(h)
    for (let i = 0; i < h; i++) {
      left[i] = 10
      right[i] = 30
    }
    const pts = emissionPointsFromRowMidDepth(left, right, 1, 1)
    expect(pts.length).toBe(3)
    for (const p of pts) expect(p.x).toBe(20)
  })
})

describe('emissionPointsFromOutlineEdges', () => {
  it('includes left and right tips of a thin horizontal bar', () => {
    const dpr = 1
    const w = 2
    const h = 1
    const topEdge = new Int16Array(w)
    const bottomEdge = new Int16Array(w)
    const leftEdge = new Int16Array(h)
    const rightEdge = new Int16Array(h)
    topEdge[0] = 0
    topEdge[1] = 0
    bottomEdge[0] = 0
    bottomEdge[1] = 0
    leftEdge[0] = 0
    rightEdge[0] = 1
    const pts = emissionPointsFromOutlineEdges(
      topEdge,
      bottomEdge,
      leftEdge,
      rightEdge,
      dpr,
      1
    )
    const xs = new Set(pts.map((p) => p.x))
    expect(xs.has(0)).toBe(true)
    expect(xs.has(1)).toBe(true)
  })
})

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
