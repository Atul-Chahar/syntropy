'use client'

import { Suspense } from 'react'
import { MealReviewScreen } from '@/screens/nutrition/MealReview'

export default function Page() {
  return (
    <Suspense>
      <MealReviewScreen />
    </Suspense>
  )
}
