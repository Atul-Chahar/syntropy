'use client'

import { Suspense } from 'react'
import { BodyScreen } from '@/screens/auth/Body'

export default function Page() {
  return (
    <Suspense>
      <BodyScreen />
    </Suspense>
  )
}
