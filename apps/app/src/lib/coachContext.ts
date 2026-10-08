'use client'

import type { CoachContext } from '@syntropy/ai'
import { effectiveRoutines } from '@syntropy/core/history'
import {
  dayTotals,
  FOOD_BY_ID,
  frequentIds,
  GOAL_INFO,
  mealTotals,
  SLOT_LABEL,
  trendRate,
} from '@syntropy/nutrition'
import { useGoal, useNutrition, useProfile, useTraining, useWater } from '@/stores'
import { waterOn } from '@/stores/water'
import { addDays, today } from './dates'
import { GYM_PRESETS } from './plan'
import { bodyOf, dayTargets, isTrainingDay, muscleRows, readinessOf, targetsFor } from './summary'
import { exTitle, muscleName } from './training'

/** The allowlisted summary of the user's data that the coach may see (never raw logs). */
export function buildCoachContext(): CoachContext {
  const p = useProfile.getState()
  const g = useGoal.getState()
  const S = useTraining.getState().S
  const meals = useNutrition.getState().meals
  const recent = useNutrition.getState().recent
  const water = useWater.getState().days
  const t = today()
  const body = bodyOf(p, S)
  const targets = targetsFor(p, S, g, meals, t)
  const dt = dayTargets(targets, isTrainingDay(S, t))
  const todays = meals.filter((m) => m.date === t)
  const eaten = dayTotals(todays)
  const { rows } = muscleRows(S)
  let next: CoachContext['nextSession']
  for (let i = 0; i < 8 && !next; i++) {
    const d = addDays(t, i)
    const r = effectiveRoutines(S, d) as { name: string }[]
    if (r.length && !S.workouts.some((w) => w.d === d)) next = { date: d, name: r[0].name }
  }
  const week = Array.from({ length: 7 }, (_, i) => addDays(t, -i - 1))
  const weekMeals = week.map((d) => meals.filter((m) => m.date === d)).filter((x) => x.length)
  const wk = weekMeals.map(dayTotals)
  const lastW = S.bodyweight[S.bodyweight.length - 1]
  const ids = [...new Set([...recent, ...frequentIds(p.cuisine)])].slice(0, 20)
  return {
    today: t,
    profile: {
      name: p.name.split(' ')[0] || 'there',
      sex: p.sex,
      age: p.age,
      heightCm: p.heightCm,
      weightKg: body.weightKg,
      goal: GOAL_INFO[g.type].name,
      pace: g.pace,
      diet: p.diet ?? undefined,
      cuisine: p.cuisine,
      units: p.units,
      avoidFoods: p.avoidFoods.length ? p.avoidFoods : undefined,
      training: p.trainingDone
        ? {
            focus: p.trainingGoal,
            experience: p.experience,
            daysPerWeek: p.trainingDaysPerWeek,
            sessionMin: p.sessionMin,
            gym: GYM_PRESETS.find((x) => x.id === p.gymType)?.label ?? 'custom equipment',
            injuries: p.injuries,
            cardio: p.cardio,
          }
        : undefined,
    },
    targets: {
      kcal: dt.kcal,
      protein: dt.protein,
      carbs: dt.carbs,
      fat: dt.fat,
      waterMl: dt.waterMl,
      trainingDay: dt.trainingDay,
    },
    todayIntake: {
      kcal: Math.round(eaten.kcal),
      protein: Math.round(eaten.protein),
      carbs: Math.round(eaten.carbs),
      fat: Math.round(eaten.fat),
      meals: todays.map((m) => ({
        slot: SLOT_LABEL[m.slot],
        items: `${m.items.map((i) => `${i.qty} ${i.unit} ${i.name}${i.addedLater ? ' (added later)' : ''}`).join(', ')} = ${Math.round(mealTotals(m).kcal)} kcal`,
      })),
    },
    waterMl: waterOn(water, t),
    readiness: readinessOf(S),
    fatigued: rows
      .filter((r) => r.state === 'fatigued' || r.state === 'recovering')
      .slice(0, 5)
      .map((r) => `${muscleName(r.slug)} (${r.state}, ready in ~${r.hoursToReady} h)`),
    lastSessions: S.workouts
      .slice(-4)
      .reverse()
      .map((w) => ({
        date: w.d,
        name: w.name,
        sets: w.entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0),
        volumeKg: Math.round(w.vol ?? 0),
        prs: (w.prs ?? []).map(exTitle),
      })),
    nextSession: next,
    weightTrend: lastW ? { current: lastW.w, kgPerWeek: trendRate(S.bodyweight) } : undefined,
    week: wk.length
      ? {
          avgKcal: Math.round(wk.reduce((a, x) => a + x.kcal, 0) / wk.length),
          avgProtein: Math.round(wk.reduce((a, x) => a + x.protein, 0) / wk.length),
          trainingDays: S.workouts.filter((w) => w.d >= addDays(t, -7)).length,
        }
      : undefined,
    foodsForActions: ids
      .filter((id) => FOOD_BY_ID[id])
      .map((id) => ({ id, name: FOOD_BY_ID[id].name, unit: FOOD_BY_ID[id].unitLabel })),
  }
}
