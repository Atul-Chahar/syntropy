'use client'

import { effectiveRoutines, lastEntryFor, workoutVolume } from '@syntropy/core/history'
import { MUSCLE_NAME } from '@syntropy/core/muscles'
import type { Active, Entry, Routine, SetRow, TrainingState, Workout } from '@/stores/training'
import { addDays, parseIso, today } from './dates'
import { EX, exTitle } from './ex'
import { primaryMusclesOf } from './summary'

export const muscleName = (slug: string) => (MUSCLE_NAME as Record<string, string>)[slug] ?? slug

/** Monday of the week containing `date`. */
export function mondayOf(date: string) {
  const d = parseIso(date)
  return addDays(date, -((d.getDay() + 6) % 7))
}

export type DayStatus = 'done' | 'today' | 'planned' | 'rest' | 'missed'

export function weekDays(S: TrainingState, anchor = today()) {
  const mon = mondayOf(anchor)
  const t = today()
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(mon, i)
    const routines = effectiveRoutines(S, date) as Routine[]
    const done = S.workouts.filter((w) => w.d === date)
    let status: DayStatus = 'rest'
    if (done.length) status = 'done'
    else if (routines.length && date === t) status = 'today'
    else if (routines.length && date > t) status = 'planned'
    else if (routines.length) status = 'missed'
    return { date, routines, done, status, weekday: parseIso(date).getDay() }
  })
}

export const DOT: Record<DayStatus, string> = {
  done: '#A9C3A0',
  today: '#FF6B3D',
  planned: 'rgba(243,241,236,0.45)',
  rest: 'rgba(243,241,236,0.12)',
  missed: 'rgba(243,241,236,0.25)',
}

export const estMinutes = (r: Routine) => Math.round(r.ex.reduce((a, e) => a + e.sets * 2.6, 6))

export function fmtW(w: number, bodyweight = false) {
  if (bodyweight) return w > 0 ? `+${w}` : w < 0 ? `${w}` : 'BW'
  return Number.isInteger(w) ? `${w}` : w.toFixed(1)
}

export const isBwExercise = (id: string) =>
  /body weight|bodyweight|assisted/i.test(EX[id]?.eq ?? '')

/** "Previous" column: the same set index from the last time this exercise was done. */
export function prevFor(S: TrainingState, exId: string): SetRow[] {
  const last = lastEntryFor(S, exId) as unknown as Entry | null
  return (last?.sets ?? []).filter((s) => s.done)
}

export function sessionNumber(S: TrainingState) {
  return S.workouts.length + 1
}

export function setsProgress(A: Active) {
  const all = A.entries.flatMap((e) => e.sets)
  return { done: all.filter((s) => s.done).length, total: all.length }
}

export function elapsed(A: Active, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - A.start) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function tagsFor(exId: string): { primary: string[]; secondary: string[] } {
  const ex = EX[exId]
  const primary = primaryMusclesOf(exId).map(muscleName)
  const secondary = (ex?.sm ?? [])
    .slice(0, 2)
    .map((s) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase()))
  return { primary: primary.slice(0, 1), secondary }
}

export function workoutMinutes(w: Workout) {
  return Math.max(1, Math.round((w.end - w.start) / 60000))
}

export { exTitle, workoutVolume }

/** Consecutive weeks (ending this week or last) with at least one workout. */
export function streakWeeks(S: TrainingState) {
  const weeks = new Set(S.workouts.map((w) => mondayOf(w.d)))
  let n = 0
  let wk = mondayOf(today())
  if (!weeks.has(wk)) wk = addDays(wk, -7)
  while (weeks.has(wk)) {
    n++
    wk = addDays(wk, -7)
  }
  return n
}
