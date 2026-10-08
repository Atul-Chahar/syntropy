/**
 * On-device workout plan generator. Pure and deterministic apart from the routine ids: the same
 * input always gives the same split, exercises, sets, reps and weekdays.
 */
import { EX, exTitle } from '@/lib/ex'
import type { Routine, RoutineEx } from '@/stores/training'
import { GYM_PRESETS, INJURIES } from './presets'
import {
  candidates,
  type Muscle,
  type PickContext,
  SLOT_INFO,
  type Slot,
  slotOf,
  stapleCount,
} from './slots'

export type PlanInput = {
  goal: 'muscle' | 'strength' | 'fatloss' | 'general'
  experience: 'new' | 'some' | 'experienced'
  days: number /* 1-7 */
  preferredDays?: number[] /* 0-6 */
  sessionMin: number /* 30-120 */
  equipment: string[]
  focus: string[]
  injuries: string[]
  cardio: 'none' | 'finishers' | 'separate'
}

export type PlanEx = RoutineEx & {
  why?: string
  slot?: Slot
  repsMin?: number
  /** mode 'time': seconds per set. */
  sec?: number
  /** mode 'cardio': minutes and speed (km/h). */
  min?: number
  speed?: number
}

export type PlanRoutine = Omit<Routine, 'ex'> & { why?: string; ex: PlanEx[] }

export type GeneratedPlan = {
  name: string
  summary: string
  split: string
  routines: PlanRoutine[]
  week: Record<string, string>
  notes: string[]
}

/* ---------------------------------------------------------------------------------------------
 * Day templates
 * ------------------------------------------------------------------------------------------- */

type Role = 'main' | 'comp' | 'acc'
/** [slot, role, priority]: priority 1 is kept longest when a session must be shortened. */
type SlotSpec = [Slot, Role, number]
type Kind = 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'legs' | 'cardio' | 'recovery'
type DayT = { name: string; emoji: string; kind: Kind; slots: SlotSpec[] }

const FB_1: SlotSpec[] = [
  ['squat', 'main', 1],
  ['h-push', 'comp', 1],
  ['h-pull', 'comp', 2],
  ['hinge', 'comp', 3],
  ['v-pull', 'comp', 4],
  ['lateral-raise', 'acc', 6],
  ['biceps', 'acc', 7],
  ['triceps', 'acc', 7],
  ['core-anti', 'acc', 8],
]
const FB_A: SlotSpec[] = [
  ['squat', 'main', 1],
  ['h-push', 'comp', 1],
  ['v-pull', 'comp', 2],
  ['ham-curl', 'acc', 5],
  ['lateral-raise', 'acc', 6],
  ['triceps', 'acc', 7],
  ['core-anti', 'acc', 8],
]
const FB_B: SlotSpec[] = [
  ['hinge', 'main', 1],
  ['v-push', 'comp', 2],
  ['h-pull', 'comp', 1],
  ['lunge', 'comp', 4],
  ['rear-delt', 'acc', 6],
  ['biceps', 'acc', 7],
  ['core-flex', 'acc', 8],
]
const FB_C: SlotSpec[] = [
  ['leg-press', 'main', 1],
  ['incline-push', 'comp', 1],
  ['v-pull', 'comp', 2],
  ['glute', 'acc', 5],
  ['lateral-raise', 'acc', 6],
  ['triceps', 'acc', 7],
  ['calf', 'acc', 8],
]
const UPPER_A: SlotSpec[] = [
  ['h-push', 'main', 1],
  ['h-pull', 'comp', 1],
  ['v-pull', 'comp', 2],
  ['v-push', 'comp', 3],
  ['lateral-raise', 'acc', 5],
  ['triceps', 'acc', 6],
  ['biceps', 'acc', 6],
]
const UPPER_B: SlotSpec[] = [
  ['v-pull', 'main', 1],
  ['incline-push', 'comp', 1],
  ['h-pull', 'comp', 2],
  ['fly', 'acc', 5],
  ['rear-delt', 'acc', 5],
  ['biceps', 'acc', 6],
  ['triceps', 'acc', 6],
]
const LOWER_A: SlotSpec[] = [
  ['squat', 'main', 1],
  ['hinge', 'comp', 2],
  ['lunge', 'comp', 4],
  ['ham-curl', 'acc', 5],
  ['core-anti', 'acc', 6],
  ['calf', 'acc', 7],
]
const LOWER_B: SlotSpec[] = [
  ['hinge', 'main', 1],
  ['leg-press', 'comp', 2],
  ['glute', 'acc', 4],
  ['quad-iso', 'acc', 5],
  ['core-flex', 'acc', 6],
  ['calf', 'acc', 7],
]
const PUSH_A: SlotSpec[] = [
  ['h-push', 'main', 1],
  ['v-push', 'comp', 2],
  ['incline-push', 'comp', 3],
  ['lateral-raise', 'acc', 4],
  ['triceps', 'acc', 5],
  ['fly', 'acc', 7],
]
const PUSH_B: SlotSpec[] = [
  ['incline-push', 'main', 1],
  ['h-push', 'comp', 2],
  ['v-push', 'comp', 3],
  ['lateral-raise', 'acc', 4],
  ['triceps', 'acc', 5],
  ['dip', 'acc', 7],
]
const PULL_A: SlotSpec[] = [
  ['v-pull', 'main', 1],
  ['h-pull', 'comp', 1],
  ['h-pull', 'comp', 3],
  ['rear-delt', 'acc', 4],
  ['biceps', 'acc', 5],
  ['biceps', 'acc', 7],
]
const PULL_B: SlotSpec[] = [
  ['h-pull', 'main', 1],
  ['v-pull', 'comp', 1],
  ['v-pull', 'comp', 3],
  ['rear-delt', 'acc', 4],
  ['biceps', 'acc', 5],
  ['biceps', 'acc', 7],
]
const LEGS_A: SlotSpec[] = [
  ['squat', 'main', 1],
  ['hinge', 'comp', 2],
  ['leg-press', 'comp', 4],
  ['ham-curl', 'acc', 5],
  ['quad-iso', 'acc', 6],
  ['calf', 'acc', 6],
  ['core-anti', 'acc', 7],
]
const LEGS_B: SlotSpec[] = [
  ['hinge', 'main', 1],
  ['leg-press', 'comp', 2],
  ['lunge', 'comp', 3],
  ['glute', 'acc', 4],
  ['ham-curl', 'acc', 5],
  ['calf', 'acc', 6],
  ['core-flex', 'acc', 7],
]

