'use client'

import type { Activity, Sex } from '@syntropy/nutrition'
import { persisted } from './persist'

export interface Profile {
  name: string
  email: string
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: Activity
  bodyFatPct: number | null
  trainingDaysPerWeek: number
  onboarded: boolean
  bodyDone: boolean
  lockEnabled: boolean
  /** Photo-file id of the profile picture (changes on every update), or null. */
  avatarId: string | null
  createdAt: number
}

type ProfileStore = Profile & {
  set: (p: Partial<Profile>) => void
  reset: () => void
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  email: '',
  sex: 'male',
  age: 28,
  heightCm: 172,
  weightKg: 72,
  activity: 'light',
  bodyFatPct: null,
  trainingDaysPerWeek: 4,
  onboarded: false,
  bodyDone: false,
  lockEnabled: false,
  avatarId: null,
  createdAt: 0,
}

export const useProfile = persisted<ProfileStore>('profile', (set) => ({
  ...DEFAULT_PROFILE,
  set: (p) => set(p),
  reset: () => set({ ...DEFAULT_PROFILE }),
}))

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'SY'

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there'
