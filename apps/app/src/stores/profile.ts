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
  // Eating (onboarding): drives food suggestions and the coach.
  diet: Diet | null
  mealsPerDay: number
  avoidFoods: string[]
  // Training setup (onboarding): drives the plan generator and training energy.
  trainingGoal: TrainingGoal
  experience: Experience
  preferredDays: number[]
  sessionMin: number
  gymType: string | null
  equipment: string[]
  focus: string[]
  injuries: string[]
  cardio: Cardio
  trainingDone: boolean
}

export type Diet = 'veg' | 'egg' | 'nonveg' | 'vegan' | 'jain'
export type TrainingGoal = 'muscle' | 'strength' | 'fatloss' | 'general'
export type Experience = 'new' | 'some' | 'experienced'
export type Cardio = 'none' | 'finishers' | 'separate'

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
  diet: null,
  mealsPerDay: 3,
  avoidFoods: [],
  trainingGoal: 'muscle',
  experience: 'some',
  preferredDays: [],
  sessionMin: 60,
  gymType: null,
  equipment: [],
  focus: [],
  injuries: [],
  cardio: 'none',
  trainingDone: false,
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
