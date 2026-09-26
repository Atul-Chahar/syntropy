'use client'

import { motion } from 'motion/react'
import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import { Icon, type IconName } from '../icons/Icon'
import { UiLink } from '../link'

/** Labelled input: 54 px, radius 18 (SignUp.dc.html). */
export function TextField({
  label,
  hint,
  error,
  suffix,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
  suffix?: string
}) {
  const id = useId()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label
        htmlFor={id}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: 'rgba(243,241,236,0.72)',
        }}
      >
        <span>{label}</span>
        {hint ? <span style={{ color: 'rgba(243,241,236,0.45)' }}>{hint}</span> : null}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          {...input}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 18,
            padding: suffix ? '0 56px 0 18px' : '0 18px',
            fontSize: 16,
            font: 'inherit',
            color: '#F3F1EC',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'rgba(255,156,120,0.6)' : 'rgba(255,255,255,0.12)'}`,
            outline: 'none',
            ...input.style,
          }}
        />
        {suffix ? (
          <span
            className="sy-mono"
            style={{
              position: 'absolute',
              right: 18,
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              color: 'rgba(243,241,236,0.5)',
            }}
          >
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={`${id}-err`} style={{ fontSize: 12.5, color: '#FF9C78' }}>
          {error}
        </span>
      ) : null}
    </div>
  )
}

/** Toggle switch (new primitive): a pill track with a spring thumb. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        padding: 3,
        border: `1px solid ${checked ? 'rgba(169,195,160,0.5)' : 'rgba(255,255,255,0.12)'}`,
        background: checked ? 'rgba(169,195,160,0.35)' : 'rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 250ms var(--sy-ease)',
      }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          background: checked ? '#F3F1EC' : 'rgba(243,241,236,0.7)',
          display: 'block',
        }}
      />
    </button>
  )
}

/** Glass list row: icon tile, title and subtitle, trailing content or chevron. */
export function ListRow({
  title,
  subtitle,
  icon,
  iconTone = 'neutral',
  trailing,
  href,
  onClick,
  style,
}: {
  title: ReactNode
  subtitle?: ReactNode
  icon?: IconName
  iconTone?: 'neutral' | 'sage' | 'peach' | 'ember' | 'water'
  trailing?: ReactNode
  href?: string
  onClick?: () => void
  style?: CSSProperties
}) {
  const tone = {
    neutral: ['rgba(255,255,255,0.06)', 'rgba(243,241,236,0.8)'],
    sage: ['rgba(169,195,160,0.12)', '#C9DCBF'],
    peach: ['rgba(255,199,176,0.12)', '#FFC7B0'],
    ember: ['rgba(255,107,61,0.14)', '#FFB79A'],
    water: ['rgba(156,199,224,0.12)', '#D3E7F3'],
  }[iconTone]
  const body = (
    <>
      {icon ? (
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: tone[0],
            color: tone[1],
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={18} />
        </span>
      ) : null}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>{title}</span>
        {subtitle ? (
          <span style={{ fontSize: 12.5, color: 'rgba(243,241,236,0.55)' }}>{subtitle}</span>
        ) : null}
      </span>
      {trailing ??
        (href || onClick ? (
          <Icon name="chevronRight" size={18} style={{ color: 'rgba(243,241,236,0.45)' }} />
        ) : null)}
    </>
  )
  const st: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    padding: '10px 16px 10px 12px',
    borderRadius: 22,
    color: '#F3F1EC',
    textDecoration: 'none',
    textAlign: 'left',
    width: '100%',
    font: 'inherit',
    background: 'rgba(255,255,255,0.045)',
    border: '1px solid rgba(255,255,255,0.085)',
    backdropFilter: 'blur(22px) saturate(140%)',
    WebkitBackdropFilter: 'blur(22px) saturate(140%)',
    ...style,
  }
  if (href)
    return (
      <UiLink href={href} style={st}>
        {body}
      </UiLink>
    )
  if (onClick)
    return (
      <button type="button" onClick={onClick} style={{ ...st, cursor: 'pointer' }}>
        {body}
      </button>
    )
  return <div style={st}>{body}</div>
}

/** First-run and empty states. */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        padding: '28px 20px',
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,199,176,0.08)',
          color: '#FFC7B0',
          border: '1px solid rgba(255,199,176,0.16)',
        }}
      >
        <Icon name={icon} size={24} />
      </span>
      <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.02em' }}>{title}</div>
      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'rgba(243,241,236,0.6)',
          maxWidth: 280,
        }}
      >
        {body}
      </p>
      {action}
    </div>
  )
}

/** Shimmering placeholder block. */
export function Skeleton({
  height = 16,
  width = '100%',
  radius = 8,
}: {
  height?: number
  width?: number | string
  radius?: number
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        height,
        width,
        borderRadius: radius,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.11) 50%, rgba(255,255,255,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'sy-shimmer 1.4s linear infinite',
      }}
    />
  )
}
