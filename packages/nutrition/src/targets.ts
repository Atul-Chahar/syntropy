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

export const GOAL_INFO: Record<GoalType, { name: string; sub: string; dot: string }> = {
  cut: { name: 'Lean & defined', sub: 'Lose fat, keep muscle', dot: '#FF6B3D' },
  recomp: { name: 'Recomposition', sub: 'Same weight, less fat', dot: '#FFC7B0' },
  gain: { name: 'Lean muscle', sub: 'Slow, clean gain', dot: '#A9C3A0' },
  maintain: { name: 'Maintain', sub: 'Hold what you built', dot: 'rgba(243,241,236,0.6)' },
}

/**
 * Planned rate of change as a fraction of body weight per week.
 * Cut: 0.5 / 0.75 / 1.0 % per week, the range that keeps lean mass in trained lifters
 * (Helms, Aragon & Fitschen 2014, JISSN 11:20). Gain: 0.5 / 1.0 / 1.5 % per month, Aragon's
 * advanced / intermediate / beginner rates, so most of the gain can be muscle.
 */
export const PACE_RATE: Record<'cut' | 'gain', Record<Pace, number>> = {
  cut: { gentle: 0.005, steady: 0.0075, faster: 0.01 },
  gain: { gentle: 0.005 / 4.345, steady: 0.01 / 4.345, faster: 0.015 / 4.345 },
}

/** Energy in one kg of body-weight change (Wishnofsky's ~7,700 kcal/kg). */
export const KCAL_PER_KG = 7700

/** Share of the change that is fat. Slower cuts and slower gains keep more muscle. */
const FAT_SHARE: Record<'cut' | 'gain', Record<Pace, number>> = {
  cut: { gentle: 0.9, steady: 0.85, faster: 0.75 },
  gain: { gentle: 0.3, steady: 0.4, faster: 0.5 },
}

/** A realistic lean finish line: athletic but sustainable (men ~12 %, women ~22 %). */
const LEAN_BF = { male: 12, female: 22 }
const MIN_BF = { male: 8, female: 16 }

/**
 * Body fat from BMI, age and sex (Deurenberg, Weststrate & Seidell 1991, Br J Nutr 65:105).
 * Only a starting point: it overestimates lean, muscular people. A measured value always wins.
 */
export function estimateBodyFat(p: Pick<BodyProfile, 'sex' | 'age' | 'heightCm' | 'weightKg'>) {
  const bmi = p.weightKg / (p.heightCm / 100) ** 2
  const bf = 1.2 * bmi + 0.23 * p.age - 10.8 * (p.sex === 'male' ? 1 : 0) - 5.4
  return Math.round(Math.max(MIN_BF[p.sex] - 3, Math.min(50, bf)) * 10) / 10
}

/** Fat-free mass index, normalised to 1.8 m (Kouri et al. 1995). ~20 is well trained, 25 is rare. */
export const ffmi = (leanKg: number, heightCm: number) =>
  Math.round((leanKg / (heightCm / 100) ** 2 + 6.1 * (1.8 - heightCm / 100)) * 10) / 10

/** Planned weekly change in kg for a goal at this weight (negative = losing). */
export function plannedRateKgPerWeek(type: GoalType, pace: Pace, weightKg: number): number {
  if (type === 'cut') return -weightKg * PACE_RATE.cut[pace]
  if (type === 'gain') return weightKg * PACE_RATE.gain[pace]
  return 0
}

/** The target weight we suggest when the user has not set one. */
export function suggestedTargetKg(p: BodyProfile, type: GoalType, pace: Pace): number {
  const bf = p.bodyFatPct ?? estimateBodyFat(p)
  const lean = p.weightKg * (1 - bf / 100)
  const half = (n: number) => Math.round(n * 2) / 2
  if (type === 'cut') {
    // Lose fat down to a lean finish line, or 3 points lower if already near it.
    const goalBf = Math.max(MIN_BF[p.sex], Math.min(LEAN_BF[p.sex], bf - 3))
    return half(Math.min(p.weightKg - 1, lean / (1 - goalBf / 100)))
  }
  // Gain: one 16-week block at the chosen pace.
  if (type === 'gain') return half(p.weightKg + plannedRateKgPerWeek(type, pace, p.weightKg) * 16)
  return half(p.weightKg)
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
  /** Weeks to the target at the planned pace (null when there is no end point). */
  weeks: number | null
  /** Projected body fat at the target. */
  targetBodyFatPct: number | null
  /** Current body fat: measured if entered, otherwise estimated. */
  bodyFatPct: number
  bodyFatEstimated: boolean
  leanKg: number
  ffmi: number
  /** Planned change in kg per week (negative = losing). */
  rateKgPerWeek: number
  maintenanceKcal: number
  formulaKcal: number
  maintenanceSource: 'formula' | 'measured' | 'blended'
  measuredDays: number
  /** True when the safety floor raised the rest-day target. */
  floored: boolean
}

