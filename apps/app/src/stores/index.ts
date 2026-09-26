'use client'

import { useCoach } from './coach'
import { useGoal } from './goal'
import { useNutrition } from './nutrition'
import { hydrateAll } from './persist'
import { firstName, initials, useProfile } from './profile'
import { useSettings } from './settings'
import { useTraining } from './training'
import { useWater } from './water'

export const PERSISTED = [
  useProfile,
  useGoal,
  useNutrition,
  useWater,
  useTraining,
  useCoach,
  useSettings,
]

export const hydrateStores = () => hydrateAll(PERSISTED)

export { toast, useUi } from './ui'
export {
  firstName,
  initials,
  useCoach,
  useGoal,
  useNutrition,
  useProfile,
  useSettings,
  useTraining,
  useWater,
}
