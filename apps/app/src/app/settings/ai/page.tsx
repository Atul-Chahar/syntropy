'use client'

import { Suspense } from 'react'
import { AiSettingsScreen } from '@/screens/settings/AiSettings'

export default function Page() {
  return (
    <Suspense>
      <AiSettingsScreen />
    </Suspense>
  )
}
