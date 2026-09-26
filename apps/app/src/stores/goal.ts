'use client'

import type { GoalType, Pace } from '@syntropy/nutrition'
import { persisted } from './persist'

export interface Checkin {
  id: string
  date: string
  kcalChange: number
  reason: string
  observedKgPerWeek: number | null
  plannedKgPerWeek: number
  headline: string
  body: string
  tips: string[]
  status: 'pending' | 'accepted' | 'kept'
}

type GoalStore = {
  type: GoalType
  pace: Pace
  /** Sum of accepted weekly check-in changes. */
  adjustKcal: number
  set: boolean
  updatedAt: number
  checkins: Checkin[]
  choose: (type: GoalType, pace: Pace) => void
  addCheckin: (c: Checkin) => void
  resolveCheckin: (id: string, accept: boolean) => void
}

export const useGoal = persisted<GoalStore>('goal', (set, get) => ({
  type: 'cut',
  pace: 'steady',
  adjustKcal: 0,
  set: false,
  updatedAt: 0,
  checkins: [],
  choose: (type, pace) => set({ type, pace, set: true, adjustKcal: 0, updatedAt: Date.now() }),
  addCheckin: (c) =>
    set({ checkins: [c, ...get().checkins.filter((x) => x.date !== c.date)].slice(0, 26) }),
  resolveCheckin: (id, accept) => {
    const c = get().checkins.find((x) => x.id === id)
    if (c?.status !== 'pending') return
    set({
      checkins: get().checkins.map((x) =>
        x.id === id ? { ...x, status: accept ? 'accepted' : 'kept' } : x,
      ),
      adjustKcal: accept
        ? Math.max(-500, Math.min(500, get().adjustKcal + c.kcalChange))
        : get().adjustKcal,
    })
  },
}))
