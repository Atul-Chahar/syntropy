import type { Units } from '@/stores/profile'
import { useProfile } from '@/stores/profile'

/*
 * Display units. Everything is stored metric (kg, cm, g); these helpers only change what the user
 * sees and how a stepper reads. Lifting loads stay in kilograms (the training engine works in kg).
 */

export const LB_PER_KG = 2.2046226
export const OZ_PER_G = 0.03527396

export const useUnits = () => useProfile((p) => p.units)

/** Body weight as a number in the user's unit. */
export const bodyW = (kg: number, u: Units) => (u === 'imperial' ? kg * LB_PER_KG : kg)
/** Back from the user's unit to kilograms. */
export const toKg = (v: number, u: Units) => (u === 'imperial' ? v / LB_PER_KG : v)
export const wUnit = (u: Units) => (u === 'imperial' ? 'lb' : 'kg')

/** "72.4 kg" or "159.6 lb". */
export const fmtBodyW = (kg: number, u: Units, d = 1) => `${bodyW(kg, u).toFixed(d)} ${wUnit(u)}`

/** "178 cm" or "5′10″". */
export function fmtHeight(cm: number, u: Units): string {
  if (u !== 'imperial') return `${Math.round(cm)} cm`
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}′${inches % 12}″`
}

/** Food labels carry grams ("1 medium · 40 g"); imperial shows ounces instead. */
export function fmtFoodLabel(label: string, u: Units): string {
  if (u !== 'imperial') return label
  return label.replace(/(\d+(?:\.\d+)?) g\b/g, (_m, g) => {
    const oz = Number(g) * OZ_PER_G
    return `${oz < 10 ? oz.toFixed(1) : Math.round(oz)} oz`
  })
}
