import { describe, expect, it } from 'vitest'
import {
  clamp01,
  flameColor,
  flameColorForParticle,
  flameRadiusLifeScale,
  temperaturePhysics,
} from '../src/temperature.js'

describe('temperaturePhysics', () => {
  it('increases rise with temperature', () => {
    expect(temperaturePhysics(0).rise).toBeLessThan(temperaturePhysics(1).rise)
  })
})

describe('flameColor', () => {
  it('returns valid RGBA', () => {
    const c = flameColor(0.7, 1, 0.5)
    expect(c.r).toBeGreaterThanOrEqual(0)
    expect(c.r).toBeLessThanOrEqual(1)
    expect(c.a).toBeGreaterThan(0)
  })
})

describe('flameRadiusLifeScale', () => {
  it('is largest when young and shrinks with age', () => {
    expect(flameRadiusLifeScale(1)).toBeGreaterThan(flameRadiusLifeScale(0.5))
    expect(flameRadiusLifeScale(0.5)).toBeGreaterThan(flameRadiusLifeScale(0))
  })
})

describe('flameColorForParticle', () => {
  it('varies RGB slightly between variants at same life', () => {
    const a = flameColorForParticle(0.65, 0.6, 0.5, 0.1)
    const b = flameColorForParticle(0.65, 0.6, 0.5, 0.9)
    expect(Math.abs(a.g - b.g)).toBeGreaterThan(0.01)
  })
})

describe('clamp01', () => {
  it('clamps', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(0.5)).toBe(0.5)
  })
})
