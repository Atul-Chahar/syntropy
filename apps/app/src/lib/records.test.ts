import { describe, expect, it } from 'vitest'
import type { SetRow, TrainingState, Workout } from '@/stores/training'
import {
  allRecords,
  exerciseRecords,
  liveRecords,
  predictWeight,
  recordSets,
  workoutRecords,
} from './records'

const BENCH = '0025' // barbell bench press
const PULLUP = '0652' // pull-up

const set = (w: number, r: number, extra: Partial<SetRow> = {}): SetRow => ({
  w,
  r,
  done: true,
  phase: 'work',
  ...extra,
})

let n = 0
const session = (d: string, entries: Record<string, SetRow[]>): Workout => ({
  id: `w${++n}`,
  d,
  start: new Date(`${d}T09:00:00`).getTime(),
  end: new Date(`${d}T10:00:00`).getTime(),
  routineIds: [],
  routineId: null,
  name: 'Test',
  bw: 75,
  entries: Object.entries(entries).map(([id, sets]) => ({ id, sets })),
  prs: [],
})

const state = (workouts: Workout[]) => ({ workouts }) as unknown as TrainingState

describe('exerciseRecords', () => {
  it('treats the first session as the baseline, not a record', () => {
    const S = state([session('2026-09-01', { [BENCH]: [set(60, 8), set(60, 8)] })])
    const r = exerciseRecords(S, BENCH)
    expect(r?.events).toEqual([])
    expect(r?.best.weight?.value).toBe(60)
    expect(r?.best.e1rm?.value).toBe(76)
  })

  it('records strictly better sessions only, and remembers what each one beat', () => {
    const a = session('2026-09-01', { [BENCH]: [set(60, 8)] })
    const b = session('2026-09-04', { [BENCH]: [set(60, 8)] }) // tie: no record
    const c = session('2026-09-08', { [BENCH]: [set(62.5, 8)] })
    const r = exerciseRecords(state([a, b, c]), BENCH)
    expect(r?.events.map((e) => e.kind).sort()).toEqual(['e1rm', 'volume', 'weight'])
    const weight = r?.events.find((e) => e.kind === 'weight')
    expect(weight).toMatchObject({ value: 62.5, prev: 60, workoutId: c.id, set: { w: 62.5, r: 8 } })
    expect(r?.points.map((p) => p.record)).toEqual([false, false, true])
  })

  it('ignores warm-ups, unfinished sets and sets past the 1RM rep cap', () => {
    const a = session('2026-09-01', { [BENCH]: [set(60, 5)] })
    const b = session('2026-09-03', {
      [BENCH]: [set(100, 3, { phase: 'warmup' }), set(90, 3, { done: false }), set(40, 20)],
    })
    const r = exerciseRecords(state([a, b]), BENCH)
    expect(r?.best.weight?.value).toBe(60)
    expect(r?.best.e1rm?.value).toBe(70)
    // 40 × 20 moves more kilograms than 60 × 5, so only volume is a record.
    expect(r?.events.map((e) => e.kind)).toEqual(['volume'])
  })

  it('tracks reps for lifts that were never loaded', () => {
    const a = session('2026-09-01', { [PULLUP]: [set(0, 6), set(0, 5)] })
    const b = session('2026-09-05', { [PULLUP]: [set(0, 8)] })
    const r = exerciseRecords(state([a, b]), PULLUP)
    expect(r?.repsOnly).toBe(true)
    expect(r?.events).toMatchObject([{ kind: 'reps', value: 8, prev: 6 }])
  })

  it('builds a rep-max table from the heaviest set at or above each rep count', () => {
    const a = session('2026-09-01', { [BENCH]: [set(80, 3), set(70, 8), set(60, 12)] })
    const r = exerciseRecords(state([a]), BENCH)
    const table = Object.fromEntries(r?.repMax.map((x) => [x.reps, x.w]) ?? [])
    expect(table).toEqual({ 1: 80, 2: 80, 3: 80, 5: 70, 8: 70, 10: 60, 12: 60 })
  })
})

describe('liveRecords', () => {
  const hist = state([session('2026-09-01', { [BENCH]: [set(60, 8)] })])

  it('says nothing the first time a lift is done', () => {
    expect(liveRecords(state([]), BENCH, [set(100, 5)], 0)).toEqual([])
  })

  it('announces a set that beats history', () => {
    const live = liveRecords(hist, BENCH, [set(62.5, 8)], 0)
    expect(live.map((x) => x.kind)).toEqual(['e1rm', 'weight', 'volume'])
  })

  it('announces each record once, on the set that broke it', () => {
    const sets = [set(62.5, 6), set(62.5, 6)]
    expect(liveRecords(hist, BENCH, sets, 1).map((x) => x.kind)).toEqual(['volume'])
    expect([...recordSets(hist, BENCH, sets)]).toEqual([0, 1])
  })
})

describe('summaries', () => {
  it('lists the records one session set, and all events newest first', () => {
    const a = session('2026-09-01', { [BENCH]: [set(60, 8)], [PULLUP]: [set(0, 6)] })
    const b = session('2026-09-05', { [BENCH]: [set(65, 8)], [PULLUP]: [set(0, 7)] })
    const S = state([a, b])
    expect(workoutRecords(S, b.id).map((e) => `${e.exId}:${e.kind}`)).toEqual([
      `${BENCH}:e1rm`,
      `${BENCH}:weight`,
      `${BENCH}:volume`,
      `${PULLUP}:reps`,
    ])
    expect(workoutRecords(S, a.id)).toEqual([])
    expect(allRecords(S).events).toHaveLength(4)
  })

  it('predicts the working weight for a rep count from a 1RM', () => {
    expect(predictWeight(100, 1)).toBe(100)
    expect(predictWeight(100, 5)).toBe(85.5)
  })
})
