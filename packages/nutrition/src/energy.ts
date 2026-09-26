import { ACTIVITY_FACTOR, type BodyProfile, bmr } from './targets'

export type WeighIn = { d: string; w: number }

const DAY = 86400000
const t = (d: string) => new Date(`${d}T12:00:00`).getTime()

/**
 * Exponential moving average of body weight that respects gaps between weigh-ins
 * (alpha per day = 0.1, like the classic "hacker's diet" trend).
 */
export function weightTrend(
  entries: WeighIn[],
  alphaPerDay = 0.1,
): { d: string; w: number; ema: number }[] {
  const sorted = [...entries].sort((a, b) => (a.d < b.d ? -1 : 1))
  const out: { d: string; w: number; ema: number }[] = []
  let ema: number | null = null
  let prev = 0
  for (const e of sorted) {
    if (ema == null) ema = e.w
    else {
      const days = Math.max(1, (t(e.d) - prev) / DAY)
      const a = 1 - (1 - alphaPerDay) ** days
      ema = ema + a * (e.w - ema)
    }
    prev = t(e.d)
    out.push({ d: e.d, w: e.w, ema: Math.round(ema * 100) / 100 })
  }
  return out
}

/** kg per week from the trend over the last `days` days (null without enough data). */
export function trendRate(entries: WeighIn[], days = 14): number | null {
  const tr = weightTrend(entries)
  if (tr.length < 2) return null
  const last = tr[tr.length - 1]
  const cutoff = t(last.d) - days * DAY
  const first = tr.find((x) => t(x.d) >= cutoff) ?? tr[0]
  const span = (t(last.d) - t(first.d)) / DAY
  if (span < 5) return null
  return ((last.ema - first.ema) / span) * 7
}

/** Rough training energy from session length (5.5 MET for resistance work). */
export function workoutKcal(weightKg: number, minutes: number): number {
  return Math.round(5.5 * weightKg * (Math.max(10, minutes) / 60))
}

export interface EnergyOut {
  bmr: number
  daily: number
  training: number
  total: number
}

/** Energy out for a day: BMR + daily-life activity + logged training. */
export function energyOut(p: BodyProfile, trainingKcal: number): EnergyOut {
  const b = Math.round(bmr(p))
  const daily = Math.round(b * (ACTIVITY_FACTOR[p.activity] - 1))
  return {
    bmr: b,
    daily,
    training: Math.round(trainingKcal),
    total: b + daily + Math.round(trainingKcal),
  }
}

/** Training-day carb note used on Home (heavy lower body or long session raises carbs). */
export function carbBoost(yesterdayVolumeKg: number, legDay: boolean): number {
  if (legDay && yesterdayVolumeKg > 6000) return 40
  if (yesterdayVolumeKg > 9000) return 30
  return 0
}
