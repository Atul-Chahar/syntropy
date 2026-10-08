'use client'

import { Suspense } from 'react'
import { RecordsScreen } from '@/screens/training/Records'

export default function Page() {
  return (
    <Suspense>
      <RecordsScreen />
    </Suspense>
  )
}
