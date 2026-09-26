'use client'

import { today } from '@/lib/dates'
import { persisted } from './persist'

export const DEFAULT_MODELS = {
  vision: 'gemini-3.8-flash',
  chat: 'gemini-3.5-flash-lite',
  text: 'gemini-3.5-flash-lite',
}

type SettingsStore = {
  models: typeof DEFAULT_MODELS
  dailyCap: number
  usage: { date: string; count: number }
  aiConsent: boolean
  hasKey: boolean
  restSec: number
  set: (p: Partial<Omit<SettingsStore, 'set' | 'countUse' | 'remaining'>>) => void
  countUse: () => void
  remaining: () => number
}

export const useSettings = persisted<SettingsStore>('settings', (set, get) => ({
  models: DEFAULT_MODELS,
  dailyCap: 60,
  usage: { date: today(), count: 0 },
  aiConsent: false,
  hasKey: false,
  restSec: 90,
  set: (p) => set(p),
  countUse: () => {
    const u = get().usage
    set({
      usage:
        u.date === today() ? { date: u.date, count: u.count + 1 } : { date: today(), count: 1 },
    })
  },
  remaining: () => {
    const u = get().usage
    return get().dailyCap - (u.date === today() ? u.count : 0)
  },
}))
