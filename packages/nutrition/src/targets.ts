export type Sex = 'male' | 'female'
/** Daily life outside training; training energy is added separately. */
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active'
export type GoalType = 'cut' | 'recomp' | 'gain' | 'maintain'
export type Pace = 'gentle' | 'steady' | 'faster'

export interface BodyProfile {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: Activity
  bodyFatPct?: number
  trainingDaysPerWeek?: number
}

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.3,
  moderate: 1.4,
  active: 1.5,
}
export const ACTIVITY_LABEL: Record<Activity, string> = {
  sedentary: 'Mostly sitting',
  light: 'On my feet sometimes',
  moderate: 'On my feet a lot',
  active: 'Physical work',
}

/** Mifflin-St Jeor resting energy. */
export function bmr(p: Pick<BodyProfile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161)
}

/** Typical kcal for one resistance session at this body weight (~60 min at 5.5 MET). */
export const sessionKcal = (weightKg: number, minutes = 60) =>
  Math.round(5.5 * weightKg * (minutes / 60))

/** Maintenance: BMR x daily-life factor + the average daily share of training. */
export function maintenance(p: BodyProfile): number {
  const daily = bmr(p) * ACTIVITY_FACTOR[p.activity]
  const training = (sessionKcal(p.weightKg) * (p.trainingDaysPerWeek ?? 3)) / 7
  return daily + training
}

// Deltas from Goal.dc.html.
export const PACE_DELTA: Record<'cut' | 'gain', Record<Pace, number>> = {
  cut: { gentle: -250, steady: -400, faster: -600 },
  gain: { gentle: 150, steady: 250, faster: 400 },
}

export const GOAL_INFO: Record<GoalType, { name: string; sub: string; dot: string }> = {
  cut: { name: 'Lean & defined', sub: 'Lose fat, keep muscle', dot: '#FF6B3D' },
  recomp: { name: 'Recomposition', sub: 'Same weight, less fat', dot: '#FFC7B0' },
  gain: { name: 'Lean muscle', sub: 'Slow, clean gain', dot: '#A9C3A0' },
  maintain: { name: 'Maintain', sub: 'Hold what you built', dot: 'rgba(243,241,236,0.6)' },
}

export interface Targets {
  type: GoalType
  pace: Pace
  deltaKcal: number
  kcalTraining: number
  kcalRest: number
  protein: number
  carbsTraining: number
  carbsRest: number
  fat: number
  waterMl: number
  targetWeightKg: number
  weeks: number | null
  targetBodyFatPct: number | null
  maintenanceKcal: number
}

const r5 = (n: number) => Math.round(n / 5) * 5
const r10 = (n: number) => Math.round(n / 10) * 10

export function goalDelta(type: GoalType, pace: Pace): number {
  if (type === 'cut' || type === 'gain') return PACE_DELTA[type][pace]
  return type === 'recomp' ? -150 : 0
}

/**
 * Daily targets from Goal.dc.html's formula with maintenance from Mifflin-St Jeor instead of
 * the board's fixed 2,650: training days sit 100 kcal above maintenance and rest days 100 below.
 */
export function computeTargets(
  p: BodyProfile,
  type: GoalType,
  pace: Pace,
  adjustKcal = 0,
): Targets {
  const m = maintenance(p)
  const delta = goalDelta(type, pace) + adjustKcal
  const kcalTraining = r10(m + 100 + delta)
  const kcalRest = r10(m - 100 + delta)
  const protein = r5(p.weightKg * (type === 'maintain' ? 1.8 : 2.0))
  const fat = Math.max(45, r5(p.weightKg * 0.9))
  const carbs = (k: number) => Math.max(50, r5((k - protein * 4 - fat * 9) / 4))
  const waterMl = Math.round((p.weightKg * 35 + 900) / 250) * 250
  const change = type === 'cut' ? -0.036 : type === 'gain' ? 0.038 : 0
  const targetWeightKg = Math.round(p.weightKg * (1 + change) * 10) / 10
  const rate = (Math.abs(goalDelta(type, pace)) * 7) / 7700
  const weeks =
    type === 'cut' || type === 'gain'
      ? Math.max(1, Math.round(Math.abs(targetWeightKg - p.weightKg) / rate))
      : type === 'recomp'
        ? 16
        : null
  let targetBodyFatPct: number | null = null
  if (p.bodyFatPct != null) {
    const fatKg = (p.weightKg * p.bodyFatPct) / 100
    const dKg = targetWeightKg - p.weightKg
    // Losing: ~85 % of weight lost is fat. Gaining slowly: ~30 % of gain is fat. Recomp: -3 points.
    const newFat =
      type === 'recomp' ? fatKg - p.weightKg * 0.03 : fatKg + dKg * (dKg < 0 ? 0.85 : 0.3)
    targetBodyFatPct = Math.round((newFat / targetWeightKg) * 100)
  }
  return {
    type,
    pace,
    deltaKcal: delta,
    kcalTraining,
    kcalRest,
    protein,
    carbsTraining: carbs(kcalTraining),
    carbsRest: carbs(kcalRest),
    fat,
    waterMl,
    targetWeightKg,
    weeks,
    targetBodyFatPct,
    maintenanceKcal: Math.round(m),
  }
}

/** Planned weekly change in kg for a goal (negative = losing). */
export const plannedRateKgPerWeek = (type: GoalType, pace: Pace) =>
  (goalDelta(type, pace) * 7) / 7700

/**
 * Weekly check-in rule. Compares the observed trend with the planned rate and moves the calorie
 * target by a bounded step. Code decides the number; the AI only explains it.
 */
export function weeklyAdjustment(
  observedKgPerWeek: number,
  plannedKgPerWeek: number,
): { kcal: number; reason: 'on-track' | 'too-fast' | 'too-slow' } {
  const diff = observedKgPerWeek - plannedKgPerWeek
  if (Math.abs(diff) < 0.1) return { kcal: 0, reason: 'on-track' }
  const raw = (-diff * 7700) / 7
  const kcal = Math.max(-150, Math.min(150, Math.round(raw / 50) * 50))
  // Losing faster than planned (diff < 0 while cutting) means eat a little more.
  const faster =
    Math.abs(observedKgPerWeek) > Math.abs(plannedKgPerWeek) &&
    Math.sign(observedKgPerWeek) === Math.sign(plannedKgPerWeek || observedKgPerWeek)
  return { kcal, reason: faster ? 'too-fast' : 'too-slow' }
}
