import { isAssisted } from '@syntropy/core/exercises'
import { estimate1RM } from '@syntropy/core/onerm'
import type { SetRow, TrainingState, Workout } from '@/stores/training'

/*
 * Personal records, read back from the workout log.
 *
 * Nothing here is stored: every record is derived from S.workouts, so imported, back-filled
 * and edited sessions are always counted the same way, and deleting a session takes its record
 * with it. Only completed, non-warm-up, reps-mode sets count (timed holds and cardio have no
 * honest "heaviest" or "1RM").
 *
 * The first session of a lift sets the baseline and is never a record: the second time you do
 * it is the first time you can beat anything. Ties do not count; a record has to be strictly
 * better.
 *
 * Kinds, after Strong and Hevy:
 *   e1rm    estimated one-rep max (Epley, ≤ 12 reps), the headline strength number
 *   weight  heaviest completed set
 *   reps    most reps in one set, for lifts never loaded (pull-ups, push-ups)
 *   volume  most kilograms moved in one session (Σ weight × reps)
 * Assisted machines count reps only: less help is progress, so heavier is not a record.
 */

export type RecordKind = 'e1rm' | 'weight' | 'reps' | 'volume'

export const KIND_LABEL: Record<RecordKind, string> = {
  e1rm: 'Estimated 1RM',
  weight: 'Heaviest weight',
  reps: 'Most reps',
  volume: 'Session volume',
}

/** Short names for chips, toasts and hints. */
export const KIND_SHORT: Record<RecordKind, string> = {
  weight: 'Heaviest',
  e1rm: 'Est 1RM',
  reps: 'Reps',
  volume: 'Volume',
}

/** Rep counts shown in the rep-max table. */
export const REP_MAXES = [1, 2, 3, 5, 8, 10, 12] as const

type SetLike = Pick<SetRow, 'w' | 'r' | 'done' | 'phase' | 'warmup'> & {
  sec?: number
  min?: number
}

export interface RecordEvent {
  exId: string
  kind: RecordKind
  value: number
  /** The record it beat. */
  prev: number
  d: string
  t: number
  workoutId: string
  /** The set behind a per-set record (not for session volume). */
  set?: { w: number; r: number }
}

export interface Best {
  value: number
  d: string
  workoutId: string
  set?: { w: number; r: number }
}

export interface SessionPoint {
  d: string
  t: number
  workoutId: string
  e1rm: number | null
  weight: number | null
  reps: number | null
  volume: number | null
  record: boolean
}

export interface ExerciseRecords {
  exId: string
  /** Never loaded: reps are the number that improves. */
  repsOnly: boolean
  sessions: number
  first: string
  last: string
  best: Partial<Record<RecordKind, Best>>
  repMax: { reps: number; w: number; d: string; workoutId: string }[]
  points: SessionPoint[]
  /** Oldest first. */
  events: RecordEvent[]
}

const startOf = (w: Workout) =>
  Number.isFinite(w.start) ? w.start : new Date(`${w.d}T12:00:00`).getTime()

const isWorkSet = (s: SetLike) =>
  s.done && s.phase !== 'warmup' && !s.warmup && s.sec == null && s.min == null && s.r > 0

const better = (a: number, b: number | undefined) => b == null || a > b + 1e-9

/** The numbers one session (or part of one) produced for an exercise. */
export interface SetStats {
  e1rm: { value: number; set: { w: number; r: number } } | null
  weight: { value: number; set: { w: number; r: number } } | null
  reps: { value: number; set: { w: number; r: number } } | null
  volume: number | null
}

export function statsOf(exId: string, sets: SetLike[]): SetStats {
  const work = sets.filter(isWorkSet)
  const assisted = isAssisted(exId)
  const out: SetStats = { e1rm: null, weight: null, reps: null, volume: null }
  let vol = 0
  for (const s of work) {
    const set = { w: Number(s.w) || 0, r: Math.round(Number(s.r) || 0) }
    if (!out.reps || set.r > out.reps.value) out.reps = { value: set.r, set }
    if (assisted || set.w <= 0) continue
    vol += set.w * set.r
    if (
      !out.weight ||
      set.w > out.weight.value ||
      (set.w === out.weight.value && set.r > out.weight.set.r)
    )
      out.weight = { value: set.w, set }
    const est = estimate1RM(set.w, set.r)
    if (est != null && (!out.e1rm || est > out.e1rm.value)) out.e1rm = { value: est, set }
  }
  out.volume = vol > 0 ? Math.round(vol) : null
  return out
}

