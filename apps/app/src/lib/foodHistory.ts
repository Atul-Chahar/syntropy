'use client'

import { dayTotals } from '@syntropy/nutrition'
import { useMemo } from 'react'
import { useGoal, useNutrition, useProfile, useTraining } from '@/stores'
import { dayTargets, isTrainingDay, targetsFor } from './summary'

export type DayStat = {
  date: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  target: number
  meals: number
}

/** Per-day intake and target for a list of dates. */
export function useDayStats(dates: string[]): DayStat[] {
  const meals = useNutrition((s) => s.meals)
  const S = useTraining((s) => s.S)
  const p = useProfile()
  const g = useGoal()
  return useMemo(() => {
    const t = targetsFor(p, S, g, meals)
    const byDate = new Map<string, typeof meals>()
    for (const m of meals) byDate.set(m.date, [...(byDate.get(m.date) ?? []), m])
    return dates.map((date) => {
      const dm = byDate.get(date) ?? []
      const tot = dayTotals(dm)
      return { date, ...tot, target: dayTargets(t, isTrainingDay(S, date)).kcal, meals: dm.length }
    })
  }, [dates, meals, S, p, g])
}

/** Colour for a day: grey when nothing logged, sage near target, peach under, ember over. */
export function dayColor(d: DayStat): { bg: string; fg: string } {
  if (!d.meals) return { bg: 'rgba(255,255,255,0.04)', fg: 'rgba(243,241,236,0.35)' }
  const r = d.kcal / Math.max(1, d.target)
  if (r > 1.1)
    return { bg: `rgba(255,107,61,${Math.min(0.85, 0.35 + (r - 1.1) * 2)})`, fg: '#F3F1EC' }
  if (r >= 0.9) return { bg: 'rgba(169,195,160,0.6)', fg: '#0B0F0D' }
  return { bg: `rgba(255,199,176,${Math.max(0.15, r * 0.55)})`, fg: '#F3F1EC' }
}
