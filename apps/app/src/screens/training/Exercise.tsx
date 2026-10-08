'use client'

import {
  BodyMap,
  Callout,
  GlassCard,
  Icon,
  IconButton,
  PillButton,
  Screen,
  Segmented,
  Tag,
  TileStepper,
} from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ExerciseMedia, hasAnimation } from '@/components/ExerciseMedia'
import { EX } from '@/lib/ex'
import { startRest } from '@/lib/rest'
import { primaryMusclesOf } from '@/lib/summary'
import {
  elapsed,
  exTitle,
  fmtW,
  isBwExercise,
  muscleName,
  prevFor,
  sessionNumber,
  setsProgress,
  tagsFor,
} from '@/lib/training'
import { useNow } from '@/lib/useNow'
import { success } from '@/platform/haptics'
import { useTraining } from '@/stores'

/** Format OpenGym's progression `why` ([template, ...args]). */
export function whyText(why?: unknown[]): string | null {
  if (!Array.isArray(why) || typeof why[0] !== 'string') return null
  return (why[0] as string).replace(/\{(\d+)\}/g, (_m, i) => String(why[Number(i) + 1] ?? ''))
}

export function ExerciseScreen() {
  const router = useRouter()
  const i = Number(useSearchParams().get('i') ?? 0)
  const S = useTraining((s) => s.S)
  const setRow = useTraining((s) => s.setRow)
  const setCurrent = useTraining((s) => s.setCurrent)
  const A = S.active
  const entry = A?.entries[i]
  const now = useNow(1000)
  const activeIdx = entry ? entry.sets.findIndex((s) => !s.done) : -1
  const row = entry && activeIdx >= 0 ? entry.sets[activeIdx] : null
  const [kg, setKg] = useState(row?.w ?? 0)
  const [reps, setReps] = useState(row?.r ?? 8)
  const [rpe, setRpe] = useState('8')

  if (!A || !entry) {
    router.replace('/workout/')
    return null
  }
  const name = exTitle(entry.id)
  const bw = isBwExercise(entry.id)
  const prog = setsProgress(A)
  const prev = prevFor(S, entry.id)
  const best = prev.reduce((b, s) => (s.w > b.w ? s : b), { w: 0, r: 0 } as {
    w: number
    r: number
  })
  const tags = tagsFor(entry.id)
  const muscles = primaryMusclesOf(entry.id)
  const secondary = (EX[entry.id]?.sm ?? []).slice(0, 2)
  const note = whyText((entry.plan as { why?: unknown[] } | undefined)?.why)
  const states = Object.fromEntries([
    ...muscles.map((m) => [m, 'primary']),
    ...secondary.map((m) => [m.split(' ')[0], 'secondary']),
  ])

  const log = () => {
    if (activeIdx < 0) return router.back()
    setRow(i, activeIdx, { w: kg, r: reps, rpe: Number(rpe), done: true })
    success()
    const last = entry.sets.every((s, j) => j === activeIdx || s.done)
    if (last && A.entries[i + 1]) {
      setCurrent(i + 1)
      startRest(`Next: ${exTitle(A.entries[i + 1].id)}`)
    } else if (!last) startRest(`Next: set ${activeIdx + 2} of ${entry.sets.length}`)
    router.back()
  }

  return (
    <Screen
      orbs={[
        { tone: 'ember', strength: 0.36, right: -240, top: -140 },
        { tone: 'sage', strength: 0.3, size: 520, left: -260, bottom: -220 },
      ]}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconButton icon="chevronLeft" label="Back to session" onClick={() => router.back()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.02em' }}>
            {A.name} · Session {sessionNumber(S)}
          </span>
          <span className="sy-mono" style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.55)' }}>
            {elapsed(A, now)} · {prog.done} / {prog.total} SETS
          </span>
        </div>
        <IconButton icon="more" label="Session options" href="/workout/" />
      </header>
      <div
        aria-hidden="true"
        style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          style={{
            width: `${(prog.done / Math.max(1, prog.total)) * 100}%`,
            height: 3,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #FFC7B0, #FF6B3D)',
            transition: 'width 400ms',
          }}
        />
      </div>
      <span
        className="sy-mono"
        style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
      >
        EXERCISE {i + 1} / {A.entries.length}
      </span>

      <GlassCard
        as="section"
        aria-label="Form demo"
        radius={30}
        style={{ height: 212, overflow: 'hidden' }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -80,
            top: -60,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,61,0.18), rgba(255,107,61,0) 70%)',
          }}
        />
        <div style={{ position: 'absolute', left: 14, top: 14 }}>
          {hasAnimation(entry.id) ? (
            <ExerciseMedia exId={entry.id} size={150} radius={22} />
          ) : (
            <div style={{ display: 'flex', gap: 2, padding: '0 4px' }}>
              <BodyMap side="front" states={states} width={74} />
              <BodyMap side="back" states={states} width={74} />
            </div>
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 172,
            top: 20,
            right: 16,
            // Stops above the Full guide button so long muscle lists never run under it.
            bottom: 56,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Tag tone="ember" style={{ alignSelf: 'flex-start' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: '#FF6B3D',
                animation: 'sy-pulse 1.4s ease-in-out infinite',
              }}
            />
            {hasAnimation(entry.id) ? 'Demo' : 'Muscle map'}
          </Tag>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              className="sy-mono"
              style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
            >
              PRIMARY
            </span>
            <span style={{ fontSize: 14.5 }}>
              {muscles.map(muscleName).join(' · ') || EX[entry.id]?.tg}
            </span>
          </div>
          {secondary.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                className="sy-mono"
                style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
              >
                SECONDARY
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: 'rgba(243,241,236,0.8)',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {secondary.join(' · ')}
              </span>
            </div>
          ) : null}
        </div>
        <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 6 }}>
          <PillButton
            height={36}
            fontSize={12}
            icon="play"
            iconSize={13}
            href={`/exercise/guide/?ex=${entry.id}`}
            style={{ padding: '0 12px' }}
          >
            Full guide
          </PillButton>
        </div>
      </GlassCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 300, letterSpacing: '-0.04em' }}>
          {name}
        </h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.primary.map((t) => (
            <Tag key={t} tone="ember">
              {t}
            </Tag>
          ))}
          <Tag style={{ textTransform: 'capitalize' }}>{EX[entry.id]?.eq}</Tag>
          {best.w || best.r ? (
            <Tag>
              Best · {fmtW(best.w, bw)} kg × {best.r}
            </Tag>
          ) : null}
        </div>
      </div>
      {note ? (
        <Callout bordered style={{ padding: '12px 14px' }}>
          {note}
        </Callout>
      ) : null}

      <GlassCard
        as="section"
        aria-label="Log current set"
        radius={30}
        padding={16}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>
            {activeIdx >= 0 ? `Set ${activeIdx + 1} of ${entry.sets.length}` : 'All sets done'}
          </span>
          {prev[activeIdx] ? (
            <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>
              LAST · {fmtW(prev[activeIdx].w, bw)} × {prev[activeIdx].r}
            </span>
          ) : null}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          <TileStepper
            kicker="WEIGHT · KG"
            label="weight"
            value={kg}
            step={2.5}
            min={-40}
            max={400}
            onChange={setKg}
            display={fmtW(kg, bw)}
          />
          <TileStepper
            kicker="REPS"
            label="reps"
            value={reps}
            min={1}
            max={50}
            onChange={setReps}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px minmax(0,1fr)',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
          >
            RPE
          </span>
          <Segmented
            label="RPE"
            height={44}
            fill
            value={rpe}
            onChange={setRpe}
            options={['6', '7', '8', '9', '10'].map((v) => ({ value: v, label: v }))}
          />
        </div>
      </GlassCard>
      <PillButton icon="check" lifted block onClick={log}>
        {activeIdx >= 0 ? `Log set ${activeIdx + 1}` : 'Back to session'}
      </PillButton>
    </Screen>
  )
}
