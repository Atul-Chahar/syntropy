'use client'

import { Suspense } from 'react'
import { RecoveryScreen } from '@/screens/training/Recovery'

export default function Page() {
  return (
    <Suspense>
      <RecoveryScreen />
    </Suspense>
  )
}