const FULL = '🏋️'
const UP = '💪'
const LEG = '🦵'
const day = (name: string, emoji: string, kind: Kind, slots: SlotSpec[]): DayT => ({
  name,
  emoji,
  kind,
  slots,
})

type Split = { label: string; days: DayT[]; freq: number }

function chooseSplit(days: number, experience: PlanInput['experience']): Split {
  if (days <= 1)
    return { label: 'Full Body', days: [day('Full Body', FULL, 'full', FB_1)], freq: 1 }
  if (days === 2)
    return {
      label: 'Full Body A/B',
      days: [day('Full Body A', FULL, 'full', FB_A), day('Full Body B', FULL, 'full', FB_B)],
      freq: 2,
    }
  if (days === 3)
    return experience === 'experienced'
      ? {
          label: 'Push/Pull/Legs',
          days: [
            day('Push', UP, 'push', PUSH_A),
            day('Pull', UP, 'pull', PULL_A),
            day('Legs', LEG, 'legs', LEGS_A),
          ],
          freq: 1,
        }
      : {
          label: 'Full Body A/B/C',
          days: [
            day('Full Body A', FULL, 'full', FB_A),
            day('Full Body B', FULL, 'full', FB_B),
            day('Full Body C', FULL, 'full', FB_C),
          ],
          freq: 3,
        }
  if (days === 4)
    return {
      label: 'Upper/Lower',
      days: [
        day('Upper A', UP, 'upper', UPPER_A),
        day('Lower A', LEG, 'lower', LOWER_A),
        day('Upper B', UP, 'upper', UPPER_B),
        day('Lower B', LEG, 'lower', LOWER_B),
      ],
      freq: 2,
    }
  if (days === 5)
    return {
      label: 'Upper/Lower + Push/Pull/Legs',
      days: [
        day('Upper', UP, 'upper', UPPER_A),
        day('Lower', LEG, 'lower', LOWER_A),
        day('Push', UP, 'push', PUSH_B),
        day('Pull', UP, 'pull', PULL_A),
        day('Legs', LEG, 'legs', LEGS_B),
      ],
      freq: 2,
    }
  return {
    label: 'Push/Pull/Legs ×2',
    days: [
      day('Push A', UP, 'push', PUSH_A),
      day('Pull A', UP, 'pull', PULL_A),
      day('Legs A', LEG, 'legs', LEGS_A),
      day('Push B', UP, 'push', PUSH_B),
      day('Pull B', UP, 'pull', PULL_B),
      day('Legs B', LEG, 'legs', LEGS_B),
    ],
    freq: 2,
  }
}

