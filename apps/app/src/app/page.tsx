'use client'

import { Suspense } from 'react'
import { HomeScreen } from '@/screens/home/Home'

export default function Page() {
  return (
    <Suspense>
      <HomeScreen />
    </Suspense>
  )
}
