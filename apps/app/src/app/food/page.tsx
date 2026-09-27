'use client'

import { Suspense } from 'react'
import { FoodLogScreen } from '@/screens/nutrition/FoodLog'

export default function Page() {
  return (
    <Suspense>
      <FoodLogScreen />
    </Suspense>
  )
}
