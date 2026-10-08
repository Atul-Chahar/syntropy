'use client'

import { effectiveRoutineIds } from '@syntropy/core/history'
import { musclesOf } from '@syntropy/core/muscles'
import { fatigueOf, strengthOf } from '@syntropy/core/recovery'
import { fatigueStateOf } from '@syntropy/core/recovery-view'
import {
  type BodyProfile,
  computeTargets,
  dayTotals,
  energyOut,
  type Macros,
  type Meal,
  measuredMaintenance,
  type Targets,
  trendRate,
  weightTrend,
  workoutKcal,
} from '@syntropy/nutrition'
import { useMemo } from 'react'
import { useGoal, useNutrition, useProfile, useTraining, useWater } from '@/stores'
import type { TrainingState, Workout } from '@/stores/training'
import { waterOn } from '@/stores/water'
import { addDays, today } from './dates'
import { EX as EXIDX } from './ex'

export function bodyOf(p: ReturnType<typeof useProfile.getState>, S: TrainingState): BodyProfile {
  // The smoothed trend, not the last noisy weigh-in.
  const trend = weightTrend(S.bodyweight)
  const last = trend[trend.length - 1]
  return {
    sex: p.sex,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: last ? Math.round(last.ema * 10) / 10 : p.weightKg,
    activity: p.activity,
    bodyFatPct: p.bodyFatPct ?? undefined,
    trainingDaysPerWeek: Math.max(1, Object.keys(S.week).length || p.trainingDaysPerWeek),
    sessionMin: p.sessionMin ?? 60,
    cardio: p.cardio ?? 'none',
  }
}

export const isTrainingDay = (S: TrainingState, date: string) =>
  S.workouts.some((w) => w.d === date) || (effectiveRoutineIds(S, date) as string[]).length > 0

export type DayTargets = {
  kcal: number
  protein: number
  carbs: number
  fat: number
  waterMl: number
  trainingDay: boolean
}

export function dayTargets(t: Targets, trainingDay: boolean): DayTargets {
  return {
    kcal: trainingDay ? t.kcalTraining : t.kcalRest,
    protein: t.protein,
    carbs: trainingDay ? t.carbsTraining : t.carbsRest,
    fat: t.fat,
    waterMl: t.waterMl,
    trainingDay,
  }
}

const durMin = (w: Workout) => Math.max(15, Math.min(150, (w.end - w.start) / 60000))

export function trainingKcalOn(S: TrainingState, date: string, weightKg: number) {
  return S.workouts
    .filter((w) => w.d === date)
    .reduce((a, w) => a + workoutKcal(weightKg, durMin(w)), 0)
}

/** kcal eaten per logged day. */
export function intakeByDay(meals: Meal[]): { d: string; kcal: number }[] {
  const by = new Map<string, Meal[]>()
  for (const m of meals) by.set(m.date, [...(by.get(m.date) ?? []), m])
  return [...by].map(([d, ms]) => ({ d, kcal: dayTotals(ms).kcal }))
}

/**
 * The one place targets are computed: the user's goal and target weight, with maintenance
 * measured from their own food logs and weight trend once there is enough data. Weekly
 * check-in adjustments only apply while maintenance is still the formula estimate.
 */
export function targetsFor(
  profile: ReturnType<typeof useProfile.getState>,
  S: TrainingState,
  goal: ReturnType<typeof useGoal.getState>,
  meals: Meal[],
  date: string = today(),
  type = goal.type,
  pace = goal.pace,
  targetKg: number | null | undefined = goal.targetKg,
): Targets {
  const measured = measuredMaintenance(intakeByDay(meals), S.bodyweight, date)
  return computeTargets(bodyOf(profile, S), type, pace, {
    adjustKcal: measured ? 0 : goal.adjustKcal,
    targetKg,
    measured,
  })
}

