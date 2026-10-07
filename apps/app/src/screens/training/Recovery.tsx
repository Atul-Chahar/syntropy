'use client'

import { BodyMap, BottomSheet, GlassCard, Screen } from '@syntropy/ui'
import { useMemo, useState } from 'react'
import { Header } from '@/components/BottomBar'
import { relDay } from '@/lib/dates'
import { type MuscleRow, muscleRows, readinessOf } from '@/lib/summary'
import { muscleName } from '@/lib/training'
import { useTraining } from '@/stores'

const STATE: Record<MuscleRow['state'], [string, string]> = {
  fatigued: ['Fatigued', '#FF9C78'],
  recovering: ['Recovering', '#FFC7B0'],
  ready: ['Ready', '#C9DCBF'],
  detrained: ['Detrained', 'rgba(243,241,236,0.6)'],
}

export function RecoveryScreen() {
  const S = useTraining((s) => s.S)
  const { states, rows } = useMemo(() => muscleRows(S), [S])
  const readiness = useMemo(() => readinessOf(S), [S])
  const [open, setOpen] = useState<MuscleRow | null>(null)
  const shown = rows.filter((r) => r.sets > 0 || r.state !== 'ready').slice(0, 8)

  const readyText = (r: MuscleRow) =>
    r.state === 'fatigued' || r.state === 'recovering'
      ? `ready in ~${r.hoursToReady} h`
      : r.state === 'detrained'
        ? 'train it again soon'
        : 'fully recovered'

  return (
    <Screen
      tabBar
      orbs={[
        { tone: 'ember', strength: 0.28, right: -240, top: -80 },
        { tone: 'sage', strength: 0.42, left: -240, bottom: -220 },
      ]}
    >
      <Header
        kicker="FATIGUE MAP · 7 DAYS"
        title="Recovery"
        right={
          <div
            className="sy-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 48,
              padding: '0 16px',
              borderRadius: 24,
            }}
          >
            <span className="sy-dot" style={{ fontSize: 26, lineHeight: 1, color: '#C9DCBF' }}>
              {readiness}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.62)' }}>readiness</span>
          </div>
        }
      />
      <GlassCard
        as="section"
        aria-label="Muscle fatigue map"
        padding="16px 14px"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(243,241,236,0.08) 1px, transparent 1.2px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
            gap: 8,
          }}
        >
          {(['front', 'back'] as const).map((side) => (
            <div
              key={side}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <BodyMap side={side} states={states} width={140} />
              <span
                className="sy-mono"
                style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'rgba(243,241,236,0.5)' }}
              >
                {side.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 6px 0',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[
            ['Ready', { background: '#A9C3A0' }],
            ['Recovering', { background: '#FFC7B0' }],
            ['Fatigued', { background: '#FF6B3D', boxShadow: '0 0 8px rgba(255,107,61,0.8)' }],
            ['Detrained', { border: '1px dashed rgba(243,241,236,0.55)' }],
          ].map(([l, st]) => (
            <span
              key={l as string}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                color: 'rgba(243,241,236,0.72)',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  boxSizing: 'border-box',
                  ...(st as object),
                }}
              />
              {l as string}
            </span>
          ))}
        </div>
      </GlassCard>
      <section
        aria-label="Muscle groups"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {shown.map((r) => (
          <GlassCard
            key={r.slug}
            onClick={() => setOpen(r)}
            radius={22}
            padding="0 16px 0 18px"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              alignItems: 'center',
              gap: 10,
              height: 64,
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15, letterSpacing: '-0.01em' }}>{muscleName(r.slug)}</span>
              <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>
                {r.sets ? `${r.sets} sets` : 'indirect work'}
                {r.last ? ` · ${relDay(r.last)}` : ''}
              </span>
            </span>
            <span
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}
            >
              <span style={{ fontSize: 13, color: STATE[r.state][1] }}>{STATE[r.state][0]}</span>
              <span style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>{readyText(r)}</span>
            </span>
          </GlassCard>
        ))}
      </section>
      <BottomSheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? muscleName(open.slug) : ''}
      >
        {open ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <BodyMap
              side={
                [
                  'upper-back',
                  'trapezius',
                  'triceps',
                  'lower-back',
                  'gluteal',
                  'hamstring',
                ].includes(open.slug)
                  ? 'back'
                  : 'front'
              }
              states={{ [open.slug]: open.state }}
              width={90}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: 14,
                color: 'rgba(243,241,236,0.8)',
              }}
            >
              <span>
                State: <span style={{ color: STATE[open.state][1] }}>{STATE[open.state][0]}</span>
              </span>
              <span>Fatigue: {Math.round(open.fatigue * 100)}%</span>
              <span>Sets in the last 7 days: {open.sets}</span>
              <span>Last trained: {open.last ? relDay(open.last) : 'not yet'}</span>
              <span style={{ fontSize: 12.5, color: 'rgba(243,241,236,0.55)', lineHeight: 1.45 }}>
                Fatigue halves about every 36 hours after training (OpenGym&apos;s recovery model).
              </span>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </Screen>
  )
}
