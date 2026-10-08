'use client'

import { Suspense } from 'react'
import { TrainingSetupScreen } from '@/screens/auth/Training'

export default function Page() {
  return (
    <Suspense>
      <TrainingSetupScreen />
    </Suspense>
  )
}
