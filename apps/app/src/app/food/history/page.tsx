'use client'

import { Suspense } from 'react'
import { FoodHistoryScreen } from '@/screens/nutrition/FoodHistory'

export default function Page() {
  return (
    <Suspense>
      <FoodHistoryScreen />
    </Suspense>
  )
}
