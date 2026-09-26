'use client'

import { DEFAULT_ORBS, Grain, Icon, IconButton, Orb, type OrbSpec } from '@syntropy/ui'
import type { ReactNode } from 'react'
import styles from './auth.module.css'

export const AUTH_ORBS: OrbSpec[] = [
  { tone: 'sage', strength: 0.46, left: -240, bottom: -160 },
  { tone: 'ember', strength: 0.42, size: 540, right: -240, bottom: -200 },
]

/** Full-height auth page with the boards' two bottom orbs. */
export function AuthPage({
  children,
  orbs = AUTH_ORBS,
}: {
  children: ReactNode
  orbs?: OrbSpec[]
}) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        overflow: 'hidden',
        background: 'var(--sy-void)',
      }}
    >
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        {(orbs ?? DEFAULT_ORBS).map((o, i) => (
          <Orb key={i} {...o} />
        ))}
        <Grain />
      </div>
      <div className={styles.page}>{children}</div>
    </div>
  )
}

/** "STEP 1 OF 3" with three segments. */
export function StepHeader({ step, back }: { step: number; back?: string }) {
  return (
    <div className={styles.top}>
      {back ? <IconButton icon="chevronLeft" label="Back" href={back} /> : <span />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          className="sy-mono"
          style={{ fontSize: 11, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
        >
          STEP {step} OF 3
        </span>
        <span style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: 22,
                height: 4,
                borderRadius: 2,
                background: i <= step ? '#F3F1EC' : 'rgba(255,255,255,0.14)',
                transition: 'background 400ms',
              }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

export type OrbState = 'idle' | 'verify' | 'done'

/** The Passkey/SignIn orb: expanding rings, spinner, fingerprint scan, sage check. */
export function LockOrb({ state }: { state: OrbState }) {
  const done = state === 'done'
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div aria-hidden="true" style={{ position: 'relative', width: 220, height: 220 }}>
        <span className={styles.ring} />
        <span className={styles.ring} style={{ animationDelay: '1s' }} />
        <span className={styles.ring} style={{ animationDelay: '2s' }} />
        <div
          style={{
            position: 'absolute',
            left: 20,
            top: 20,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${done ? 'rgba(169,195,160,0.45)' : 'rgba(255,107,61,0.35)'}, rgba(0,0,0,0) 70%)`,
            transition: 'background 600ms',
          }}
        />
        {state === 'verify' ? (
          <svg
            className={styles.spin}
            width="176"
            height="176"
            viewBox="0 0 176 176"
            style={{ position: 'absolute', left: 22, top: 22 }}
          >
            <defs>
              <linearGradient id="pk-sp" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFC7B0" />
                <stop offset="1" stopColor="#FF6B3D" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="88"
              cy="88"
              r="84"
              fill="none"
              stroke="url(#pk-sp)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="300 600"
            />
          </svg>
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: 50,
            top: 50,
            width: 120,
            height: 120,
            borderRadius: 60,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: done
              ? 'radial-gradient(circle at 35% 25%, #DDEBD4, #A9C3A0 60%, #6F8F63)'
              : 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.18), rgba(30,36,33,0.7) 65%)',
            color: done ? '#0B0F0D' : '#F3F1EC',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 30px 60px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(20px)',
            transition: 'background 500ms',
          }}
        >
          {state === 'idle' ? <Icon name="key" size={44} stroke={1.4} /> : null}
          {state === 'verify' ? (
            <span style={{ position: 'relative', display: 'flex' }}>
              <Icon name="fingerprint" size={46} stroke={1.4} />
              <span
                className={styles.scanline}
                style={{
                  position: 'absolute',
                  left: -10,
                  right: -10,
                  top: 22,
                  height: 2,
                  borderRadius: 1,
                  background: '#FFC7B0',
                  boxShadow: '0 0 12px 3px rgba(255,160,120,0.6)',
                }}
              />
            </span>
          ) : null}
          {done ? (
            <span className={styles.pop} style={{ display: 'flex' }}>
              <Icon name="check" size={50} stroke={2} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function WaitingPill({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="sy-glass"
      style={{
        height: 58,
        borderRadius: 29,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 15,
        color: 'rgba(243,241,236,0.8)',
        padding: '0 16px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: '#FFC7B0',
          animation: 'sy-pulse 1s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      {text}
    </div>
  )
}

export const popClass = styles.pop
export const floatClass = styles.float
export const bottomClass = styles.bottom