export interface TargetOptions {
  /** Sum of accepted weekly check-in changes. */
  adjustKcal?: number
  /** The user's own target weight; a suggestion is used when absent. */
  targetKg?: number | null
  /** Maintenance measured from food logs and the weight trend (see measuredMaintenance). */
  measured?: { kcal: number; days: number } | null
}

const r5 = (n: number) => Math.round(n / 5) * 5
const r10 = (n: number) => Math.round(n / 10) * 10

/**
 * Daily targets. Maintenance starts from Mifflin-St Jeor x activity + training and moves toward
 * what the user's own logs and weight trend show. The deficit or surplus comes from the planned
 * rate of change; training days get more and rest days less with the week's total unchanged;
 * calories never drop below resting energy.
 */
export function computeTargets(
  p: BodyProfile,
  type: GoalType,
  pace: Pace,
  o: TargetOptions = {},
): Targets {
  const formula = maintenance(p)
  const measuredDays = o.measured?.days ?? 0
  // Trust the measured value more as logged days grow (85 % weight from ~4 weeks).
  const w = o.measured ? Math.min(0.85, Math.max(0, (measuredDays - 7) / 24)) : 0
  const measured = o.measured
    ? Math.max(formula * 0.7, Math.min(formula * 1.3, o.measured.kcal))
    : formula
  const m = formula * (1 - w) + measured * w
  const source = w === 0 ? 'formula' : w >= 0.85 ? 'measured' : 'blended'

  const bodyFatEstimated = p.bodyFatPct == null
  const bf = p.bodyFatPct ?? estimateBodyFat(p)
  const leanKg = Math.round(p.weightKg * (1 - bf / 100) * 10) / 10

  const paced = type === 'cut' || type === 'gain'
  let targetWeightKg = o.targetKg ?? suggestedTargetKg(p, type, pace)
  if (type === 'cut') targetWeightKg = Math.min(targetWeightKg, p.weightKg - 0.5)
  if (type === 'gain') targetWeightKg = Math.max(targetWeightKg, p.weightKg + 0.5)
  if (!paced) targetWeightKg = Math.round(p.weightKg * 2) / 2

  const rateKgPerWeek = plannedRateKgPerWeek(type, pace, p.weightKg)
  // Recomposition: a small deficit (~5 %) with high protein and progressive training.
  const delta =
    (paced ? (rateKgPerWeek * KCAL_PER_KG) / 7 : type === 'recomp' ? -Math.min(250, m * 0.05) : 0) +
    (o.adjustKcal ?? 0)

  const days = Math.min(6, Math.max(1, p.trainingDaysPerWeek ?? 3))
  const daily = m + delta
  const floor = Math.max(bmr(p), p.sex === 'male' ? 1500 : 1200)
  const restRaw = daily - (100 * days) / (7 - days)
  const kcalTraining = r10(Math.max(floor + 100, daily + 100))
  const kcalRest = r10(Math.max(floor, restRaw))
  const floored = restRaw < floor
  // When the floor lifts calories, the real weekly deficit (and so the pace) is smaller.
  const weekAvg = (kcalTraining * days + kcalRest * (7 - days)) / 7
  const rate = floored && paced ? ((weekAvg - m) * 7) / KCAL_PER_KG : rateKgPerWeek

  // Protein from lean mass so high body fat does not inflate it: 2.6 g/kg lean while cutting
  // (Helms 2014: 2.3-3.1), 2.2 g/kg lean otherwise (~1.8-2.0 g/kg body weight; Morton 2018).
  const protein = r5(leanKg * (type === 'cut' || type === 'recomp' ? 2.6 : 2.2))
  const fat = Math.max(45, r5(p.weightKg * 0.9))
  const carbs = (k: number) => Math.max(50, r5((k - protein * 4 - fat * 9) / 4))
  const waterMl = Math.round((p.weightKg * 35 + 900) / 250) * 250

  let weeks: number | null = null
  let targetBodyFatPct: number | null = null
  if (paced) {
    const pct = Math.abs(rate) / p.weightKg
    // The rate is a share of current weight, so it shrinks (cut) or grows (gain) over time.
    const ratio = targetWeightKg / p.weightKg
    const right = (type === 'cut') === rate < 0 && pct > 0.0005
    weeks = right
      ? Math.max(1, Math.ceil(Math.log(ratio) / Math.log(type === 'cut' ? 1 - pct : 1 + pct)))
      : null
    const fatKg = p.weightKg - leanKg + (targetWeightKg - p.weightKg) * FAT_SHARE[type][pace]
    targetBodyFatPct = Math.round((fatKg / targetWeightKg) * 1000) / 10
  }

  return {
    type,
    pace,
    deltaKcal: Math.round(delta),
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
    bodyFatPct: bf,
    bodyFatEstimated,
    leanKg,
    ffmi: ffmi(leanKg, p.heightCm),
    rateKgPerWeek: Math.round(rate * 100) / 100,
    maintenanceKcal: Math.round(m),
    formulaKcal: Math.round(formula),
    maintenanceSource: source,
    measuredDays,
    floored,
  }
}

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
