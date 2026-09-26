'use client'

import { Suspense } from 'react'
import { LockEnrolScreen } from '@/screens/auth/Lock'

export default function Page() {
  return (
    <Suspense>
      <LockEnrolScreen />
    </Suspense>
  )
}