/** When a slot has nothing available, try these instead (in order). */
const FALLBACK: Partial<Record<Slot, Slot[]>> = {
  squat: ['leg-press', 'lunge'],
  'leg-press': ['squat', 'lunge'],
  lunge: ['squat', 'leg-press', 'glute'],
  hinge: ['glute', 'ham-curl'],
  'quad-iso': ['lunge', 'leg-press', 'squat'],
  'ham-curl': ['hinge', 'glute'],
  glute: ['hinge', 'lunge'],
  'h-push': ['incline-push', 'dip'],
  'incline-push': ['h-push', 'v-push'],
  'v-push': ['incline-push', 'lateral-raise'],
  dip: ['triceps', 'h-push'],
  fly: ['incline-push', 'dip'],
  'lateral-raise': ['v-push'],
  'rear-delt': ['h-pull'],
  'h-pull': ['v-pull'],
  'v-pull': ['h-pull'],
  triceps: ['dip'],
  'core-flex': ['core-anti'],
  'core-anti': ['core-flex'],
}

/** Focus muscle → slot added as an extra isolation, the day kinds it fits, and muscles. */
const FOCUS: Record<string, { slots: Slot[]; kinds: Kind[]; muscles: Muscle[] }> = {
  chest: { slots: ['fly'], kinds: ['upper', 'push', 'full'], muscles: ['chest'] },
  back: { slots: ['h-pull'], kinds: ['upper', 'pull', 'full'], muscles: ['back'] },
  shoulders: {
    slots: ['lateral-raise'],
    kinds: ['upper', 'push', 'full'],
    muscles: ['delts'],
  },
  arms: {
    slots: ['biceps', 'triceps'],
    kinds: ['upper', 'pull', 'push', 'full'],
    muscles: ['biceps', 'triceps'],
  },
  glutes: { slots: ['glute'], kinds: ['lower', 'legs', 'full'], muscles: ['glutes'] },
  legs: {
    slots: ['quad-iso', 'ham-curl'],
    kinds: ['lower', 'legs', 'full'],
    muscles: ['quads', 'hams', 'glutes', 'calves'],
  },
  core: {
    slots: ['core-anti'],
    kinds: ['upper', 'lower', 'push', 'pull', 'legs', 'full'],
    muscles: ['core'],
  },
}
const FOCUS_KIND_FIT: Record<Slot, Kind[]> = {
  biceps: ['upper', 'pull', 'full'],
  triceps: ['upper', 'push', 'full'],
} as Record<Slot, Kind[]>

/* ---------------------------------------------------------------------------------------------
 * Weekdays
 * ------------------------------------------------------------------------------------------- */

const MON_FIRST = [1, 2, 3, 4, 5, 6, 0]
const SPREAD: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
}
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monOrder = (a: number, b: number) => MON_FIRST.indexOf(a) - MON_FIRST.indexOf(b)

