'use client'

import { Suspense } from 'react'
import { QuickAddScreen } from '@/screens/nutrition/QuickAdd'

export default function Page() {
  return (
    <Suspense>
      <QuickAddScreen />
    </Suspense>
  )
}
