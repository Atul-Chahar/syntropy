'use client'

import { Suspense } from 'react'
import { RoutineScreen } from '@/screens/training/Routine'

export default function Page() {
  return (
    <Suspense>
      <RoutineScreen />
    </Suspense>
  )
}
