'use client'

import { beatsWeight, betterWeight } from '@syntropy/core/exercises'
import { buildCompletedWorkout } from '@syntropy/core/finish-workout'
import { bestWeightFor, bestWeightForEntry, workoutVolume } from '@syntropy/core/history'
import { is1RMRecord } from '@syntropy/core/onerm'
import { buildCombinedEntries, deriveSessionName } from '@syntropy/core/session-merge'
import { buildStarterPlan } from '@syntropy/core/starter'
import { isWarmupRow } from '@syntropy/core/workout-model'
import { today } from '@/lib/dates'
import { persisted } from './persist'

/* Types for OpenGym's state document (packages/core works on this exact shape). */
export type SetRow = {
  w: number
  r: number
  done: boolean
  rpe?: number
  rir?: number
  phase?: 'work' | 'warmup'
  warmup?: boolean
}
export type RoutineEx = {
  id: string
  sets: number
  reps: number
  weight: number
  mode?: string
  sg?: string
}
export type Routine = { id: string; name: string; emoji?: string; ex: RoutineEx[] }
export type Entry = {
  id: string
  sets: SetRow[]
  target?: RoutineEx & { weight: number }
  plan?: { kind?: string; note?: string; weight?: number; reps?: number }
  rid?: string
  note?: string
}
export type Workout = {
  id: string
  d: string
  start: number
  end: number
  routineIds: string[]
  routineId: string | null
  name: string
  bw: number | null
  entries: Entry[]
  prs: string[]
  vol?: number
}
export type Active = {
  id: string
  d: string
  start: number
  routineIds: string[]
  name: string
  bw: number | null
  cur: number
  entries: Entry[]
}
export type WeighIn = { d: string; w: number; t?: number; photoId?: string }

export interface TrainingState {
  unit: 'kg'
  restSec: number
  effort: 'rpe'
  body: 'male' | 'female'
  targetW: number | null
  bodyweight: WeighIn[]
  routines: Routine[]
  week: Record<string, string | string[]>
  dayPlan: Record<string, string | string[]>
  exWeights: Record<string, { w: number; d: string }>
  workouts: Workout[]
  active: Active | null
  customEx: unknown[]
  exNotes: Record<string, string>
  favEx: string[]
  weekStart: 1
  wc: Record<string, boolean>
}

export const DEF: TrainingState = {
  unit: 'kg',
  restSec: 90,
  effort: 'rpe',
  body: 'male',
  targetW: null,
  bodyweight: [],
  routines: [],
  week: {},
  dayPlan: {},
  exWeights: {},
  workouts: [],
  active: null,
  customEx: [],
  exNotes: {},
  favEx: [],
  weekStart: 1,
  wc: {},
}

export type SessionSummary = { workout: Workout; prs: string[]; e1prs: { id: string }[] }

