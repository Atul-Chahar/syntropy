'use client'

import { Suspense } from 'react'
import { EatingScreen } from '@/screens/auth/Eating'

export default function Page() {
  return (
    <Suspense>
      <EatingScreen />
    </Suspense>
  )
}
