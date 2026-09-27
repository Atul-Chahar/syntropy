'use client'

import { Suspense } from 'react'
import { ScanScreen } from '@/screens/nutrition/Scan'

export default function Page() {
  return (
    <Suspense>
      <ScanScreen />
    </Suspense>
  )
}
