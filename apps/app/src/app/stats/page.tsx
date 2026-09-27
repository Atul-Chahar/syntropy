'use client'

import { Suspense } from 'react'
import { StatsScreen } from '@/screens/training/Stats'

export default function Page() {
  return (
    <Suspense>
      <StatsScreen />
    </Suspense>
  )
}
