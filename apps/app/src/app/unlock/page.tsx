'use client'

import { Suspense } from 'react'
import { UnlockScreen } from '@/screens/auth/Lock'

export default function Page() {
  return (
    <Suspense>
      <UnlockScreen />
    </Suspense>
  )
}
