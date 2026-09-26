'use client'

import { type Food, type Meal, type MealItem, type MealSlot, newId } from '@syntropy/nutrition'
import { hhmm, today } from '@/lib/dates'
import { persisted } from './persist'

type NutritionStore = {
  meals: Meal[]
  customFoods: Food[]
  recent: string[]
  /** Items waiting on the Meal review screen (not saved yet). */
  draft: {
    title: string
    items: MealItem[]
    slot: MealSlot
    photoId?: string
    ms?: number
    mealId?: string
  } | null
  setDraft: (d: NutritionStore['draft']) => void
  saveMeal: (
    m: Omit<Meal, 'id' | 'createdAt' | 'date' | 'time'> & Partial<Pick<Meal, 'date' | 'time'>>,
  ) => Meal
  /** Adds items to an existing meal (marked "added later") or creates the slot's meal. */
  addItems: (date: string, slot: MealSlot, items: MealItem[], later?: boolean) => string
  updateMeal: (id: string, patch: Partial<Meal>) => void
  setQty: (mealId: string, itemId: string, qty: number) => void
  removeItem: (mealId: string, itemId: string) => void
  removeMeal: (id: string) => void
  addCustomFood: (f: Omit<Food, 'id' | 'step'> & { step?: number }) => Food
  touchRecent: (ids: string[]) => void
  replaceAll: (s: Pick<NutritionStore, 'meals' | 'customFoods' | 'recent'>) => void
}

export const useNutrition = persisted<NutritionStore>('nutrition', (set, get) => ({
  meals: [],
  customFoods: [],
  recent: [],
  draft: null,
  setDraft: (draft) => set({ draft }),
  saveMeal: (m) => {
    const meal: Meal = {
      id: newId('meal'),
      createdAt: Date.now(),
      date: m.date ?? today(),
      time: m.time ?? hhmm(),
      ...m,
    } as Meal
    set({ meals: [...get().meals, meal] })
    get().touchRecent(meal.items.map((i) => i.foodId).filter(Boolean) as string[])
    return meal
  },
  addItems: (date, slot, items, later = false) => {
    const existing = get().meals.find((m) => m.date === date && m.slot === slot)
    const marked = items.map((i) => ({ ...i, addedLater: later || i.addedLater }))
    get().touchRecent(items.map((i) => i.foodId).filter(Boolean) as string[])
    if (existing) {
      // Same food already on the meal: bump its quantity instead of adding a second row.
      const merged = [...existing.items]
      for (const it of marked) {
        const same = merged.find((x) => x.foodId && x.foodId === it.foodId && x.unit === it.unit)
        if (same) {
          same.qty = Math.round((same.qty + it.qty) * 100) / 100
          same.addedLater = same.addedLater || it.addedLater
        } else merged.push(it)
      }
      set({ meals: get().meals.map((m) => (m.id === existing.id ? { ...m, items: merged } : m)) })
      return existing.id
    }
    const meal = get().saveMeal({ slot, date, items: marked })
    return meal.id
  },
  updateMeal: (id, patch) =>
    set({ meals: get().meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
  setQty: (mealId, itemId, qty) =>
    set({
      meals: get().meals.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.map((i) => (i.id === itemId ? { ...i, qty } : i)) }
          : m,
      ),
    }),
  removeItem: (mealId, itemId) =>
    set({
      meals: get()
        .meals.map((m) =>
          m.id === mealId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m,
        )
        .filter((m) => m.items.length > 0),
    }),
  removeMeal: (id) => set({ meals: get().meals.filter((m) => m.id !== id) }),
  addCustomFood: (f) => {
    const food: Food = { step: 1, ...f, id: newId('food') } as Food
    set({ customFoods: [...get().customFoods, food] })
    return food
  },
  touchRecent: (ids) => set({ recent: [...new Set([...ids, ...get().recent])].slice(0, 24) }),
  replaceAll: (s) => set(s),
}))

export const mealsOn = (meals: Meal[], date: string) => meals.filter((m) => m.date === date)
