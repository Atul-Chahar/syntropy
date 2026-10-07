import type { Food, Unit } from './foods'

/** 'extra' holds anything eaten between meals; each extra is its own timed entry. */
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'extra'
export type MainSlot = Exclude<MealSlot, 'extra'>
export const MAIN_SLOTS: MainSlot[] = ['breakfast', 'lunch', 'snack', 'dinner']
export type ItemSource = 'photo' | 'manual' | 'text'

export interface MealItem {
  id: string
  foodId?: string
  name: string
  qty: number
  unit: Unit
  unitLabel?: string
  /** Per ONE unit, so quantity changes scale linearly. */
  per: { kcal: number; protein: number; carbs: number; fat: number }
  confidence?: number
  source: ItemSource
  addedLater: boolean
  /** Quantity at the time of the photo, for "+N added" tags. */
  baseQty?: number
}

export interface Meal {
  id: string
  date: string
  slot: MealSlot
  time: string
  title?: string
  photoId?: string
  items: MealItem[]
  createdAt: number
}

export type Macros = { kcal: number; protein: number; carbs: number; fat: number }

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

export const itemMacros = (it: MealItem): Macros => ({
  kcal: it.per.kcal * it.qty,
  protein: it.per.protein * it.qty,
  carbs: it.per.carbs * it.qty,
  fat: it.per.fat * it.qty,
})

export const add = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + b.kcal,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
})

export const mealTotals = (m: Pick<Meal, 'items'>): Macros =>
  m.items.map(itemMacros).reduce(add, ZERO)
export const dayTotals = (meals: Meal[]): Macros => meals.map(mealTotals).reduce(add, ZERO)

/** Energy share of each macro, for the split bar. */
export function macroSplit(m: Macros) {
  const p = m.protein * 4
  const c = m.carbs * 4
  const f = m.fat * 9
  const sum = Math.max(1, p + c + f)
  return { protein: p / sum, carbs: c / sum, fat: f / sum }
}

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
  extra: 'Extras',
}

/** The slot a meal logged at this hour most likely belongs to. */
export function slotForHour(h: number): MainSlot {
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 19) return 'snack'
  return 'dinner'
}

let seq = 0
export const newId = (p = 'id') =>
  `${p}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function itemFromFood(
  food: Food,
  qty: number,
  source: ItemSource,
  extra: Partial<MealItem> = {},
): MealItem {
  return {
    id: newId('it'),
    foodId: food.id,
    name: food.name,
    qty,
    unit: food.unit,
    unitLabel: food.unitLabel,
    per: { kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat },
    source,
    addedLater: false,
    ...extra,
  }
}
