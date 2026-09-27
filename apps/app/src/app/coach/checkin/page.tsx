'use client'

import { Suspense } from 'react'
import { CheckinScreen } from '@/screens/coach/Checkin'

export default function Page() {
  return (
    <Suspense>
      <CheckinScreen />
    </Suspense>
  )
}
