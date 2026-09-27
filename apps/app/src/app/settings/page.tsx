'use client'

import { Suspense } from 'react'
import { SettingsScreen } from '@/screens/settings/Settings'

export default function Page() {
  return (
    <Suspense>
      <SettingsScreen />
    </Suspense>
  )
}
