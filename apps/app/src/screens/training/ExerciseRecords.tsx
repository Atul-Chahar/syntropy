'use client'

import {
  EmptyState,
  GlassCard,
  IconButton,
  MetricNumber,
  PillButton,
  Screen,
  Segmented,
  Tag,
} from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useId, useMemo, useState } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { fmtNum, RecordRow } from '@/components/RecordBits'
import { addDays, daysBetween, monthShort, parseIso, shortDate, today } from '@/lib/dates'
import { exTitle } from '@/lib/ex'
import {
  exerciseRecords,
  fmtRecord,
  groupMoments,
  predictWeight,
  type RecordKind,
  type SessionPoint,
} from '@/lib/records'
import { useTraining } from '@/stores'

type Range = 'm3' | 'y1' | 'all'

const kicker = {
  fontSize: 10.5,
  letterSpacing: '0.08em',
  color: 'rgba(243,241,236,0.55)',
} as const

/** One lift's records (DESIGN_GAPS #29): strength curve, bests, rep maxes, record history. */
export function ExerciseRecordsScreen() {
  const router = useRouter()
  const id = useSearchParams().get('id') ?? ''
  const S = useTraining((s) => s.S)
  const r = useMemo(() => exerciseRecords(S, id), [S, id])
  const [range, setRange] = useState<Range>('all')
  const name = exTitle(id)

  if (!r) {
    return (
      <Screen>
        <ModalHeader
          left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
          title={name}
        />
        <GlassCard radius={28}>
          <EmptyState
            icon="trophy"
            title="Nothing logged yet"
            body="Do this lift once to set a baseline. Records start from your second session."
          />
        </GlassCard>
      </Screen>
    )
  }

  const head: RecordKind = r.repsOnly ? 'reps' : 'e1rm'
  const best = r.best[head]
  const fresh = r.events.filter((e) => daysBetween(e.d, today()) <= 14)
  const moments = groupMoments(r.events).reverse()
  const since = parseIso(r.first)
  const question = encodeURIComponent(
    `How is my ${name} progressing, and what should I change to set a new record?`,
  )

  return (
    <Screen
      orbs={[
        { tone: 'peach', strength: 0.32, right: -240, top: -150 },
        { tone: 'sage', strength: 0.26, size: 520, left: -280, bottom: -200 },
      ]}
    >
      <ModalHeader
        left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
        title={name}
        sub={`${r.sessions} ${r.sessions === 1 ? 'SESSION' : 'SESSIONS'} · SINCE ${monthShort(r.first).toUpperCase()} ${since.getFullYear()}`}
      />

      <GlassCard
        as="section"
        aria-label={r.repsOnly ? 'Most reps' : 'Estimated one-rep max'}
        radius={30}
        padding="18px 16px 14px"
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="sy-mono" style={kicker}>
            {r.repsOnly ? 'MOST REPS' : 'ESTIMATED 1RM'}
          </span>
          {fresh.length ? (
            <Tag tone="peach">New record · {shortDate(fresh[fresh.length - 1].d)}</Tag>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <MetricNumber
            value={best?.value ?? 0}
            size={60}
            decimals={!r.repsOnly && best && !Number.isInteger(best.value) ? 1 : 0}
            color="#F3F1EC"
          />
          <span style={{ fontSize: 15, color: 'rgba(243,241,236,0.6)' }}>
            {r.repsOnly ? 'reps' : 'kg'}
          </span>
        </div>
        {best ? (
          <span className="sy-mono" style={{ ...kicker, marginTop: -6 }}>
            {best.set && !r.repsOnly ? `FROM ${fmtNum(best.set.w)} × ${best.set.r} · ` : ''}
            {shortDate(best.d).toUpperCase()}
          </span>
        ) : null}
        <Curve points={r.points} metric={head} range={range} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              color: 'rgba(243,241,236,0.55)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: '#FFC7B0',
                boxShadow: '0 0 8px rgba(255,199,176,0.8)',
              }}
            />
            Record session
          </span>
          <Segmented
            label="Range"
            height={30}
            padding={10}
            value={range}
            onChange={setRange}
            options={[
              { value: 'm3', label: '3M' },
              { value: 'y1', label: '1Y' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {(r.repsOnly
          ? [
              ['Most reps', r.best.reps, 'reps'],
              ['Record sessions', { value: moments.length, d: r.last }, 'count'],
            ]
          : [
              ['Heaviest weight', r.best.weight, 'weight'],
              ['Session volume', r.best.volume, 'volume'],
              [
                'Most reps',
                {
                  value: Math.max(0, ...r.points.map((p) => p.reps ?? 0)),
                  d: r.points.reduce((a, p) => ((p.reps ?? 0) > (a.reps ?? 0) ? p : a)).d,
                },
                'reps',
              ],
              ['Record sessions', { value: moments.length, d: r.last }, 'count'],
            ]
        ).map(([label, b, kind]) => {
          const v = (b as { value: number } | undefined)?.value ?? 0
          const set = (b as { set?: { w: number; r: number } } | undefined)?.set
          const d = (b as { d?: string } | undefined)?.d
          const text =
            kind === 'count'
              ? String(v)
              : fmtRecord(kind as RecordKind, v).replace(/ (kg|reps?)$/, '')
          const unit = kind === 'count' ? '' : kind === 'reps' ? 'reps' : 'kg'
          return (
            <GlassCard
              key={label as string}
              radius={22}
              padding="14px 14px 12px"
              style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}
            >
              <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.66)' }}>
                {label as string}
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="sy-dot" style={{ fontSize: 26, lineHeight: 1 }}>
                  {text}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(243,241,236,0.5)' }}>{unit}</span>
              </span>
              <span
                className="sy-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  color: 'rgba(243,241,236,0.48)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {kind === 'count'
                  ? `LAST ${shortDate(r.events[r.events.length - 1]?.d ?? r.last).toUpperCase()}`
                  : `${set && kind === 'weight' ? `× ${set.r} · ` : ''}${d ? shortDate(d).toUpperCase() : '—'}`}
              </span>
            </GlassCard>
          )
        })}
      </div>

      {r.repMax.length ? (
        <GlassCard
          as="section"
          aria-label="Rep maxes"
          radius={28}
          padding="16px 16px 8px"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingBottom: 6,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 500 }}>Rep maxes</span>
            <span className="sy-mono" style={{ ...kicker, fontSize: 10 }}>
              BEST · PREDICTED
            </span>
          </div>
          {r.repMax.map((m) => {
            const pred = r.best.e1rm ? predictWeight(r.best.e1rm.value, m.reps) : null
            // One scale for lifted and predicted, so the marker shows how far a rep max lags its prediction.
            const top = Math.max(r.repMax[0]?.w ?? 0, r.best.e1rm?.value ?? 0) || 1
            return (
              <div
                key={m.reps}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px minmax(0,1fr) 62px 52px',
                  alignItems: 'center',
                  gap: 10,
                  height: 44,
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span className="sy-mono" style={{ fontSize: 12, color: 'rgba(243,241,236,0.7)' }}>
                  {m.reps} RM
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'relative',
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {pred ? (
                    <span
                      style={{
                        position: 'absolute',
                        left: `${Math.min(100, (pred / top) * 100)}%`,
                        top: -4,
                        width: 1.5,
                        height: 14,
                        borderRadius: 1,
                        background: 'rgba(243,241,236,0.35)',
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: 6,
                      borderRadius: 3,
                      width: `${Math.min(100, (m.w / top) * 100)}%`,
                      background: 'linear-gradient(90deg, rgba(255,199,176,0.45), #FFC7B0)',
                    }}
                  />
                </span>
                <span style={{ fontSize: 14, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {fmtNum(m.w)} kg
                </span>
                <span
                  className="sy-mono"
                  style={{ fontSize: 11, textAlign: 'right', color: 'rgba(243,241,236,0.45)' }}
                >
                  {pred ? `≈${fmtNum(pred)}` : '—'}
                </span>
              </div>
            )
          })}
        </GlassCard>
      ) : null}

      <GlassCard as="section" aria-label="Record history" radius={28} padding="14px 16px 2px">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingBottom: 4,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>Record history</span>
          <span className="sy-mono" style={{ ...kicker, fontSize: 10 }}>
            {moments.length} {moments.length === 1 ? 'SESSION' : 'SESSIONS'}
          </span>
        </div>
        {moments.length ? (
          moments
            .slice(0, 12)
            .map((m) => <RecordRow key={m.workoutId} m={m} showName={false} first={false} />)
        ) : (
          <p
            style={{
              margin: 0,
              padding: '10px 0 14px',
              fontSize: 13,
              lineHeight: 1.5,
              color: 'rgba(243,241,236,0.6)',
            }}
          >
            Your first session set the baseline. Beat any of these numbers next time and the record
            lands here.
          </p>
        )}
      </GlassCard>

      <PillButton variant="glass" icon="sparkle" block href={`/coach/chat/?q=${question}`}>
        Ask the coach about this lift
      </PillButton>
    </Screen>
  )
}

/** The session-by-session curve, with record sessions lit and the all-time best as a guide. */
function Curve({
  points,
  metric,
  range,
}: {
  points: SessionPoint[]
  metric: RecordKind
  range: Range
}) {
  const gid = useId().replace(/:/g, '')
  const from = range === 'm3' ? addDays(today(), -91) : range === 'y1' ? addDays(today(), -365) : ''
  const pts = points
    .filter((p) => p.d >= from)
    .map((p) => ({ ...p, y: metric === 'reps' ? p.reps : p.e1rm }))
    .filter((p): p is SessionPoint & { y: number } => p.y != null && p.y > 0)

  const W = 320
  const H = 132
  const top = 12
  const bottom = 22
  if (pts.length < 2) {
    return (
      <div
        style={{
          height: H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.5,
          color: 'rgba(243,241,236,0.5)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 18,
        }}
      >
        {pts.length ? 'One session in this range' : 'No sessions in this range'}
      </div>
    )
  }
  const ys = pts.map((p) => p.y)
  const lo = Math.min(...ys)
  const hi = Math.max(...ys)
  const pad = (hi - lo) * 0.15 || hi * 0.05 || 1
  const y0 = lo - pad
  const y1 = hi + pad
  const t0 = pts[0].t
  const t1 = pts[pts.length - 1].t
  const x = (t: number) => 6 + ((t - t0) / Math.max(1, t1 - t0)) * (W - 12)
  const y = (v: number) => top + (1 - (v - y0) / (y1 - y0)) * (H - top - bottom)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.y).toFixed(1)}`)
  const area = `${line.join(' ')} L${x(t1).toFixed(1)} ${H - bottom} L${x(t0).toFixed(1)} ${H - bottom} Z`
  const bestY = y(hi)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`${pts.length} sessions, from ${fmtNum(pts[0].y)} to ${fmtNum(pts[pts.length - 1].y)}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`a${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC7B0" stopOpacity="0.28" />
          <stop offset="1" stopColor="#FFC7B0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        x2={W}
        y1={bestY}
        y2={bestY}
        stroke="rgba(255,199,176,0.35)"
        strokeDasharray="2 4"
        strokeWidth="1"
      />
      <text
        x={W}
        y={bestY - 5}
        textAnchor="end"
        fontSize="9.5"
        fill="rgba(255,199,176,0.75)"
        style={{ fontFamily: 'var(--sy-font-mono)', letterSpacing: '0.06em' }}
      >
        BEST {fmtNum(hi)}
      </text>
      <path d={area} fill={`url(#a${gid})`} />
      <path
        d={line.join(' ')}
        fill="none"
        stroke="#FFC7B0"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p) =>
        p.record ? (
          <g key={p.workoutId}>
            <circle cx={x(p.t)} cy={y(p.y)} r="7" fill="rgba(255,199,176,0.18)" />
            <circle cx={x(p.t)} cy={y(p.y)} r="3.6" fill="#FFC7B0" />
          </g>
        ) : (
          <circle
            key={p.workoutId}
            cx={x(p.t)}
            cy={y(p.y)}
            r="2.2"
            fill="#0B0F0D"
            stroke="rgba(255,199,176,0.7)"
            strokeWidth="1.2"
          />
        ),
      )}
      {[pts[0], pts[pts.length - 1]].map((p, i) => (
        <text
          key={p.workoutId}
          x={i ? W : 0}
          y={H - 4}
          textAnchor={i ? 'end' : 'start'}
          fontSize="9.5"
          fill="rgba(243,241,236,0.45)"
          style={{ fontFamily: 'var(--sy-font-mono)', letterSpacing: '0.06em' }}
        >
          {shortDate(p.d).toUpperCase()}
        </text>
      ))}
    </svg>
  )
}
