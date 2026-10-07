'use client'

import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect } from 'react'
import { Icon, type IconName } from '../icons/Icon'

/** Mono uppercase kicker (11 px, .06em, 55 % bone). */
export function Kicker({
  children,
  color,
  style,
  as: Tag = 'div',
  id,
}: {
  children: ReactNode
  color?: string
  style?: CSSProperties
  as?: 'div' | 'span' | 'h2' | 'p'
  id?: string
}) {
  return (
    <Tag
      id={id}
      className="sy-mono"
      style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: color ?? 'rgba(243,241,236,0.55)',
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

/** Screen title: Geist 300, 30 px, -0.045em. */
export function Title({
  children,
  size = 30,
  weight = 300,
  style,
}: {
  children: ReactNode
  size?: number
  weight?: number
  style?: CSSProperties
}) {
  return (
    <h1
      style={{
        margin: 0,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: size >= 30 ? '-0.045em' : '-0.035em',
        lineHeight: 1.05,
        ...style,
      }}
    >
      {children}
    </h1>
  )
}

/** Doto glyphs advance about 0.62 em, commas and points included. */
const DOTO_EM = 0.62

/** Font size (px) that fits `text` in Doto into `widthPx`, never above `max`. */
export const fitDotPx = (text: string, max: number, widthPx: number) =>
  Math.min(max, Math.floor(widthPx / (Math.max(1, text.length) * DOTO_EM)))

/**
 * CSS font-size that fits `text` in Doto into `share` of the nearest inline-size container
 * (set `containerType: 'inline-size'` on a parent), never above `max` px.
 */
export const fitDot = (text: string, max: number, share = 1) =>
  `min(${max}px, ${((100 * share) / (Math.max(1, text.length) * DOTO_EM)).toFixed(2)}cqi)`

/** Doto metric that tweens between values. */
export function MetricNumber({
  value,
  size = 30,
  decimals = 0,
  format,
  style,
  color,
  fit,
}: {
  value: number
  size?: number
  decimals?: number
  format?: (v: number) => string
  style?: CSSProperties
  color?: string
  /** Shrink to this share of the nearest inline-size container when the value is long. */
  fit?: number
}) {
  const mv = useMotionValue(value)
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] })
    return () => c.stop()
  }, [value, mv])
  const show = (v: number) =>
    format
      ? format(v)
      : v.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
  const text = useTransform(mv, show)
  const fontSize = fit ? fitDot(show(value), size, fit) : size
  return (
    <motion.span className="sy-dot" style={{ fontSize, lineHeight: 1, color, ...style }}>
      {text}
    </motion.span>
  )
}

/** Thin progress bar (macro bars: 6 px on Home, 5 px on Food). */
export function ProgressBar({
  value,
  color,
  height = 6,
  track = 'rgba(255,255,255,0.07)',
  label,
}: {
  value: number
  color: string
  height?: number
  track?: string
  label?: string
}) {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuenow={label ? Math.round(v * 100) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      style={{ height, borderRadius: height / 2, background: track, overflow: 'hidden' }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${v * 100}%` }}
        transition={{ type: 'spring', stiffness: 70, damping: 20 }}
        style={{ height, borderRadius: height / 2, background: color }}
      />
    </div>
  )
}

/** Labelled macro row: name, "115 / 150 g" in mono, bar. */
export function MacroRow({
  name,
  value,
  target,
  unit = 'g',
  color,
  height = 6,
}: {
  name: string
  value: number
  target: number
  unit?: string
  color: string
  height?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: 13,
        }}
      >
        <span style={{ color: 'rgba(243,241,236,0.8)' }}>{name}</span>
        <span className="sy-mono" style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <ProgressBar
        value={target > 0 ? value / target : 0}
        color={color}
        height={height}
        label={name}
      />
    </div>
  )
}

/** Segmented tile bar (Home tiles): N segments, filled ones with rising opacity. */
export function SegmentBar({
  segments,
  filled,
  color,
  from = 0.45,
  step = 0.07,
}: {
  segments: number
  filled: number
  color: string
  from?: number
  step?: number
}) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: segments }, (_, i) => {
        const on = i < filled
        return (
          <motion.span
            key={i}
            initial={{ scaleY: 0.3, opacity: 0 }}
            animate={{ scaleY: 1, opacity: on ? Math.min(1, from + i * step) : 1 }}
            transition={{ delay: i * 0.03, duration: 0.35 }}
            style={{
              flexGrow: 1,
              height: 14,
              borderRadius: 3,
              background: on ? color : 'rgba(255,255,255,0.09)',
            }}
          />
        )
      })}
    </div>
  )
}

/** Insight callout with the sparkle (peach) or leaf (sage). */
export function Callout({
  children,
  tone = 'peach',
  icon,
  bordered,
  style,
}: {
  children: ReactNode
  tone?: 'peach' | 'sage' | 'water'
  icon?: IconName
  bordered?: boolean
  style?: CSSProperties
}) {
  const t = {
    peach: {
      bg: 'rgba(255,199,176,0.07)',
      bd: 'rgba(255,199,176,0.12)',
      fg: '#FFC7B0',
      ic: 'sparkle' as IconName,
    },
    sage: {
      bg: 'rgba(169,195,160,0.08)',
      bd: 'rgba(169,195,160,0.14)',
      fg: '#A9C3A0',
      ic: 'leaf' as IconName,
    },
    water: {
      bg: 'rgba(156,199,224,0.08)',
      bd: 'rgba(156,199,224,0.14)',
      fg: '#9CC7E0',
      ic: 'drop' as IconName,
    },
  }[tone]
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 16,
        background: t.bg,
        border: bordered ? `1px solid ${t.bd}` : undefined,
        fontSize: 12.5,
        lineHeight: 1.45,
        color: 'rgba(243,241,236,0.78)',
        ...style,
      }}
    >
      <Icon name={icon ?? t.ic} size={14} style={{ color: t.fg, marginTop: 2 }} />
      <span>{children}</span>
    </div>
  )
}

/** Small pill tag (muscle tags, badges). */
export function Tag({
  children,
  tone = 'neutral',
  height = 24,
  style,
}: {
  children: ReactNode
  tone?: 'neutral' | 'ember' | 'peach' | 'sage' | 'water'
  height?: number
  style?: CSSProperties
}) {
  const t = {
    neutral: { bg: 'rgba(255,255,255,0.07)', fg: 'rgba(243,241,236,0.75)' },
    ember: { bg: 'rgba(255,107,61,0.14)', fg: '#FFB79A' },
    peach: { bg: 'rgba(255,199,176,0.14)', fg: '#FFD6C4' },
    sage: { bg: 'rgba(169,195,160,0.14)', fg: '#C9DCBF' },
    water: { bg: 'rgba(156,199,224,0.14)', fg: '#D3E7F3' },
  }[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height,
        padding: `0 ${height >= 24 ? 10 : 8}px`,
        borderRadius: height / 2,
        fontSize: height >= 24 ? 11 : 10.5,
        fontWeight: 500,
        background: t.bg,
        color: t.fg,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Coloured dot used in legends and macro chips. */
export function Dot({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: color,
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  )
}

/** Mini line chart (Stats strength rows). */
export function Sparkline({
  points,
  width = 64,
  height = 26,
  color = '#FFC7B0',
}: {
  points: number[]
  width?: number
  height?: number
  color?: string
}) {
  if (points.length < 2) return <svg width={width} height={height} aria-hidden="true" />
  const lo = Math.min(...points)
  const hi = Math.max(...points)
  const span = hi - lo || 1
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * (width - 4) + 2
      const y = height - 3 - ((p - lo) / span) * (height - 6)
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
