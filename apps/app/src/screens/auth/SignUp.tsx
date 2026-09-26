'use client'

import { Icon, PillButton, TextField } from '@syntropy/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useProfile } from '@/stores'
import { AuthPage, bottomClass, StepHeader } from './parts'

const WHY = [
  { icon: 'lock' as const, text: 'Everything stays on this phone. No account, no server.' },
  { icon: 'key' as const, text: 'Unlocks with your fingerprint, face or screen lock' },
  { icon: 'check' as const, text: 'Nothing to phish, guess or leak' },
]

export function SignUpScreen() {
  const router = useRouter()
  const profile = useProfile()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [err, setErr] = useState<string | undefined>()

  const next = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (name.trim().length < 2) return setErr('Tell us what to call you')
    profile.set({
      name: name.trim(),
      email: email.trim(),
      createdAt: profile.createdAt || Date.now(),
    })
    router.push('/signup/lock/')
  }

  return (
    <AuthPage>
      <StepHeader step={1} back="/welcome/" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 30 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.05,
              fontWeight: 300,
              letterSpacing: '-0.045em',
            }}
          >
            Create your profile
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'rgba(243,241,236,0.68)' }}>
            No password. Your face or fingerprint becomes the key.
          </p>
        </div>
        <form
          onSubmit={next}
          style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: 0 }}
        >
          <TextField
            label="Name"
            placeholder="Your name"
            autoComplete="name"
            value={name}
            error={err}
            onChange={(e) => {
              setName(e.target.value)
              setErr(undefined)
            }}
          />
          <TextField
            label="Email"
            hint="Optional, stays on the phone"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" hidden />
        </form>
        <section
          aria-label="About the app lock"
          className="sy-glass"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
            borderRadius: 24,
          }}
        >
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
          >
            WHY NO PASSWORD
          </span>
          {WHY.map((w) => (
            <div
              key={w.text}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px minmax(0,1fr)',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(169,195,160,0.1)',
                  color: '#C9DCBF',
                }}
              >
                <Icon name={w.icon} size={17} stroke={1.7} />
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.4, color: 'rgba(243,241,236,0.8)' }}>
                {w.text}
              </span>
            </div>
          ))}
        </section>
      </div>
      <div className={bottomClass} style={{ alignItems: 'center', paddingTop: 24 }}>
        <PillButton icon="key" iconSize={19} lifted block onClick={() => next()}>
          Continue
        </PillButton>
        <span style={{ fontSize: 11.5, color: 'rgba(243,241,236,0.45)', textAlign: 'center' }}>
          Your data never leaves this phone unless you export it.
        </span>
      </div>
    </AuthPage>
  )
}
