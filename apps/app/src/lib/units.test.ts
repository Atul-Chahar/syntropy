import { describe, expect, it } from 'vitest'
import { fmtBodyW, fmtFoodLabel, fmtHeight, toKg } from './units'

describe('units', () => {
  it('formats body weight and converts back', () => {
    expect(fmtBodyW(72.4, 'metric')).toBe('72.4 kg')
    expect(fmtBodyW(72.4, 'imperial')).toBe('159.6 lb')
    expect(toKg(159.6, 'imperial')).toBeCloseTo(72.39, 1)
  })
  it('formats height in feet and inches', () => {
    expect(fmtHeight(178, 'metric')).toBe('178 cm')
    expect(fmtHeight(178, 'imperial')).toBe('5′10″')
    expect(fmtHeight(152.4, 'imperial')).toBe('5′0″')
  })
  it('shows food grams as ounces', () => {
    expect(fmtFoodLabel('1 medium · 40 g', 'imperial')).toBe('1 medium · 1.4 oz')
    expect(fmtFoodLabel('1 plate · 525 g', 'imperial')).toBe('1 plate · 19 oz')
    expect(fmtFoodLabel('1 medium · 40 g', 'metric')).toBe('1 medium · 40 g')
  })
})
