'use client'

import { App } from '@capacitor/app'
import { effectiveRoutines } from '@syntropy/core/history'
import { FOOD_BY_ID, itemFromFood, slotForHour } from '@syntropy/nutrition'
import { useEffect } from 'react'
import { isNative } from '@/platform/native'
import { pushWidgetSnapshot, takePendingFoods, takePendingWater } from '@/platform/widgets'
import { toast, useNutrition, useTraining, useUi, useWater } from '@/stores'
import { addDays, today } from './dates'
import { useToday } from './summary'

/** Keeps the home-screen widgets in step with the app and collects widget water taps. */
export function useWidgetSync() {
  const t = useToday()
  const S = useTraining((s) => s.S)

  useEffect(() => {
    if (!isNative()) return
    let next = ''
    for (let i = 0; i < 7 && !next; i++) {
      const r = effectiveRoutines(S, addDays(today(), i)) as { name: string }[]
      if (r.length)
        next = `${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : addDays(today(), i)} · ${r[0].name}`
    }
    void pushWidgetSnapshot({
      kcalLeft: Math.round(t.dt.kcal - t.eaten.kcal),
      kcalTarget: t.dt.kcal,
      kcalEaten: Math.round(t.eaten.kcal),
      proteinG: Math.round(t.eaten.protein),
      proteinTarget: t.dt.protein,
      waterMl: t.water,
      waterTarget: t.dt.waterMl,
      nextSession: next,
      updatedAt: Date.now(),
    })
  }, [t, S])

  const hydrated = useUi((u) => u.hydrated)
  useEffect(() => {
    // Only after the stores have loaded, or the loaded data would overwrite the widget taps.
    if (!isNative() || !hydrated) return
    const collect = async () => {
      const ml = await takePendingWater()
      if (ml > 0) {
        for (let left = ml; left > 0; left -= 250) useWater.getState().add(Math.min(250, left))
        toast(`${ml} ml added from the widget`, { icon: 'drop' })
      }
      const foods = (await takePendingFoods()).filter((id) => FOOD_BY_ID[id])
      if (foods.length) {
        const slot = slotForHour(new Date().getHours())
        const n = useNutrition.getState()
        const hadMeal = n.meals.some((m) => m.date === today() && m.slot === slot)
        n.addItems(
          today(),
          slot,
          foods.map((id) => itemFromFood(FOOD_BY_ID[id], 1, 'manual')),
          hadMeal,
        )
        toast(`${foods.length} ${foods.length === 1 ? 'item' : 'items'} added from the widget`)
      }
    }
    void collect()
    const sub = App.addListener('resume', collect)
    return () => {
      void sub.then((s) => s.remove())
    }
  }, [hydrated])
}
