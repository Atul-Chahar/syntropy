'use client'

import { Suspense } from 'react'
import { PlanPreviewScreen } from '@/screens/training/PlanPreview'

export default function Page() {
  return (
    <Suspense>
      <PlanPreviewScreen />
    </Suspense>
  )
}