function kindsFor(repsOnly: boolean, assisted: boolean): RecordKind[] {
  if (assisted || repsOnly) return ['reps']
  return ['e1rm', 'weight', 'volume']
}

const metricOf = (st: SetStats, k: RecordKind) =>
  k === 'volume' ? st.volume : (st[k]?.value ?? null)

/** Every record an exercise has, with its history. Null when it was never logged in reps. */
export function exerciseRecords(S: TrainingState, exId: string): ExerciseRecords | null {
  const logged = S.workouts
    .map((w) => {
      const sets = w.entries.filter((e) => e.id === exId).flatMap((e) => e.sets as SetLike[])
      return { w, st: statsOf(exId, sets) }
    })
    .filter((x) => x.st.reps)
    .sort((a, b) => startOf(a.w) - startOf(b.w))
  if (!logged.length) return null

  const assisted = isAssisted(exId)
  const repsOnly = !logged.some((x) => x.st.weight)
  const kinds = kindsFor(repsOnly, assisted)
  const best: ExerciseRecords['best'] = {}
  const events: RecordEvent[] = []
  const points: SessionPoint[] = []
  const repMax = new Map<number, ExerciseRecords['repMax'][number]>()

  logged.forEach(({ w, st }, i) => {
    let record = false
    for (const k of kinds) {
      const v = metricOf(st, k)
      if (v == null || v <= 0) continue
      const set = k === 'volume' ? undefined : (st[k] ?? undefined)?.set
      const prev = best[k]?.value
      if (better(v, prev)) {
        // The first session sets the baseline; only later sessions can break a record.
        if (i > 0) {
          events.push({
            exId,
            kind: k,
            value: v,
            prev: prev ?? 0,
            d: w.d,
            t: startOf(w),
            workoutId: w.id,
            ...(set ? { set } : {}),
          })
          record = true
        }
        best[k] = { value: v, d: w.d, workoutId: w.id, ...(set ? { set } : {}) }
      }
    }
    if (!repsOnly && !assisted) {
      const sets = w.entries.filter((e) => e.id === exId).flatMap((e) => e.sets as SetLike[])
      for (const s of sets.filter(isWorkSet)) {
        for (const n of REP_MAXES) {
          if (s.r < n || s.w <= 0) continue
          const cur = repMax.get(n)
          if (!cur || s.w > cur.w) repMax.set(n, { reps: n, w: s.w, d: w.d, workoutId: w.id })
        }
      }
    }
    points.push({
      d: w.d,
      t: startOf(w),
      workoutId: w.id,
      e1rm: st.e1rm?.value ?? null,
      weight: st.weight?.value ?? null,
      reps: st.reps?.value ?? null,
      volume: st.volume,
      record,
    })
  })

  return {
    exId,
    repsOnly: repsOnly || assisted,
    sessions: logged.length,
    first: logged[0].w.d,
    last: logged[logged.length - 1].w.d,
    best,
    repMax: REP_MAXES.map((n) => repMax.get(n)).filter((x) => x != null),
    points,
    events,
  }
}

/** Headline order: the most concrete record leads (a heavier bar beats an estimate). */
export const HEADLINE: RecordKind[] = ['weight', 'reps', 'e1rm', 'volume']

/**
 * One lift's records from one session, shown as a single row, as Strong and Hevy do: a good
 * session usually breaks heaviest, 1RM and volume together, and three rows for it is noise.
 */
export interface RecordMoment {
  exId: string
  workoutId: string
  d: string
  t: number
  /** Headline first. */
  events: RecordEvent[]
}

export function groupMoments(events: RecordEvent[]): RecordMoment[] {
  const by = new Map<string, RecordMoment>()
  for (const e of events) {
    const k = `${e.workoutId}|${e.exId}`
    const m = by.get(k) ?? { exId: e.exId, workoutId: e.workoutId, d: e.d, t: e.t, events: [] }
    m.events.push(e)
    by.set(k, m)
  }
  const out = [...by.values()]
  for (const m of out) m.events.sort((a, b) => HEADLINE.indexOf(a.kind) - HEADLINE.indexOf(b.kind))
  return out
}

