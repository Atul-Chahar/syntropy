'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useId } from 'react'

type RingProps = {
  size: number
  stroke: number
  /** 0..1 */
  value: number
  color: string
  /** Optional second colour for a gradient stroke (top to bottom). */
  colorTo?: string
  track?: string
  glow?: boolean
  children?: ReactNode
  label?: string
}

/** Progress ring: a track circle plus an animated dash, starting at 12 o'clock. */
export function Ring({
  size,
  stroke,
  value,
  color,
  colorTo,
  track = 'rgba(255,255,255,0.08)',
  glow,
  children,
  label,
}: RingProps) {
  const id = useId()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const strokeColor = colorTo ? `url(#${id})` : color
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {colorTo ? (
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} />
              <stop offset="1" stopColor={colorTo} />
            </linearGradient>
          </defs>
        ) : null}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
        />
      </svg>
      {children ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
