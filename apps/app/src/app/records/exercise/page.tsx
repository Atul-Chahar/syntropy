'use client'

import { Suspense } from 'react'
import { ExerciseRecordsScreen } from '@/screens/training/ExerciseRecords'

export default function Page() {
  return (
    <Suspense>
      <ExerciseRecordsScreen />
    </Suspense>
  )
}
