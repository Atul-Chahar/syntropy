'use client'

import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useId, useMemo } from 'react'
import { fitDotPx } from './Bits'

type GaugeProps = {
  /** Net kcal: negative is a deficit (left), positive a surplus (right). */
  net: number
  label: string
}

const CX = 155
const CY = 160
const R1 = 132
const R2 = 104

const tOf = (net: number) => Math.max(0.02, Math.min(0.98, 0.5 + net / 1000))

/** The homeostasis dial from Home.dc.html: 61 ticks, zero at the top, deficit left, surplus right. */
export function Gauge({ net, label }: GaugeProps) {
  const id = useId()
  const t = tOf(net)
  const mv = useMotionValue(t)
  useEffect(() => {
    const c = animate(mv, t, { type: 'spring', stiffness: 70, damping: 18 })
    return () => c.stop()
  }, [t, mv])

  const ticks = useMemo(() => {
    const out = []
    for (let i = 0; i <= 60; i++) {
      const f = i / 60
      const a = Math.PI + f * Math.PI
      const m = i % 5
      const len = m === 0 ? 17 : m === 2 ? 11 : 7
      const lit = t >= 0.5 ? f >= 0.5 && f <= t : f <= 0.5 && f >= t
      out.push({
        i,
        x1: CX + R1 * Math.cos(a),
        y1: CY + R1 * Math.sin(a),
        x2: CX + (R1 - len) * Math.cos(a),
        y2: CY + (R1 - len) * Math.sin(a),
        op: lit ? 0.95 : m === 0 ? 0.34 : 0.16,
        w: m === 0 ? 1.6 : 1.2,
      })
    }
    return out
  }, [t])

  const arc = useTransform(mv, (v) => {
    const av = Math.PI + v * Math.PI
    const ex = CX + R2 * Math.cos(av)
    const ey = CY + R2 * Math.sin(av)
    return `M 155 ${CY - R2} A ${R2} ${R2} 0 0 ${v >= 0.5 ? 1 : 0} ${ex.toFixed(1)} ${ey.toFixed(1)}`
  })
  const mx = useTransform(mv, (v) => CX + R2 * Math.cos(Math.PI + v * Math.PI))
  const my = useTransform(mv, (v) => CY + R2 * Math.sin(Math.PI + v * Math.PI))
  const sign = net > 0 ? '+' : net < 0 ? '−' : ''
  const numSize = fitDotPx(`${sign}${Math.abs(Math.round(net))}`, 54, 148)

  return (
    <div
      style={{
        position: 'relative',
        width: 310,
        maxWidth: '100%',
        aspectRatio: '310 / 176',
        margin: '8px auto 0',
        // On narrow phones the dial scales down; the number scales with it (cqi = 1 % width).
        containerType: 'inline-size',
      }}
    >
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox="0 0 310 176"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#A9C3A0" />
            <stop offset="1" stopColor="#FFC7B0" />
          </linearGradient>
        </defs>
        <path
          d="M 23 160 A 132 132 0 0 1 287 160"
          fill="none"
          stroke="rgba(243,241,236,0.06)"
          strokeWidth="1"
          strokeDasharray="2 5"
        />
        {ticks.map((k) => (
          <line
            key={k.i}
            x1={k.x1.toFixed(1)}
            y1={k.y1.toFixed(1)}
            x2={k.x2.toFixed(1)}
            y2={k.y2.toFixed(1)}
            stroke="#F3F1EC"
            strokeOpacity={k.op}
            strokeWidth={k.w}
            strokeLinecap="round"
            style={{ transition: 'stroke-opacity 400ms var(--sy-ease)' }}
          />
        ))}
        <path
          d="M 51 160 A 104 104 0 0 1 259 160"
          fill="none"
          stroke="rgba(243,241,236,0.12)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <motion.path
          d={arc}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M 149 2 L 161 2 L 155 11 Z" fill="#F3F1EC" />
        <motion.circle cx={mx} cy={my} r="11" fill="rgba(243,241,236,0.14)" />
        <motion.circle cx={mx} cy={my} r="5" fill="#F3F1EC" />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          // Bottom-aligned inside the inner arc; long values shrink so they never touch it.
          top: `${((86 + 54 - numSize) / 176) * 100}%`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <div className="sy-dot" style={{ fontSize: `${numSize / 3.1}cqi`, lineHeight: 1 }}>
          {sign}
          {Math.abs(Math.round(net))}
        </div>
        <div style={{ fontSize: 'max(11px, 4.2cqi)', color: 'rgba(243,241,236,0.62)' }}>
          {label}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 14,
          bottom: -4,
          fontSize: 12,
          color: 'rgba(243,241,236,0.5)',
        }}
      >
        Deficit
      </div>
      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: -4,
          fontSize: 12,
          color: 'rgba(243,241,236,0.5)',
        }}
      >
        Surplus
      </div>
    </div>
  )
}
