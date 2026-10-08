'use client'

import { Icon } from '@syntropy/ui'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { shortDate } from '@/lib/dates'
import { exTitle } from '@/lib/ex'
import {
  fmtGain,
  fmtRecord,
  HEADLINE,
  KIND_LABEL,
  KIND_SHORT,
  liveRecords,
  type RecordMoment,
} from '@/lib/records'
import { success } from '@/platform/haptics'
import { toast } from '@/stores'
import type { SetRow, TrainingState } from '@/stores/training'

/** Peach medallion with a trophy: the one mark every record wears. */
export function Trophy({ size = 36, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: glow
          ? 'radial-gradient(circle at 35% 25%, #FFE6DA, #FFC7B0 55%, #E3906C)'
          : 'rgba(255,199,176,0.12)',
        border: glow ? 'none' : '1px solid rgba(255,199,176,0.26)',
        color: glow ? '#1A0E08' : '#FFC7B0',
        boxShadow: glow ? '0 14px 40px rgba(255,199,176,0.28)' : undefined,
      }}
    >
      <Icon name="trophy" size={Math.round(size * 0.44)} stroke={glow ? 1.8 : 1.6} />
    </span>
  )
}

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '36px minmax(0,1fr) auto',
  alignItems: 'center',
  gap: 12,
  minHeight: 62,
}

/**
 * One lift's records from one session: the headline record with its gain, and the others it
 * broke alongside as small chips.
 */
export function RecordRow({
  m,
  first,
  showName = true,
}: {
  m: RecordMoment
  first?: boolean
  showName?: boolean
}) {
  const [top, ...rest] = m.events
  const detail = [
    showName ? KIND_SHORT[top.kind] : null,
    top.set && top.kind === 'weight' ? `× ${top.set.r}` : null,
    top.set && top.kind !== 'weight' && top.kind !== 'reps'
      ? `${fmtNum(top.set.w)} × ${top.set.r}`
      : null,
    shortDate(m.d),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <Link
      href={`/records/exercise/?id=${m.exId}`}
      style={{
        ...rowStyle,
        padding: '10px 0',
        borderTop: first ? undefined : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Trophy />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <span
          style={{
            fontSize: 14.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {showName ? exTitle(m.exId) : KIND_LABEL[top.kind]}
        </span>
        <span
          className="sy-mono"
          style={{
            fontSize: 10.5,
            letterSpacing: '0.04em',
            color: 'rgba(243,241,236,0.55)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {detail}
        </span>
        {rest.length ? (
          <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {rest.map((e) => (
              <span
                key={e.kind}
                className="sy-mono"
                style={{
                  padding: '2px 7px',
                  borderRadius: 8,
                  fontSize: 9.5,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: 'rgba(255,199,176,0.1)',
                  color: '#FFD9C8',
                }}
              >
                + {KIND_SHORT[e.kind]}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontSize: 15, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          {fmtRecord(top.kind, top.value)}
        </span>
        {top.prev > 0 ? (
          <span className="sy-mono" style={{ fontSize: 10.5, color: '#C9DCBF' }}>
            {fmtGain(top.kind, top.value, top.prev)}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

export const fmtNum = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

/**
 * Called as a set is ticked off in a running session: if it breaks a record, say so once,
 * quietly (a toast and a light haptic), naming the most tangible record it broke.
 */
export function announceRecords(S: TrainingState, exId: string, sets: SetRow[], index: number) {
  const live = liveRecords(S, exId, sets, index)
  if (!live.length) return false
  const top = [...live].sort((a, b) => HEADLINE.indexOf(a.kind) - HEADLINE.indexOf(b.kind))[0]
  const more = live.length > 1 ? ` · +${live.length - 1}` : ''
  toast(`New record · ${KIND_SHORT[top.kind]} ${fmtRecord(top.kind, top.value)}${more}`, {
    icon: 'trophy',
  })
  success()
  return true
}