type TrainingStore = {
  S: TrainingState
  lastSummary: SessionSummary | null
  update: (fn: (s: TrainingState) => void) => void
  ensurePlan: (planId?: string) => void
  applyStarterPlan: (planId: string) => void
  start: (routineIds: string[]) => void
  setRow: (entryIdx: number, setIdx: number, patch: Partial<SetRow>) => void
  addSet: (entryIdx: number) => void
  setCurrent: (entryIdx: number) => void
  finish: () => SessionSummary | null
  discard: () => void
  addWeighIn: (w: number, date?: string, photoId?: string) => void
  saveRoutine: (r: Routine) => void
  deleteRoutine: (id: string) => void
  setDay: (weekday: number, routineId: string | null) => void
  replaceAll: (S: TrainingState) => void
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const useTraining = persisted<TrainingStore>('training', (set, get) => ({
  S: DEF,
  lastSummary: null,
  update: (fn) => {
    const S = clone(get().S)
    fn(S)
    set({ S })
  },
  ensurePlan: (planId = 'upper-lower') => {
    if (get().S.routines.length) return
    get().applyStarterPlan(planId)
  },
  applyStarterPlan: (planId) => {
    const plan = buildStarterPlan(planId)
    if (!plan) return
    get().update((s) => {
      s.routines = plan.routines as Routine[]
      s.week = {}
      for (const { day, routineId } of plan.schedule) s.week[String(day)] = routineId
    })
  },
  start: (routineIds) => {
    const st = get().S
    if (st.active) return
    const { entries, routineIds: rids, routines } = buildCombinedEntries(st, routineIds)
    const last = st.bodyweight[st.bodyweight.length - 1]
    get().update((s) => {
      s.active = {
        id: uid(),
        d: today(),
        start: Date.now(),
        routineIds: rids,
        name: routines.length
          ? deriveSessionName(routines.map((r: Routine) => r.name))
          : 'Freestyle',
        bw: last?.w ?? null,
        cur: 0,
        entries: entries as Entry[],
      }
    })
  },
  setRow: (ei, si, patch) =>
    get().update((s) => {
      const row = s.active?.entries[ei]?.sets[si]
      if (row) Object.assign(row, patch)
    }),
  addSet: (ei) =>
    get().update((s) => {
      const e = s.active?.entries[ei]
      if (!e) return
      const last = e.sets[e.sets.length - 1]
      e.sets.push({ w: last?.w ?? 0, r: last?.r ?? 8, done: false, phase: 'work' })
    }),
  setCurrent: (ei) =>
    get().update((s) => {
      if (s.active) s.active.cur = ei
    }),
  finish: () => {
    const st = get().S
    const A = st.active
    if (!A) return null
    const prs: string[] = []
    const e1prs: { id: string }[] = []
    for (const e of A.entries) {
      const loads = e.sets
        .filter((x) => x.done && !isWarmupRow(x))
        .map((x) => x.w)
        .filter((w) => w > 0)
      const mx = loads.length ? loads.reduce((a, b) => betterWeight(e.id, a, b)) : 0
      if (mx && beatsWeight(e.id, mx, bestWeightFor(st, e.id))) prs.push(e.id)
      const rec = is1RMRecord(st, e.id, e)
      if (rec && !prs.includes(e.id)) e1prs.push({ id: e.id, ...rec })
    }
    const w = buildCompletedWorkout(A, { end: Date.now(), prs }) as Workout
    w.vol = workoutVolume(w)
    const summary: SessionSummary = { workout: w, prs, e1prs }
    set({ lastSummary: summary })
    get().update((s) => {
      if (w.entries.length) {
        for (const e of w.entries) {
          const mx = bestWeightForEntry(e)
          if (mx > 0 && beatsWeight(e.id, mx, s.exWeights[e.id]?.w ?? 0))
            s.exWeights[e.id] = { w: mx, d: w.d }
        }
        s.workouts.push(w)
      }
      s.active = null
    })
    return summary
  },
  discard: () =>
    get().update((s) => {
      s.active = null
    }),
  addWeighIn: (w, date = today(), photoId) =>
    get().update((s) => {
      s.bodyweight = [
        ...s.bodyweight.filter((b) => b.d !== date),
        { d: date, w, t: Date.now(), ...(photoId ? { photoId } : {}) },
      ].sort((a, b) => (a.d < b.d ? -1 : 1))
    }),
  saveRoutine: (r) =>
    get().update((s) => {
      const i = s.routines.findIndex((x) => x.id === r.id)
      if (i >= 0) s.routines[i] = r
      else s.routines.push(r)
    }),
  deleteRoutine: (id) =>
    get().update((s) => {
      s.routines = s.routines.filter((r) => r.id !== id)
      for (const k of Object.keys(s.week)) if (s.week[k] === id) delete s.week[k]
    }),
  setDay: (weekday, routineId) =>
    get().update((s) => {
      if (routineId) s.week[String(weekday)] = routineId
      else delete s.week[String(weekday)]
    }),
  replaceAll: (S) => set({ S: { ...DEF, ...S } }),
}))

export { exTitle as exName } from '@/lib/ex'
