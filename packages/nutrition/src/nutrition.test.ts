import { describe, expect, it } from 'vitest'
import {
  bmr,
  computeTargets,
  dayTotals,
  FOOD_BY_ID,
  FOODS,
  formatQty,
  itemFromFood,
  macroSplit,
  matchFood,
  mealTotals,
  searchFoods,
  trendRate,
  weeklyAdjustment,
  weightTrend,
} from './index'

const atul = {
  sex: 'male' as const,
  age: 28,
  heightCm: 176,
  weightKg: 74.2,
  activity: 'light' as const,
  bodyFatPct: 16,
  trainingDaysPerWeek: 4,
}

describe('food table', () => {
  it('has about 150 foods with unique ids and sane values', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(150)
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length)
    for (const f of FOODS) {
      const fromMacros = f.protein * 4 + f.carbs * 4 + f.fat * 9
      // Macros should roughly explain the calories (fibre and rounding leave some slack).
      expect(Math.abs(fromMacros - f.kcal), f.id).toBeLessThan(Math.max(35, f.kcal * 0.2))
    }
  })

  it('splits energy between macros', () => {
    const s = macroSplit({ kcal: 0, protein: 10, carbs: 10, fat: 0 })
    expect(s.protein).toBeCloseTo(0.5)
    expect(s.fat).toBe(0)
  })

  it('formats quantities in Indian units', () => {
    expect(formatQty(2, 'pc')).toBe('2 pc')
    expect(formatQty(0.5, 'katori')).toBe('½ katori')
    expect(formatQty(1.5, 'glass')).toBe('1.5 glass')
  })
})

describe('matching Gemini names to the table', () => {
  it.each([
    ['Roti', 'roti'],
    ['chapati', 'roti'],
    ['Dal Tadka', 'dal-tadka'],
    ['yellow dal', 'dal-tadka'],
    ['Palak Paneer', 'palak-paneer'],
    ['curd', 'dahi'],
    ['Jeera Rice', 'jeera-rice'],
    ['masala dosa', 'masala-dosa'],
    ['Chicken Biryani', 'chicken-biryani'],
    ['cutting chai', 'chai'],
  ])('%s → %s', (name, id) => {
    expect(matchFood(name)?.food.id).toBe(id)
  })

  it('returns null for things that are not food', () => {
    expect(matchFood('ceramic plate with spoon')).toBeNull()
  })

  it('searches by prefix and alias', () => {
    expect(searchFoods('pan')[0].name.toLowerCase()).toContain('pan')
    expect(searchFoods('curd').map((f) => f.id)).toContain('dahi')
  })
})

describe('targets', () => {
  it('uses Mifflin-St Jeor', () => {
    expect(Math.round(bmr(atul))).toBe(Math.round(10 * 74.2 + 6.25 * 176 - 5 * 28 + 5))
  })

  it('follows the Goal board shape: training day 200 above rest day, 2 g/kg protein', () => {
    const t = computeTargets(atul, 'cut', 'steady')
    expect(t.kcalTraining - t.kcalRest).toBe(200)
    expect(t.protein).toBe(150)
    expect(t.fat).toBe(65)
    expect(t.waterMl).toBe(3500)
    expect(t.targetWeightKg).toBe(71.5)
    expect(t.weeks).toBe(7)
    expect(t.kcalTraining).toBeGreaterThan(1900)
    expect(t.kcalTraining).toBeLessThan(2700)
    expect(t.carbsTraining * 4 + t.protein * 4 + t.fat * 9).toBeLessThanOrEqual(t.kcalTraining + 20)
  })

  it('maintain uses 1.8 g/kg and no deficit', () => {
    const t = computeTargets(atul, 'maintain', 'steady')
    expect(t.protein).toBe(135)
    expect(t.deltaKcal).toBe(0)
    expect(t.weeks).toBeNull()
  })

  it('estimates target body fat when body fat is known', () => {
    expect(computeTargets(atul, 'cut', 'steady').targetBodyFatPct).toBeLessThan(16)
  })
})

describe('weight trend and weekly check-in', () => {
  const series = Array.from({ length: 29 }, (_, i) => ({
    d: new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10),
    w: 75 - i * 0.05 + (i % 3 === 0 ? 0.4 : -0.2),
  }))

  it('smooths daily noise', () => {
    const tr = weightTrend(series)
    const raw = series.map((s) => s.w)
    const ema = tr.map((x) => x.ema)
    const jitter = (a: number[]) => a.slice(1).reduce((s, v, i) => s + Math.abs(v - a[i]), 0)
    expect(jitter(ema)).toBeLessThan(jitter(raw) / 3)
  })

  it('reports a weekly rate', () => {
    const r = trendRate(series, 21)
    expect(r).not.toBeNull()
    expect(r!).toBeLessThan(0)
  })

  it('holds targets when on track and moves by at most 150 kcal', () => {
    expect(weeklyAdjustment(-0.37, -0.36).kcal).toBe(0)
    const fast = weeklyAdjustment(-1.2, -0.36)
    expect(fast.kcal).toBe(150)
    expect(fast.reason).toBe('too-fast')
    const slow = weeklyAdjustment(0, -0.36)
    expect(slow.kcal).toBeLessThan(0)
    expect(slow.kcal).toBeGreaterThanOrEqual(-150)
  })
})
