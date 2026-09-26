'use client'

import { today } from '@/lib/dates'
import { persisted } from './persist'

type WaterStore = {
  days: Record<string, number[]>
  glassMl: number
  reminders: boolean
  add: (ml?: number, date?: string) => void
  removeLast: (date?: string) => void
  setGlass: (ml: number) => void
  setReminders: (on: boolean) => void
  replaceAll: (days: Record<string, number[]>) => void
}

export const useWater = persisted<WaterStore>('water', (set, get) => ({
  days: {},
  glassMl: 250,
  reminders: false,
  add: (ml, date = today()) => {
    const d = get().days
    set({ days: { ...d, [date]: [...(d[date] ?? []), ml ?? get().glassMl] } })
  },
  removeLast: (date = today()) => {
    const d = get().days
    set({ days: { ...d, [date]: (d[date] ?? []).slice(0, -1) } })
  },
  setGlass: (glassMl) => set({ glassMl }),
  setReminders: (reminders) => set({ reminders }),
  replaceAll: (days) => set({ days }),
}))

export const waterOn = (days: Record<string, number[]>, date: string) =>
  (days[date] ?? []).reduce((a, b) => a + b, 0)