/** Everything Home, Food and the widgets need, derived in one place. */
export function useToday(date: string = today()) {
  const profile = useProfile()
  const goal = useGoal()
  const S = useTraining((s) => s.S)
  const meals = useNutrition((s) => s.meals)
  const waterDays = useWater((s) => s.days)
  return useMemo(() => {
    const body = bodyOf(profile, S)
    const targets = targetsFor(profile, S, goal, meals, date)
    const training = isTrainingDay(S, date)
    const dt = dayTargets(targets, training)
    const todays = meals.filter((m) => m.date === date)
    const eaten: Macros = dayTotals(todays)
    const water = waterOn(waterDays, date)
    const out = energyOut(body, trainingKcalOn(S, date, body.weightKg))
    return { body, targets, dt, meals: todays, eaten, water, out, training }
  }, [profile, goal, S, meals, waterDays, date])
}

/** Readiness 0..100 from OpenGym's per-muscle fatigue (mean of the three most fatigued). */
export function readinessOf(S: TrainingState, now = Date.now()) {
  const f = fatigueOf(S.workouts, now) as Record<string, number>
  const top = Object.values(f)
    .sort((a, b) => b - a)
    .slice(0, 3)
  const mean = top.length ? top.reduce((a, b) => a + b, 0) / top.length : 0
  return Math.max(5, Math.round(100 - mean * 42))
}

export type MuscleRow = {
  slug: string
  state: 'ready' | 'recovering' | 'fatigued' | 'detrained'
  fatigue: number
  sets: number
  last: string | null
  hoursToReady: number
}

/** Per-muscle recovery rows for Recovery and the Stats fatigue tab. */
export function muscleRows(
  S: TrainingState,
  now = Date.now(),
): { states: Record<string, MuscleRow['state']>; rows: MuscleRow[] } {
  const f = fatigueOf(S.workouts, now) as Record<string, number>
  const str = strengthOf(S.workouts, now) as Record<string, number>
  const states: Record<string, MuscleRow['state']> = {}
  const sets: Record<string, number> = {}
  const last: Record<string, string> = {}
  const since = now - 7 * 86400000
  for (const w of S.workouts) {
    for (const e of w.entries) {
      const ex = exerciseMusclesCache(e.id)
      for (const m of ex) {
        if (w.start >= since) sets[m] = (sets[m] ?? 0) + e.sets.filter((s) => s.done).length
        if (!last[m] || last[m] < w.d) last[m] = w.d
      }
    }
  }
  const rows: MuscleRow[] = Object.keys(f).map((slug) => {
    const v = f[slug]
    let state: MuscleRow['state'] = fatigueStateOf(v)
    if (v < 0.05 && str[slug] < 0.8) state = 'detrained'
    states[slug] = state
    // Fatigue halves every 36 h; hours until it falls under the "ready" line of 0.25.
    const hours = v <= 0.25 ? 0 : Math.ceil(36 * Math.log2(v / 0.25))
    return {
      slug,
      state,
      fatigue: v,
      sets: sets[slug] ?? 0,
      last: last[slug] ?? null,
      hoursToReady: hours,
    }
  })
  rows.sort((a, b) => b.fatigue - a.fatigue)
  return { states, rows }
}

const MCACHE = new Map<string, string[]>()
function exerciseMusclesCache(id: string): string[] {
  let v = MCACHE.get(id)
  if (!v) {
    const ex = EXIDX[id]
    v = ex
      ? Object.entries(musclesOf(ex) as Record<string, number>)
          .filter(([, w]) => w >= 0.5)
          .map(([m]) => m)
      : []
    MCACHE.set(id, v)
  }
  return v
}
export const primaryMusclesOf = exerciseMusclesCache

/** Averages over a window for the Home range switch and Progress tiles. */
export function windowAverages(
  S: TrainingState,
  meals: ReturnType<typeof useNutrition.getState>['meals'],
  body: BodyProfile,
  days: number,
  end = today(),
) {
  let inSum = 0
  let outSum = 0
  let n = 0
  let logged = 0
  for (let i = 0; i < days; i++) {
    const d = addDays(end, -i)
    const dm = meals.filter((m) => m.date === d)
    if (!dm.length) continue
    logged++
    inSum += dayTotals(dm).kcal
    outSum += energyOut(body, trainingKcalOn(S, d, body.weightKg)).total
    n++
  }
  const vol = S.workouts
    .filter((w) => w.d > addDays(end, -days))
    .reduce((a, w) => a + (w.vol ?? 0), 0)
  return { avgIn: n ? inSum / n : 0, avgOut: n ? outSum / n : 0, logged, volume: vol }
}

export { trendRate, weightTrend }
