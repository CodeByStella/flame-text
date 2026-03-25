import { describe, expect, it } from 'vitest'
import { normalizeFontFamily } from '../../src/fonts/resolve.js'

describe('normalizeFontFamily', () => {
  it('strips quotes and first family', () => {
    expect(normalizeFontFamily('"Bebas Neue", sans-serif')).toBe('bebas neue')
  })
  it('lowercases', () => {
    expect(normalizeFontFamily('Arial')).toBe('arial')
  })
})
