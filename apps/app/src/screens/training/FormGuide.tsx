'use client'

import {
  BodyMap,
  GlassCard,
  IconButton,
  type MuscleStates,
  Screen,
  Tag,
  TrackSegmented,
} from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ExerciseMedia, hasAnimation } from '@/components/ExerciseMedia'
import { EX, exTitle } from '@/lib/ex'
import { primaryMusclesOf } from '@/lib/summary'
import { tagsFor } from '@/lib/training'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Exercise guide: the ExerciseDB animation (or the muscle map), what it works and how to do it. */
export function FormGuideScreen() {
  const router = useRouter()
  const id = useSearchParams().get('ex') ?? '0043'
  const ex = EX[id]
  const animated = hasAnimation(id)
  const [mode, setMode] = useState<'demo' | 'muscles'>(animated ? 'demo' : 'muscles')
  const tags = tagsFor(id)
  const states = Object.fromEntries([
    ...(ex?.sm ?? []).map((m) => [m.split(' ')[0], 'recovering']),
    ...primaryMusclesOf(id).map((m) => [m, 'fatigued']),
  ]) as MuscleStates
  const steps = (ex?.st ?? []).filter((s) => !/^repeat for/i.test(s))

  return (
    <Screen
      orbs={[{ tone: 'ember', strength: 0.3, size: 520, right: -260, bottom: -220 }]}
      contentClassName="pb-cta"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <IconButton icon="close" label="Close guide" onClick={() => router.back()} />
        {animated ? (
          <TrackSegmented
            label="Guide view"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'demo', label: 'Demo' },
              { value: 'muscles', label: 'Muscles' },
            ]}
          />
        ) : null}
        <span style={{ width: 44 }} />
      </div>

      <section
        aria-label={mode === 'demo' ? 'Exercise animation' : 'Working muscles'}
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        {mode === 'demo' ? (
          <div style={{ width: 'min(100%, 360px)' }}>
            <ExerciseMedia exId={id} size="100%" radius={32} credit />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 18,
              padding: '18px 0',
              borderRadius: 32,
              background: 'linear-gradient(180deg, #151A17 0%, #0D110F 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <BodyMap side="front" states={states} width={128} />
            <BodyMap side="back" states={states} width={128} />
          </div>
        )}
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 300, letterSpacing: '-0.035em' }}>
          {exTitle(id)}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.primary.map((m) => (
            <Tag key={m} tone="ember">
              {m}
            </Tag>
          ))}
          {tags.secondary
            .filter(
              (m) =>
                !tags.primary.some(
                  (x) => x.slice(0, 4).toLowerCase() === m.slice(0, 4).toLowerCase(),
                ),
            )
            .slice(0, 3)
            .map((m) => (
              <Tag key={m}>{m}</Tag>
            ))}
          {ex?.eq ? <Tag tone="sage">{cap(ex.eq)}</Tag> : null}
        </div>
      </div>

      {steps.length ? (
        <GlassCard
          as="section"
          aria-label="How to"
          radius={26}
          padding="16px 16px 8px"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
          >
            HOW TO
          </span>
          <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
            {steps.map((s, i) => (
              <li
                key={s}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px minmax(0,1fr)',
                  gap: 10,
                  padding: '10px 0',
                  borderTop: i ? '1px solid rgba(255,255,255,0.06)' : undefined,
                }}
              >
                <span
                  className="sy-mono"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    background: 'rgba(255,107,61,0.14)',
                    color: '#FFB79A',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(243,241,236,0.84)' }}>
                  {s}
                </span>
              </li>
            ))}
          </ol>
        </GlassCard>
      ) : null}
    </Screen>
  )
}
