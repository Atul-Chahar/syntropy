'use client'

import { Suspense } from 'react'
import { CoachScreen } from '@/screens/coach/Coach'

export default function Page() {
  return (
    <Suspense>
      <CoachScreen />
    </Suspense>
  )
}
