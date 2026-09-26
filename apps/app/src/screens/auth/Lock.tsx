'use client'

import { PillButton } from '@syntropy/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { unlock } from '@/platform/biometric'
import { success } from '@/platform/haptics'
import { useProfile, useUi } from '@/stores'
import {
  AuthPage,
  bottomClass,
  LockOrb,
  type OrbState,
  popClass,
  StepHeader,
  WaitingPill,
} from './parts'

const COPY: Record<OrbState, [string, string]> = {
  idle: [
    'Lock it with your fingerprint',
    'Your phone will ask for Face ID, fingerprint or screen lock. That opens Syntropy from now on.',
  ],
  verify: ['Confirm it is you', 'Follow the prompt from your device.'],
  done: ['App lock is on', 'You are in. Next, a few details so the numbers fit your body.'],
}

/** Passkey.dc.html, as biometric app-lock enrolment (no server, no account). */
export function LockEnrolScreen() {
  const router = useRouter()
  const profile = useProfile()
  const [s, setS] = useState<OrbState>('idle')
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setError(null)
    setS('verify')
    const r = await unlock('Turn on the Syntropy app lock')
    if (r.ok) {
      profile.set({ lockEnabled: true })
      useUi.getState().set({ unlocked: true })
      success()
      setS('done')
    } else {
      setS('idle')
      setError(
        r.reason === 'unavailable'
          ? 'This phone has no screen lock set up. You can turn the app lock on later in Settings.'
          : 'Cancelled. You can try again or skip for now.',
      )
    }
  }

  return (
    <AuthPage>
      <StepHeader step={2} back="/signup/" />
      <div style={{ marginTop: 40 }}>
        <LockOrb state={s} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
          marginTop: 38,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            lineHeight: 1.05,
            fontWeight: 300,
            letterSpacing: '-0.045em',
          }}
        >
          {COPY[s][0]}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.5,
            color: 'rgba(243,241,236,0.68)',
            maxWidth: 300,
          }}
        >
          {error ?? COPY[s][1]}
        </p>
      </div>
      {s === 'done' ? (
        <section
          aria-label="Lock details"
          className={`sy-glass ${popClass}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '6px 16px',
            borderRadius: 24,
            marginTop: 26,
          }}
        >
          {[
            ['Profile', profile.name || 'You'],
            ['Saved in', "This phone's secure hardware"],
            ['Password', 'None needed'],
          ].map(([k, v], i) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: 48,
                fontSize: 13.5,
                borderTop: i ? '1px solid rgba(255,255,255,0.07)' : undefined,
              }}
            >
              <span style={{ color: 'rgba(243,241,236,0.62)' }}>{k}</span>
              <span style={{ color: i === 2 ? '#C9DCBF' : undefined }}>{v}</span>
            </div>
          ))}
        </section>
      ) : null}
      <div className={bottomClass} style={{ paddingTop: 24 }}>
        {s === 'idle' ? (
          <>
            <PillButton icon="fingerprint" iconSize={19} lifted block onClick={start}>
              Turn on app lock
            </PillButton>
            <PillButton
              variant="ghost"
              height={44}
              onClick={() => router.push('/onboarding/body/')}
            >
              Skip for now
            </PillButton>
          </>
        ) : null}
        {s === 'verify' ? (
          <WaitingPill text="Waiting for Face ID, fingerprint or screen lock" />
        ) : null}
        {s === 'done' ? (
          <PillButton
            icon="chevronRight"
            iconAfter
            lifted
            block
            onClick={() => router.push('/onboarding/body/')}
          >
            About your body
          </PillButton>
        ) : null}
        <span style={{ textAlign: 'center', fontSize: 12, color: 'rgba(243,241,236,0.5)' }}>
          Your biometric data never leaves your device.
        </span>
      </div>
    </AuthPage>
  )
}

const UNLOCK_COPY: Record<OrbState, [string, string]> = {
  idle: ['Welcome back', 'Use the lock saved on this phone. No password, no codes.'],
  verify: ['Confirming it is you', 'Look at your phone or touch the sensor.'],
  done: ['Unlocked', 'Your data is ready.'],
}

/** SignIn.dc.html, as the app unlock screen shown on launch and after the app is paused. */
export function UnlockScreen({ onDone }: { onDone?: () => void }) {
  const name = useProfile((p) => p.name)
  const [s, setS] = useState<OrbState>('idle')
  const [msg, setMsg] = useState<string | null>(null)
  const first = name.trim().split(/\s+/)[0]

  const start = async () => {
    setMsg(null)
    setS('verify')
    const r = await unlock('Unlock Syntropy')
    if (r.ok) {
      success()
      setS('done')
      setTimeout(() => {
        useUi.getState().set({ unlocked: true })
        onDone?.()
      }, 650)
    } else {
      setS('idle')
      setMsg(
        r.reason === 'unavailable'
          ? 'Screen lock is not available. Turn it on in Android settings.'
          : 'Not unlocked. Try again when you are ready.',
      )
    }
  }

  const copy = UNLOCK_COPY[s]
  return (
    <AuthPage>
      <div style={{ marginTop: 90 }}>
        <LockOrb state={s} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
          marginTop: 38,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 36,
            lineHeight: 1.05,
            fontWeight: 300,
            letterSpacing: '-0.045em',
          }}
        >
          {s === 'done' && first ? `Good to see you, ${first}` : copy[0]}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.5,
            color: 'rgba(243,241,236,0.68)',
            maxWidth: 300,
          }}
        >
          {msg ?? copy[1]}
        </p>
      </div>
      <div className={bottomClass} style={{ paddingTop: 24 }}>
        {s === 'idle' ? (
          <PillButton icon="key" iconSize={19} lifted block onClick={start}>
            Unlock
          </PillButton>
        ) : s === 'verify' ? (
          <WaitingPill text="Waiting for Face ID, fingerprint or screen lock" />
        ) : (
          <PillButton
            icon="chevronRight"
            iconAfter
            lifted
            block
            onClick={() => useUi.getState().set({ unlocked: true })}
          >
            Continue
          </PillButton>
        )}
        <span style={{ textAlign: 'center', fontSize: 12, color: 'rgba(243,241,236,0.5)' }}>
          Private by design. Your logs stay on your device.
        </span>
      </div>
    </AuthPage>
  )
}