function pickWeekdays(count: number, preferred?: number[]): number[] {
  const want = [
    ...new Set((preferred ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
  ].sort(monOrder)
  const out = want.slice(0, count)
  for (const d of [...(SPREAD[count] ?? []), ...MON_FIRST]) {
    if (out.length >= count) break
    if (!out.includes(d)) out.push(d)
  }
  return out.sort(monOrder)
}

/* ---------------------------------------------------------------------------------------------
 * Reps, sets, time
 * ------------------------------------------------------------------------------------------- */

const TIMED = new Set(['2135', '0705', '2133'])
/** Steady-state cardio that logs as minutes @ km/h. */
const STEADY: Record<string, number> = {
  '3666': 5,
  '0798': 20,
  '2138': 25,
  '2141': 8,
  '2311': 3,
  '2331': 8,
  '0685': 8,
}

const BW_EQ = new Set(['body weight', 'band', 'resistance band'])

type Scheme = { reps: number; repsMin: number } | { sec: number }

function schemeFor(id: string, slot: Slot, role: Role, input: PlanInput): Scheme {
  const ex = EX[id]
  const n = ex?.n.toLowerCase() ?? ''
  const strength = input.goal === 'strength'
  const r = (repsMin: number, reps: number) => ({ repsMin, reps })
  if (TIMED.has(id)) {
    if (slot === 'carry') return { sec: 40 }
    return { sec: input.experience === 'new' ? 30 : input.experience === 'some' ? 40 : 45 }
  }
  const bw = BW_EQ.has(ex?.eq ?? '')
  if (slot === 'core-flex') return /hanging|captain/.test(n) ? r(8, 12) : r(10, 15)
  if (slot === 'core-anti') {
    if (/roll/.test(n)) return r(6, 10)
    return r(8, 12)
  }
  if (slot === 'calf') return bw ? r(15, 25) : strength ? r(8, 12) : r(10, 15)
  if (id === '0549') return r(12, 20)
  if (bw && /pull-?up|pull up|chin-?up|\bdips?\b/.test(n) && !/assisted/.test(n)) {
    if (input.experience === 'new') return r(3, 8)
    return strength ? r(4, 6) : r(5, 10)
  }
  if (bw && ['squat', 'lunge', 'glute', 'hinge'].includes(slot)) {
    if (/pistol/.test(n)) return r(4, 8)
    return strength ? r(8, 15) : r(12, 20)
  }
  if (bw && SLOT_INFO[slot].compound) return strength ? r(6, 12) : r(8, 15)
  if (bw) return r(12, 20)
  if (strength) {
    if (role === 'main') return r(4, 6)
    if (role === 'comp' || SLOT_INFO[slot].compound) return r(6, 8)
    return r(8, 12)
  }
  if (role !== 'acc' || SLOT_INFO[slot].compound) return r(6, 10)
  return r(10, 15)
}

function baseSets(role: Role, input: PlanInput): number {
  if (input.experience === 'new') return role === 'acc' ? 2 : 3
  if (input.experience === 'some') return 3
  return role === 'main' ? 4 : 3
}

const MAX_SETS: Record<PlanInput['experience'], number> = { new: 3, some: 4, experienced: 4 }
const VOLUME: Record<PlanInput['experience'], [number, number]> = {
  new: [8, 12],
  some: [12, 16],
  experienced: [16, 20],
}

const isCompound = (e: { id: string; slot?: Slot }) => {
  const slot = e.slot ?? slotOf(e.id)
  if (slot === 'glute') return ['barbell', 'smith machine'].includes(EX[e.id]?.eq ?? '')
  return SLOT_INFO[slot].compound
}

/** Minutes for one exercise's sets, rest included (no warm-up). */
function exMinutes(e: PlanEx): number {
  const sets = Math.max(1, e.sets || 1)
  const slot = e.slot ?? slotOf(e.id)
  if (e.mode === 'cardio') return (e.min ?? 20) * sets
  if (e.mode === 'time') {
    const sec = e.sec ?? 45
    return slot === 'cardio' ? sets * ((sec + 30) / 60) : sets * (sec / 60 + 1)
  }
  return sets * (isCompound(e) ? 3 : 2)
}

/** Working minutes for a list of exercises; a superset saves about a quarter of the time. */
function workMinutes(ex: PlanEx[]): number {
  let total = 0
  for (let i = 0; i < ex.length; i++) {
    const e = ex[i]
    const paired = e.sg && (ex[i - 1]?.sg === e.sg || ex[i + 1]?.sg === e.sg)
    total += exMinutes(e) * (paired ? 0.75 : 1)
  }
  return total
}

const WARMUP = 5

/** Estimated session length in minutes: 5 min warm-up, ~3 min per compound set and ~2 min
 *  per isolation set including rest, cardio at its planned duration. */
export function estimateMinutes(routine: { ex: PlanEx[] | RoutineEx[] }): number {
  return Math.round(WARMUP + workMinutes(routine.ex as PlanEx[]))
}

/* ---------------------------------------------------------------------------------------------
 * Copy
 * ------------------------------------------------------------------------------------------- */

const SLOT_WHY: Record<Slot, string> = {
  squat: 'Squat pattern for quads and glutes.',
  'leg-press': 'Heavy quad and glute work without loading your back.',
  lunge: 'Single-leg work for balance and even legs. Reps are per leg.',
  hinge: 'Hip hinge for hamstrings, glutes and a strong back.',
  'quad-iso': 'Isolates the quads to finish them off.',
  'ham-curl': 'Knee-bending hamstring work that hinges miss.',
  glute: 'Direct glute work.',
  calf: 'Calves need direct work to grow.',
  'h-push': 'Press for chest, front delts and triceps.',
  'incline-push': 'Incline press for upper chest and shoulders.',
  'v-push': 'Overhead press for shoulders and triceps.',
  dip: 'Dips for chest and triceps.',
  fly: 'Chest fly: works the chest through a long stretch without triceps holding you back.',
  'lateral-raise': 'Side delts for shoulder width; presses barely reach them.',
  'rear-delt': 'Rear delts and upper back for healthy, balanced shoulders.',
  'h-pull': 'Row for mid-back thickness, balancing the pressing.',
  'v-pull': 'Vertical pull for wide lats.',
  biceps: 'Direct biceps work.',
  triceps: 'Direct triceps work.',
  'core-flex': 'Abs, trained through a full range.',
  'core-anti': 'Core bracing that carries over to every big lift.',
  carry: 'Loaded carry for grip, core and posture.',
  cardio: 'Cardio at a steady, conversational pace.',
  other: '',
}

const MAIN_WHY: Record<PlanInput['goal'], string> = {
  strength: 'Main lift, done first while you are fresh. Heavy and crisp, with 2-3 min rest.',
  muscle: 'Main lift, done first while you are fresh. Rest about 2 min between sets.',
  fatloss: 'Main lift, done first. Keeping it heavy protects muscle while you diet.',
  general: 'Main lift, done first while you are fresh.',
}

const KIND_WHY: Record<Kind, string> = {
  full: 'Full body: a squat or hinge, a press and a pull, then accessories, so every muscle gets work each session.',
  upper: 'Upper body: presses and pulls in balance, shoulders and arms to finish.',
  lower: 'Lower body: the big leg lift first, then single-leg and isolation work, core last.',
  push: 'Push: chest, shoulders and triceps, heaviest press first.',
  pull: 'Pull: back and biceps, with rear delts for shoulder health.',
  legs: 'Legs: quads, hamstrings, glutes and calves, heaviest lift first.',
  cardio:
    'Steady cardio on a rest day. Keep it easy enough to talk in full sentences (zone 2); it builds fitness without eating into recovery.',
  recovery:
    'Active recovery: easy cardio and a little core. You should finish feeling better than you started.',
}

const GOAL_LABEL: Record<PlanInput['goal'], string> = {
  muscle: 'muscle gain',
  strength: 'strength',
  fatloss: 'fat loss',
  general: 'general fitness',
}
const GOAL_SHORT: Record<PlanInput['goal'], string> = {
  muscle: 'Muscle',
  strength: 'Strength',
  fatloss: 'Fat Loss',
  general: 'Fitness',
}

function describeKit(equipment: string[]): string {
  const kit = new Set(equipment)
  const preset = GYM_PRESETS.find(
    (p) => p.equipment.length === kit.size && p.equipment.every((e) => kit.has(e)),
  )
  if (preset) return preset.label.toLowerCase().replace('/', 'or')
  const parts: string[] = []
  if (kit.has('barbell')) parts.push('a barbell')
  if (kit.has('dumbbell')) parts.push('dumbbells')
  if (kit.has('kettlebell')) parts.push('kettlebells')
  if (kit.has('cable')) parts.push('cables')
  if (kit.has('leverage machine') || kit.has('smith machine')) parts.push('machines')
  if (kit.has('band') || kit.has('resistance band')) parts.push('bands')
  if (kit.has('pull-up bar')) parts.push('a pull-up bar')
  if (!parts.length) return 'body weight only'
  return parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/* ---------------------------------------------------------------------------------------------
 * Generator
 * ------------------------------------------------------------------------------------------- */

type Item = {
  asked: Slot
  slot: Slot
  role: Role
  pri: number
  order: number
  id: string
  sets: number
  /** Sets from experience and focus (kept when time is short); bonus sets go first. */
  base: number
  scheme: Scheme
  sg?: string
  fallback: boolean
}

type BuiltDay = { t: DayT; items: Item[]; finisher?: PlanEx }

const defaultUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const clampInt = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)))

