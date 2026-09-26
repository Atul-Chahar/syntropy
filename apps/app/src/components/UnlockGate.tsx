'use client'

import type { ReactNode } from 'react'
import { UnlockScreen } from '@/screens/auth/Lock'
import { useProfile, useUi } from '@/stores'

/** When the app lock is on, nothing renders until the user unlocks. */
export function UnlockGate({ children, path }: { children: ReactNode; path: string }) {
  const lock = useProfile((p) => p.lockEnabled && p.onboarded)
  const unlocked = useUi((u) => u.unlocked)
  if (lock && !unlocked && !path.startsWith('/signup')) return <UnlockScreen />
  return <>{children}</>
}
