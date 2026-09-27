'use client'

import { Suspense } from 'react'
import { LibraryScreen } from '@/screens/training/Library'

export default function Page() {
  return (
    <Suspense>
      <LibraryScreen />
    </Suspense>
  )
}
