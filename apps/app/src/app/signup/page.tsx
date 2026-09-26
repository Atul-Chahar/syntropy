'use client'

import { Suspense } from 'react'
import { SignUpScreen } from '@/screens/auth/SignUp'

export default function Page() {
  return (
    <Suspense>
      <SignUpScreen />
    </Suspense>
  )
}
