'use client'

import { Suspense } from 'react'
import { SummaryScreen } from '@/screens/training/Summary'

export default function Page() {
  return (
    <Suspense>
      <SummaryScreen />
    </Suspense>
  )
}