function normalise(input: PlanInput): PlanInput {
  return {
    ...input,
    days: clampInt(input.days, 1, 7),
    sessionMin: clampInt(input.sessionMin, 20, 180),
    equipment: [...new Set(['body weight', ...(input.equipment ?? [])])],
    focus: [...new Set(input.focus ?? [])],
    injuries: [...new Set(input.injuries ?? [])],
  }
}

const ctxOf = (input: PlanInput): PickContext => ({
  equipment: input.equipment,
  injuries: input.injuries,
  experience: input.experience,
  goal: input.goal,
})

function toPlanEx(it: Item, input: PlanInput): PlanEx {
  const out: PlanEx = { id: it.id, sets: it.sets, reps: 0, weight: 0, slot: it.slot }
  if ('sec' in it.scheme) {
    out.mode = 'time'
    out.sec = it.scheme.sec
    out.reps = it.scheme.sec
  } else {
    out.reps = it.scheme.reps
    out.repsMin = it.scheme.repsMin
  }
  if (it.sg) out.sg = it.sg
  const parts: string[] = []
  if (it.role === 'main') parts.push(MAIN_WHY[input.goal])
  else if (it.fallback && it.slot !== it.asked)
    parts.push(`Stands in for ${SLOT_INFO[it.asked].label.toLowerCase()} with your kit.`)
  if (it.role !== 'main' || it.slot !== it.asked) parts.push(SLOT_WHY[it.slot])
  const n = EX[it.id]?.n.toLowerCase() ?? ''
  if (/pull-?up|chin-?up/.test(n) && !/assisted|band/.test(n) && input.experience !== 'experienced')
    parts.push('If you cannot reach the bottom of the range yet, use a band or slow negatives.')
  if ('sec' in it.scheme) parts.push(`Hold or work for ${it.scheme.sec} s per set.`)
  out.why = parts.filter(Boolean).join(' ')
  return out
}

function cardioPick(input: PlanInput): string | null {
  const list = candidates('cardio', ctxOf(input))
  return list[0] ?? null
}

function cardioItem(id: string, minutes: number, why: string): PlanEx {
  const speed = STEADY[id]
  if (speed !== undefined)
    return {
      id,
      sets: 1,
      reps: minutes,
      weight: 0,
      mode: 'cardio',
      min: minutes,
      speed,
      slot: 'cardio',
      why,
    }
  // Interval work (burpees, ropes, climbers): 30 s on, 30 s easy, once a minute.
  return {
    id,
    sets: minutes,
    reps: 30,
    weight: 0,
    mode: 'time',
    sec: 30,
    slot: 'cardio',
    why: `${why} Intervals: 30 s on, 30 s easy, ${minutes} rounds.`,
  }
}

