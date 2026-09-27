'use client'

import { Suspense } from 'react'
import { ExerciseScreen } from '@/screens/training/Exercise'

export default function Page() {
  return (
    <Suspense>
      <ExerciseScreen />
    </Suspense>
  )
}
