'use client'

import { Icon } from '@syntropy/ui'
import type { ReactNode } from 'react'

/** The h1 + lede every onboarding step opens with (Body.tsx's values). */
export function StepIntro({ title, lede }: { title: ReactNode; lede?: ReactNode }) {
  return (
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
        {title}
      </h1>
      {lede ? (
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'rgba(243,241,236,0.68)' }}>
          {lede}
        </p>
      ) : null}
    </div>
  )
}

/** Small mono section label. */
export function Kick({ children }: { children: ReactNode }) {
  return (
    <span
      className="sy-mono"
      style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
    >
      {children}
    </span>
  )
}

/** A radio card: title, optional sub line and leading icon, peach border when on. */
export function OptionCard({
  on,
  title,
  sub,
  icon,
  onClick,
  minHeight = 72,
  role = 'radio',
}: {
  on: boolean
  title: ReactNode
  sub?: ReactNode
  icon?: Parameters<typeof Icon>[0]['name']
  onClick: () => void
  minHeight?: number
  role?: 'radio' | 'checkbox'
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={on}
      onClick={onClick}
      style={{
        minHeight,
        borderRadius: 22,
        padding: '12px 14px',
        textAlign: 'left',
        font: 'inherit',
        cursor: 'pointer',
        color: '#F3F1EC',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: on ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${on ? 'rgba(255,199,176,0.55)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'background 250ms, border-color 250ms',
      }}
    >
      {icon ? (
        <span
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: on ? 'rgba(255,107,61,0.18)' : 'rgba(255,255,255,0.06)',
            color: on ? '#FFB79A' : 'rgba(243,241,236,0.7)',
          }}
        >
          <Icon name={icon} size={18} />
        </span>
      ) : null}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500 }}>{title}</span>
        {sub ? (
          <span style={{ fontSize: 11.5, opacity: 0.62, lineHeight: 1.35 }}>{sub}</span>
        ) : null}
      </span>
    </button>
  )
}

/** A pill toggle for multi-select lists (44 px tall). */
export function ChipToggle({
  on,
  children,
  onClick,
}: {
  on: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      style={{
        minHeight: 44,
        padding: '0 16px',
        borderRadius: 22,
        font: 'inherit',
        fontSize: 13.5,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: on ? '#0B0F0D' : '#F3F1EC',
        background: on ? '#F3F1EC' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${on ? '#F3F1EC' : 'rgba(255,255,255,0.1)'}`,
        transition: 'background 200ms, color 200ms',
      }}
    >
      {on ? <Icon name="check" size={14} stroke={2} /> : null}
      {children}
    </button>
  )
}

export const toggle = <T,>(list: T[], v: T, max = Number.POSITIVE_INFINITY): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]
