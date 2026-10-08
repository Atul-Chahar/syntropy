import { describe, expect, it } from 'vitest'
import {
  bmr,
  byCuisine,
  frequentIds,
  computeTargets,
  dayTotals,
  FOOD_BY_ID,
  FOODS,
  formatQty,
  itemFromFood,
  macroSplit,
  matchFood,
  mealTotals,
  measuredMaintenance,
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
  it('has 300+ foods with unique ids and sane values', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(300)
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length)
    // Alcohol (7 kcal/g) carries energy that protein, carbs and fat do not explain.
    const alcoholic = new Set(['beer', 'red-wine'])
    for (const f of FOODS) {
      if (alcoholic.has(f.id)) continue
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

  it('cuts at 0.75 % of body weight a week with the week total kept', () => {
    const t = computeTargets(atul, 'cut', 'steady')
    expect(t.rateKgPerWeek).toBeCloseTo(-0.56, 2)
    expect(t.deltaKcal).toBe(Math.round((-74.2 * 0.0075 * 7700) / 7))
    expect(t.targetWeightKg).toBeLessThan(74.2)
    expect(t.weeks).toBeGreaterThan(0)
    expect(t.targetBodyFatPct).toBeLessThan(16)
    expect(t.carbsTraining * 4 + t.protein * 4 + t.fat * 9).toBeLessThanOrEqual(t.kcalTraining + 20)
  })

  it('uses a set target weight and never goes below resting energy', () => {
    const t = computeTargets(atul, 'cut', 'faster', { targetKg: 70 })
    expect(t.targetWeightKg).toBe(70)
    expect(t.kcalRest).toBeGreaterThanOrEqual(Math.round(bmr(atul) / 10) * 10 - 10)
  })

  it('maintain has no deficit and no end date', () => {
    const t = computeTargets(atul, 'maintain', 'steady')
    expect(t.deltaKcal).toBe(0)
    expect(t.weeks).toBeNull()
  })

  it('moves maintenance toward the measured value', () => {
    const f = computeTargets(atul, 'maintain', 'steady')
    const m = computeTargets(atul, 'maintain', 'steady', { measured: { kcal: 2200, days: 28 } })
    expect(m.maintenanceSource).toBe('measured')
    expect(Math.abs(m.maintenanceKcal - 2200)).toBeLessThan(Math.abs(f.maintenanceKcal - 2200))
  })

  it('measures maintenance from intake and the weight trend', () => {
    const days = Array.from({ length: 28 }, (_, i) =>
      new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10),
    )
    // Eating 2,000 kcal a day while losing 0.5 kg a week: maintenance ~2,550.
    const intake = days.map((d) => ({ d, kcal: 2000 }))
    const weigh = days.map((d, i) => ({ d, w: 80 - (i * 0.5) / 7 }))
    const r = measuredMaintenance(intake, weigh, '2026-09-29')
    expect(r).not.toBeNull()
    expect(r!.kcal).toBeGreaterThan(2400)
    expect(r!.kcal).toBeLessThan(2700)
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

describe('global foods', () => {
  it('matches common non-Indian dishes to the table', () => {
    expect(matchFood('cheeseburger')?.food.id).toBe('cheeseburger')
    expect(matchFood('pad thai')?.food.id).toBe('pad-thai')
    expect(matchFood('hummus')?.food.id).toBe('hummus')
    expect(matchFood('scrambled eggs')?.food.id).toBe('scrambled-eggs')
  })

  it('every global food exists and frequent lists follow the cuisine', () => {
    for (const id of frequentIds('global')) expect(FOOD_BY_ID[id], id).toBeDefined()
    expect(frequentIds('indian')[0]).toBe('roti')
    expect(frequentIds('global')[0]).toBe('scrambled-eggs')
    const both = frequentIds('both')
    expect(both.slice(0, 2)).toEqual(['roti', 'scrambled-eggs'])
    expect(new Set(both).size).toBe(both.length)
  })

  it('orders but never hides foods by cuisine', () => {
    const list = [FOOD_BY_ID.roti, FOOD_BY_ID.bagel, FOOD_BY_ID.dosa]
    expect(byCuisine(list, 'global').map((f) => f.id)).toEqual(['bagel', 'roti', 'dosa'])
    expect(byCuisine(list, 'both')).toBe(list)
  })
})
