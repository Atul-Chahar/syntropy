'use client'

import { Suspense } from 'react'
import { WelcomeScreen } from '@/screens/auth/Welcome'

export default function Page() {
  return (
    <Suspense>
      <WelcomeScreen />
    </Suspense>
  )
}