/** Records for every exercise ever logged; events and moments newest first. */
export function allRecords(S: TrainingState) {
  const ids = new Set<string>()
  for (const w of S.workouts) for (const e of w.entries) ids.add(e.id)
  const byEx: ExerciseRecords[] = []
  for (const id of ids) {
    const r = exerciseRecords(S, id)
    if (r) byEx.push(r)
  }
  const events = byEx.flatMap((r) => r.events).sort((a, b) => b.t - a.t)
  return { byEx, events, moments: groupMoments(events) }
}

/** The records one saved session set, in the order its exercises were done. */
export function workoutRecords(S: TrainingState, workoutId: string): RecordEvent[] {
  const w = S.workouts.find((x) => x.id === workoutId)
  if (!w) return []
  const order = [...new Set(w.entries.map((e) => e.id))]
  return order.flatMap(
    (id) => exerciseRecords(S, id)?.events.filter((e) => e.workoutId === workoutId) ?? [],
  )
}

/**
 * Records a set in the running session would break: compared with every past session AND the
 * sets already done today, so each record is announced once, on the set that broke it.
 * `sets` are the entry's sets with the candidate set marked done; `index` is that set.
 */
export function liveRecords(
  S: TrainingState,
  exId: string,
  sets: SetLike[],
  index: number,
): { kind: RecordKind; value: number; prev: number }[] {
  const hist = exerciseRecords(S, exId)
  if (!hist) return []
  const cand = sets[index]
  if (!cand || !isWorkSet(cand)) return []
  const before = statsOf(
    exId,
    sets.filter((_, j) => j !== index),
  )
  const after = statsOf(exId, sets)
  const kinds = kindsFor(hist.repsOnly && !after.weight, isAssisted(exId))
  const out: { kind: RecordKind; value: number; prev: number }[] = []
  for (const k of kinds) {
    const v = metricOf(after, k)
    if (v == null || v <= 0) continue
    const histBest = hist.best[k]?.value
    const today = metricOf(before, k)
    const bar = Math.max(histBest ?? 0, today ?? 0)
    // Only announce when there is a past record to beat, and this set is the one that beat it.
    if (histBest != null && v > bar + 1e-9) out.push({ kind: k, value: v, prev: histBest })
  }
  return out
}

/** Which done sets of an entry in the running session broke a record (for the trophy). */
export function recordSets(S: TrainingState, exId: string, sets: SetLike[]): Set<number> {
  const out = new Set<number>()
  sets.forEach((s, i) => {
    if (!s.done) return
    // Replay the session in order: a set counts against only the sets before it.
    const upTo = sets.map((x, j) => (j <= i ? x : { ...x, done: false }))
    if (liveRecords(S, exId, upTo, i).length) out.add(i)
  })
  return out
}

/** "82.5 kg", "95.0 kg", "14 reps", "3,240 kg". */
export function fmtRecord(kind: RecordKind, v: number): string {
  if (kind === 'reps') return `${v} ${v === 1 ? 'rep' : 'reps'}`
  if (kind === 'volume') return `${Math.round(v).toLocaleString('en-IN')} kg`
  return `${Number.isInteger(v) ? v : v.toFixed(1)} kg`
}

/** The improvement over the old record: "+2.5 kg", "+3 reps". */
export function fmtGain(kind: RecordKind, value: number, prev: number): string {
  const d = value - prev
  if (kind === 'reps') return `+${d} ${d === 1 ? 'rep' : 'reps'}`
  if (kind === 'volume') return `+${Math.round(d).toLocaleString('en-IN')} kg`
  return `+${Number.isInteger(d) ? d : d.toFixed(1)} kg`
}

/** Weight predicted for `reps` from an estimated 1RM (Epley, inverted), to the nearest 0.5 kg. */
export function predictWeight(e1rm: number, reps: number): number {
  const w = reps === 1 ? e1rm : e1rm / (1 + reps / 30)
  return Math.round(w * 2) / 2
}
