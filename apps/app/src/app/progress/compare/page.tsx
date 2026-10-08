'use client'

import { Suspense } from 'react'
import { PhotoCompareScreen } from '@/screens/training/PhotoCompare'

export default function Page() {
  return (
    <Suspense>
      <PhotoCompareScreen />
    </Suspense>
  )
}
