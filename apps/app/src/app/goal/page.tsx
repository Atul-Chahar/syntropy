'use client'

import { Suspense } from 'react'
import { GoalScreen } from '@/screens/nutrition/Goal'

export default function Page() {
  return (
    <Suspense>
      <GoalScreen />
    </Suspense>
  )
}
