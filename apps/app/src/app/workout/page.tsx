'use client'

import { Suspense } from 'react'
import { WorkoutScreen } from '@/screens/training/Workout'

export default function Page() {
  return (
    <Suspense>
      <WorkoutScreen />
    </Suspense>
  )
}
