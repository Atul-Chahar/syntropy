'use client'

import { Suspense } from 'react'
import { FormGuideScreen } from '@/screens/training/FormGuide'

export default function Page() {
  return (
    <Suspense>
      <FormGuideScreen />
    </Suspense>
  )
}