/** The plan generator. Deterministic for a given input (routine ids aside). */
export function generatePlan(
  rawInput: PlanInput,
  opts: { uid?: () => string } = {},
): GeneratedPlan {
  const input = normalise(rawInput)
  const uid = opts.uid ?? defaultUid
  const ctx = ctxOf(input)
  const notes: string[] = []

  // 1. Split and weekdays
  const liftDays = input.days === 7 ? 6 : input.days
  const split = chooseSplit(liftDays, input.experience)
  const recoveryDay = input.days === 7 && input.cardio !== 'none'
  if (input.days === 7 && input.cardio === 'none')
    notes.push(
      'Seven hard days leave no room to recover, so the plan lifts six days and keeps one rest day.',
    )
  const allDays = pickWeekdays(liftDays + (recoveryDay ? 1 : 0), input.preferredDays)
  const liftWeekdays = recoveryDay ? allDays.slice(0, liftDays) : allDays
  const recoveryWeekday = recoveryDay ? allDays[liftDays] : null

  // 2. Add focus isolation slots to fitting days (at most two days each)
  const templates: DayT[] = split.days.map((d) => ({ ...d, slots: [...d.slots] }))
  for (const f of input.focus) {
    const spec = FOCUS[f]
    if (!spec) continue
    for (const slot of spec.slots) {
      const kinds = FOCUS_KIND_FIT[slot] ?? spec.kinds
      let added = 0
      for (const t of templates) {
        if (added >= 2) break
        if (!kinds.includes(t.kind) || t.slots.some(([s]) => s === slot)) continue
        const coreIdx = t.slots.findIndex(([s]) => s === 'core-anti' || s === 'core-flex')
        const at = coreIdx >= 0 ? coreIdx : t.slots.length
        t.slots.splice(at, 0, [slot, 'acc', 4])
        added++
      }
    }
  }
  const focusMuscles = new Set(input.focus.flatMap((f) => FOCUS[f]?.muscles ?? []))

  // 3. Pick exercises: main lifts across the week first, then compounds, then accessories,
  //    so the best options go to the most important slots and repeats get variants.
  const built: BuiltDay[] = templates.map((t) => ({ t, items: [] }))
  const weekUse = new Map<Slot, string[]>()
  for (const role of ['main', 'comp', 'acc'] as Role[]) {
    for (const d of built) {
      d.t.slots.forEach(([asked, r, pri], order) => {
        if (r !== role) return
        const dayIds = new Set(d.items.map((i) => i.id))
        const chain = [asked, ...(FALLBACK[asked] ?? [])]
        for (const slot of chain) {
          const list = candidates(slot, ctx).filter((id) => !dayIds.has(id))
          if (!list.length) continue
          const prior = weekUse.get(slot) ?? []
          const repeatTop =
            role === 'main' && (input.goal === 'strength' || input.experience === 'new')
          const pool = list.slice(0, Math.max(1, Math.min(4, stapleCount(slot, list))))
          const id = repeatTop ? list[0] : (pool.find((x) => !prior.includes(x)) ?? pool[0])
          weekUse.set(slot, [...prior, id])
          const sets = baseSets(role, input)
          d.items.push({
            asked,
            slot,
            role,
            pri,
            order,
            id,
            sets,
            base: sets,
            scheme: schemeFor(id, slot, role, input),
            fallback: slot !== asked,
          })
          break
        }
      })
    }
  }
  for (const d of built) d.items.sort((a, b) => a.order - b.order)

  // 4. Focus: one more set on exercises that train a focus muscle directly
  for (const d of built)
    for (const it of d.items) {
      const direct = Object.entries(SLOT_INFO[it.slot].muscles).some(
        ([m, w]) => w === 1 && focusMuscles.has(m as Muscle),
      )
      if (direct && !('sec' in it.scheme)) {
        it.sets = Math.min(MAX_SETS[input.experience] + 1, it.sets + 1)
        it.base = it.sets
      }
    }

  // 5. Weekly volume: top up muscles below target, trim muscles far above it
  const [lo, hi] = VOLUME[input.experience]
  const volume = () => {
    const v: Partial<Record<Muscle, number>> = {}
    for (const d of built)
      for (const it of d.items)
        for (const [m, w] of Object.entries(SLOT_INFO[it.slot].muscles))
          v[m as Muscle] = (v[m as Muscle] ?? 0) + it.sets * (w ?? 0)
    return v
  }
  const BIG: Muscle[] = ['chest', 'back', 'quads', 'hams', 'glutes', 'delts']
  for (const m of BIG) {
    const target = focusMuscles.has(m) ? hi : lo
    const direct = built
      .flatMap((d) => d.items)
      .filter((it) => SLOT_INFO[it.slot].muscles[m] === 1 && !('sec' in it.scheme))
      .sort((a, b) => (a.role === 'acc' ? 0 : 1) - (b.role === 'acc' ? 0 : 1) || b.pri - a.pri)
    let guard = 0
    while ((volume()[m] ?? 0) < target && guard++ < 40) {
      const next = direct.find((it) => it.sets < MAX_SETS[input.experience])
      if (!next) break
      next.sets++
      direct.push(direct.splice(direct.indexOf(next), 1)[0]) // round robin
    }
    guard = 0
    while ((volume()[m] ?? 0) > hi + 2 && guard++ < 40) {
      const next = [...direct].reverse().find((it) => it.sets > 2 && it.role !== 'main')
      if (!next) break
      next.sets--
      next.base = Math.min(next.base, next.sets)
    }
  }

  // 6. Cardio finishers on two days, upper-body days first
  const finisherId = input.cardio === 'finishers' ? cardioPick(input) : null
  if (finisherId) {
    const rank: Kind[] = ['upper', 'push', 'pull', 'full', 'lower', 'legs']
    const order = built
      .map((d, i) => ({ d, i }))
      .sort((a, b) => rank.indexOf(a.d.t.kind) - rank.indexOf(b.d.t.kind) || a.i - b.i)
      .slice(0, 2)
    for (const { d } of order)
      d.finisher = cardioItem(
        finisherId,
        10,
        'Finisher: 10 minutes of steady cardio after lifting, hard enough to breathe heavily but still talk.',
      )
  }

  // 7. Fit each session into the time budget
  let trimmed = false
  let supersetUsed = false
  for (const d of built) {
    const finMin = () => (d.finisher ? exMinutes(d.finisher) : 0)
    const budget = () => input.sessionMin - WARMUP - finMin()
    const cost = () => workMinutes(d.items.map((it) => toPlanEx(it, input)))
    const byLowPri = () =>
      [...d.items].sort((a, b) => b.pri - a.pri || (a.role === 'acc' ? -1 : 1) || b.order - a.order)
    // a. drop bonus volume sets
    let guard = 0
    while (cost() > budget() && guard++ < 60) {
      const it = byLowPri().find((x) => x.sets > x.base)
      if (!it) break
      it.sets--
    }
    // b. superset adjacent accessories that train different muscles
    if (cost() > budget()) {
      let n = 0
      for (let i = 0; i < d.items.length - 1; i++) {
        const a = d.items[i]
        const b = d.items[i + 1]
        if (a.sg || b.sg || isCompound(a) || isCompound(b)) continue
        if (a.slot === b.slot) continue
        a.sg = b.sg = `ss${++n}`
        supersetUsed = true
        i++
        if (cost() <= budget()) break
      }
    }
    // c. drop the lowest-priority exercises, never below three
    guard = 0
    while (cost() > budget() && d.items.length > 3 && guard++ < 20) {
      const drop = byLowPri()[0]
      d.items = d.items.filter((x) => x !== drop)
      trimmed = true
      // a superset whose partner left is a straight set again
      for (const it of d.items)
        if (it.sg && d.items.filter((x) => x.sg === it.sg).length < 2) it.sg = undefined
    }
    // d. trim sets (never below two)
    guard = 0
    while (cost() > budget() && guard++ < 40) {
      const it = byLowPri().find((x) => x.sets > 2)
      if (!it) break
      it.sets--
      trimmed = true
    }
    // e. still over: shorten the finisher
    if (d.finisher && cost() > budget()) {
      const left = Math.max(5, Math.floor(input.sessionMin - WARMUP - cost()))
      d.finisher = cardioItem(d.finisher.id, Math.min(10, left), d.finisher.why ?? '')
    }
  }

  // 8. Assemble routines
  const routines: PlanRoutine[] = built.map((d) => {
    const ex = d.items.map((it) => toPlanEx(it, input))
    if (d.finisher) ex.push(d.finisher)
    const mainIt = d.items.find((i) => i.role === 'main') ?? d.items[0]
    const why = `${KIND_WHY[d.t.kind]}${mainIt ? ` ${exTitle(mainIt.id)} leads the session.` : ''}`
    return { id: uid(), name: d.t.name, emoji: d.t.emoji, why, ex }
  })

  const week: Record<string, string> = {}
  routines.forEach((r, i) => {
    week[String(liftWeekdays[i])] = r.id
  })

  // Separate cardio days (rest days only, fewer as lifting days go up)
  const cardioId = input.cardio !== 'none' ? cardioPick(input) : null
  if (input.cardio === 'separate' && cardioId && liftDays < 6) {
    const rest = MON_FIRST.filter((d) => !liftWeekdays.includes(d))
    const count = Math.min(rest.length, liftDays <= 3 ? 2 : 1)
    const chosen = Array.from(
      { length: count },
      (_, i) => rest[Math.round((i * rest.length) / count)],
    )
    const minutes = Math.max(20, Math.min(40, input.sessionMin - WARMUP))
    const r: PlanRoutine = {
      id: uid(),
      name: 'Cardio',
      emoji: '🚴',
      why: KIND_WHY.cardio,
      ex: [cardioItem(cardioId, minutes, 'Easy steady cardio.')],
    }
    routines.push(r)
    for (const d of chosen) week[String(d)] = r.id
  }
  if (recoveryWeekday !== null && cardioId) {
    const core = candidates('core-anti', ctx)[0]
    const ex: PlanEx[] = [cardioItem(cardioId, 25, 'Easy pace, nose-breathing if you can.')]
    if (core) {
      const sch = schemeFor(core, 'core-anti', 'acc', input)
      ex.push(
        toPlanEx(
          {
            asked: 'core-anti',
            slot: 'core-anti',
            role: 'acc',
            pri: 9,
            order: 1,
            id: core,
            sets: 2,
            base: 2,
            scheme: sch,
            fallback: false,
          },
          input,
        ),
      )
    }
    const r: PlanRoutine = {
      id: uid(),
      name: 'Active Recovery',
      emoji: '🧘',
      why: KIND_WHY.recovery,
      ex,
    }
    routines.push(r)
    week[String(recoveryWeekday)] = r.id
  }

  // 9. Words
  const v = volume()
  const bigVol = ['chest', 'back', 'quads', 'delts'].map((m) => v[m as Muscle] ?? 0)
  const avgSets = Math.round(bigVol.reduce((a, b) => a + b, 0) / bigVol.length)
  const liftRoutines = routines.slice(0, built.length)
  const mins = liftRoutines.map((r) => estimateMinutes(r))
  const avgMin = Math.round(mins.reduce((a, b) => a + b, 0) / Math.max(1, mins.length))
  const dayList = liftWeekdays.map((d) => DAY_NAMES[d]).join(', ')
  const freqText = split.freq === 1 ? 'once' : split.freq === 2 ? 'twice' : 'three times'
  const summary = [
    `A ${liftDays}-day ${split.label} plan for ${GOAL_LABEL[input.goal]}, built for ${describeKit(input.equipment)} (${dayList}).`,
    `Sessions take about ${avgMin} minutes of your ${input.sessionMin} and train each muscle ${freqText} a week, roughly ${avgSets} hard sets per major muscle.`,
    input.cardio === 'finishers'
      ? 'Two sessions end with a short cardio finisher.'
      : input.cardio === 'separate' && cardioId && liftDays < 6
        ? 'Easy cardio sits on rest days.'
        : '',
  ]
    .filter(Boolean)
    .join(' ')

  notes.push(
    'Weights start empty: your first session sets each baseline. Choose a load you could lift two or three more times.',
    'Double progression: once every set reaches the top of the rep range, add the smallest weight step and work back up from the bottom.',
    'Stop most sets one to three reps short of failure; the last set of an isolation exercise can go closer.',
  )
  if (supersetUsed)
    notes.push(
      'To fit your time, some accessories are paired as supersets: alternate between them and rest after each pair.',
    )
  if (trimmed)
    notes.push(
      `With ${input.sessionMin} minutes, lower-priority accessories were cut. More time per session brings them back.`,
    )
  for (const inj of input.injuries) {
    const i = INJURIES.find((x) => x.id === inj)
    if (i) notes.push(i.note)
  }
  if (input.injuries.length)
    notes.push('Pain is a signal to stop that exercise and swap it, not to push through.')
  if (input.goal === 'fatloss')
    notes.push(
      'For fat loss the diet does most of the work; lifting heavy keeps your muscle while you lose fat. Daily steps help more than extra sessions.',
    )

  return {
    name: `${liftDays}-Day ${split.label} · ${GOAL_SHORT[input.goal]}`,
    summary,
    split: split.label,
    routines,
    week,
    notes,
  }
}

/** Same-slot swaps for an exercise with this kit and these injuries, staples first. */
export function alternatives(exId: string, input: PlanInput, limit = 8): string[] {
  const inp = normalise(input)
  const slot = slotOf(exId)
  if (slot === 'other') {
    const ex = EX[exId]
    if (!ex) return []
    const pool = new Set<string>()
    for (const s of Object.keys(SLOT_INFO) as Slot[]) {
      if (s === 'other') continue
      for (const id of candidates(s, ctxOf(inp))) if (EX[id]?.tg === ex.tg) pool.add(id)
    }
    return [...pool].filter((id) => id !== exId).slice(0, limit)
  }
  return candidates(slot, ctxOf(inp))
    .filter((id) => id !== exId)
    .slice(0, limit)
}
