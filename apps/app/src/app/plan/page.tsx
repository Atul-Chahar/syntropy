'use client'

import { Suspense } from 'react'
import { PlanScreen } from '@/screens/training/Plan'

export default function Page() {
  return (
    <Suspense>
      <PlanScreen />
    </Suspense>
  )
}
