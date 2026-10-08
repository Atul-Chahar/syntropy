'use client'

import { Suspense } from 'react'
import { PhotoCaptureScreen } from '@/screens/training/PhotoCapture'

export default function Page() {
  return (
    <Suspense>
      <PhotoCaptureScreen />
    </Suspense>
  )
}
