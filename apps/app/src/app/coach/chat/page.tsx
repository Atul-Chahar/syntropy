'use client'

import { Suspense } from 'react'
import { ChatScreen } from '@/screens/coach/Chat'

export default function Page() {
  return (
    <Suspense>
      <ChatScreen />
    </Suspense>
  )
}
