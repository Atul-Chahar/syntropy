'use client'

import { Suspense } from 'react'
import { HistoryScreen } from '@/screens/training/Summary'

export default function Page() {
  return (
    <Suspense>
      <HistoryScreen />
    </Suspense>
  )
}
