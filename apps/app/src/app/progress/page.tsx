'use client'

import { Suspense } from 'react'
import { ProgressScreen } from '@/screens/training/Progress'

export default function Page() {
  return (
    <Suspense>
      <ProgressScreen />
    </Suspense>
  )
}
