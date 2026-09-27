'use client'

import { BottomSheet, GlassCard, Icon, IconButton, PillButton, Screen, Tag } from '@syntropy/ui'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { addRest, skipRest, startRest } from '@/lib/rest'
import {
  elapsed,
  exTitle,
  fmtW,
  isBwExercise,
  prevFor,
  sessionNumber,
  setsProgress,
  tagsFor,
} from '@/lib/training'
import { useNow } from '@/lib/useNow'
import { success, tap } from '@/platform/haptics'
import { useTraining, useUi } from '@/stores'
import type { SetRow } from '@/stores/training'

function RestRing({ left, total }: { left: number; total: number }) {
  const r = 58
  const c = 2 * Math.PI * r
  const frac = total ? Math.max(0, Math.min(1, left / total)) : 0
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2
    return {
      i,
      x1: 68 + 66 * Math.cos(a),
      y1: 68 + 66 * Math.sin(a),
      x2: 68 + 62 * Math.cos(a),
      y2: 68 + 62 * Math.sin(a),
    }
  })
  return (
    <svg width="136" height="136" viewBox="0 0 136 136" aria-hidden="true">
      <defs>
        <linearGradient id="rest-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC2A3" />
          <stop offset="1" stopColor="#FF6B3D" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <line
          key={t.i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="#F3F1EC"
          strokeOpacity={t.i % 5 === 0 ? 0.3 : 0.12}
          strokeWidth="1"
        />
      ))}
      <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
      <motion.circle
        cx="68"
        cy="68"
        r={r}
        fill="none"
        stroke="url(#rest-g)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: c * (1 - frac) }}
        transition={{ duration: 0.9, ease: 'linear' }}
        transform="rotate(-90 68 68)"
      />
    </svg>
  )
}

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function WorkoutScreen() {
  const router = useRouter()
  const S = useTraining((s) => s.S)
  const A = S.active
  const setRow = useTraining((s) => s.setRow)
  const addSet = useTraining((s) => s.addSet)
  const setCurrent = useTraining((s) => s.setCurrent)
  const finish = useTraining((s) => s.finish)
  const discard = useTraining((s) => s.discard)
  const rest = useUi((u) => u.rest)
  const now = useNow(500)
  const [draft, setDraft] = useState<{ w?: string; r?: string; rpe?: string }>({})
  const [listOpen, setListOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)

  const restLeft = rest ? Math.max(0, (rest.endsAt - now) / 1000) : 0
  useEffect(() => {
    if (rest && restLeft <= 0) {
      success()
      skipRest()
    }
  }, [rest, restLeft])

  const cur = A?.cur ?? 0
  const entry = A?.entries[cur]
  const prev = useMemo(() => (entry ? prevFor(S, entry.id) : []), [S, entry])
  if (!A || !entry) {
    return (
      <Screen>
        <GlassCard padding={20} style={{ marginTop: 40 }}>
          <p style={{ margin: 0, color: 'rgba(243,241,236,0.7)' }}>
            No session running. Start one from your plan.
          </p>
        </GlassCard>
        <PillButton href="/plan/" icon="dumbbell">
          Open plan
        </PillButton>
      </Screen>
    )
  }

  const bw = isBwExercise(entry.id)
  const activeIdx = entry.sets.findIndex((s) => !s.done)
  const nextEntry = A.entries[cur + 1]
  const prog = setsProgress(A)
  const tags = tagsFor(entry.id)
  const _workSets = entry.sets.filter((s) => s.phase !== 'warmup' && !s.warmup)
  const nextRow = activeIdx >= 0 ? entry.sets[activeIdx] : null
  const nextLabel = nextRow
    ? `${fmtW(nextRow.w, bw)} kg × ${nextRow.r}`
    : nextEntry
      ? exTitle(nextEntry.id)
      : 'All sets done'

  const toggle = (i: number) => {
    const row = entry.sets[i]
    tap()
    if (row.done) return setRow(cur, i, { done: false })
    const patch: Partial<SetRow> = { done: true }
    if (i === activeIdx) {
      if (draft.w) patch.w = Number(draft.w) || row.w
      if (draft.r) patch.r = Number(draft.r) || row.r
      if (draft.rpe) patch.rpe = Math.min(10, Math.max(6, Number(draft.rpe)))
      setDraft({})
    }
    setRow(cur, i, patch)
    const lastOfExercise = entry.sets.every((s, j) => j === i || s.done)
    if (lastOfExercise && nextEntry) {
      startRest(`Next: ${exTitle(nextEntry.id)}`)
      setTimeout(() => setCurrent(cur + 1), 500)
    } else if (!lastOfExercise) {
      startRest(`Next: set ${i + 2} of ${entry.sets.length}`)
    }
  }

  const doFinish = () => {
    skipRest()
    const s = finish()
    router.replace(s?.workout.entries.length ? `/workout/summary/?id=${s.workout.id}` : '/plan/')
  }

  return (
    <Screen
      orbs={[
        { tone: 'ember', strength: 0.38, right: -240, top: -120 },
        { tone: 'sage', strength: 0.3, size: 520, left: -260, bottom: -200 },
      ]}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            className="sy-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              color: 'rgba(243,241,236,0.55)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: '#FF6B3D',
                animation: 'sy-pulse 1.4s ease-in-out infinite',
              }}
            />
            {A.name.toUpperCase()} · {elapsed(A, now)}
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 300, letterSpacing: '-0.04em' }}>
            Session {sessionNumber(S)}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setFinishOpen(true)}
          style={{
            height: 44,
            padding: '0 20px',
            borderRadius: 22,
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            font: 'inherit',
            cursor: 'pointer',
            color: '#FFC7B0',
            border: '1px solid rgba(255,199,176,0.35)',
            background: 'rgba(255,107,61,0.08)',
          }}
        >
          Finish
        </button>
      </header>

      <GlassCard
        as="section"
        aria-label="Rest timer"
        padding={16}
        style={{ display: 'flex', gap: 18, alignItems: 'center' }}
      >
        <div style={{ position: 'relative', width: 136, height: 136, flexShrink: 0 }}>
          <RestRing left={restLeft} total={rest?.total ?? 1} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span className="sy-dot" style={{ fontSize: 30, lineHeight: 1 }}>
              {rest ? mmss(restLeft) : 'GO'}
            </span>
            <span
              className="sy-mono"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(243,241,236,0.6)' }}
            >
              {rest ? 'REST' : 'READY'}
            </span>
          </div>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1, minWidth: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>
              {activeIdx >= 0 ? `NEXT · SET ${activeIdx + 1} OF ${entry.sets.length}` : 'NEXT'}
            </div>
            <div
              style={{
                fontSize: 16,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nextLabel}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>
              {entry.plan?.kind && entry.plan.kind !== 'off'
                ? 'Progression applied'
                : 'Target RPE 8'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => (rest ? addRest(15) : startRest('Rest', 15))}
              style={{
                height: 44,
                flexGrow: 1,
                borderRadius: 22,
                fontSize: 13,
                font: 'inherit',
                color: '#F3F1EC',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              +15 s
            </button>
            <button
              type="button"
              onClick={skipRest}
              disabled={!rest}
              style={{
                height: 44,
                flexGrow: 1,
                borderRadius: 22,
                fontSize: 13,
                font: 'inherit',
                cursor: 'pointer',
                background: '#F3F1EC',
                color: '#0B0F0D',
                border: 0,
                fontWeight: 500,
                opacity: rest ? 1 : 0.5,
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard
        as="section"
        aria-label="Current exercise"
        padding="18px 12px 12px"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '0 6px',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 400, letterSpacing: '-0.03em' }}>
              <Link
                href={`/workout/exercise/?i=${cur}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {exTitle(entry.id)}
                <Icon name="chevronRight" size={16} style={{ color: 'rgba(243,241,236,0.5)' }} />
              </Link>
            </h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tags.primary.map((t) => (
                <Tag key={t} tone="ember">
                  {t}
                </Tag>
              ))}
              {tags.secondary.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
          <IconButton
            icon="more"
            label="Exercise options"
            variant="outline"
            onClick={() => setListOpen(true)}
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          />
        </div>
        <div
          className="sy-mono"
          aria-hidden="true"
          style={{
            display: 'grid',
            gridTemplateColumns: '30px minmax(0,1fr) 56px 44px 40px 44px',
            gap: 6,
            padding: '0 9px',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'rgba(243,241,236,0.45)',
          }}
        >
          <span>SET</span>
          <span>PREV</span>
          <span style={{ textAlign: 'center' }}>KG</span>
          <span style={{ textAlign: 'center' }}>REPS</span>
          <span style={{ textAlign: 'center' }}>RPE</span>
          <span />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {entry.sets.map((row, i) => {
            const active = i === activeIdx
            const warm = row.phase === 'warmup' || row.warmup
            const n = warm
              ? 'W'
              : String(
                  entry.sets.slice(0, i + 1).filter((s) => !(s.phase === 'warmup' || s.warmup))
                    .length,
                )
            const p = prev[i]
            const fg = row.done ? 'rgba(243,241,236,0.92)' : 'rgba(243,241,236,0.4)'
            const input = (
              value: string | undefined,
              ph: string,
              key: 'w' | 'r' | 'rpe',
              w: number,
              label: string,
              bd = 'rgba(255,255,255,0.14)',
            ) => (
              <input
                className="sy-mono"
                aria-label={label}
                inputMode="decimal"
                value={value ?? ''}
                placeholder={ph}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                style={{
                  width: w,
                  height: 38,
                  borderRadius: 12,
                  border: `1px solid ${bd}`,
                  background: 'rgba(255,255,255,0.06)',
                  textAlign: 'center',
                  fontSize: 13,
                  outline: 'none',
                  padding: 0,
                  color: '#F3F1EC',
                }}
              />
            )
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px minmax(0,1fr) 56px 44px 40px 44px',
                  gap: 6,
                  alignItems: 'center',
                  height: 54,
                  padding: '0 8px',
                  borderRadius: 18,
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(255,199,176,0.28)' : 'transparent'}`,
                  transition: 'background 250ms',
                }}
              >
                <span
                  className="sy-mono"
                  style={{ fontSize: 12, color: warm ? '#FFC7B0' : 'rgba(243,241,236,0.7)' }}
                >
                  {n}
                </span>
                <span
                  className="sy-mono"
                  style={{
                    fontSize: 11,
                    color: 'rgba(243,241,236,0.5)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p ? `${fmtW(p.w, bw)} × ${p.r}` : '—'}
                </span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {active ? (
                    input(
                      draft.w,
                      fmtW(row.w, bw),
                      'w',
                      56,
                      'Weight in kilograms',
                      'rgba(255,199,176,0.5)',
                    )
                  ) : (
                    <span className="sy-mono" style={{ fontSize: 13, color: fg }}>
                      {fmtW(row.w, bw)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {active ? (
                    input(draft.r, String(row.r), 'r', 44, 'Reps')
                  ) : (
                    <span className="sy-mono" style={{ fontSize: 13, color: fg }}>
                      {row.r}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {active ? (
                    input(draft.rpe, warm ? '–' : '8', 'rpe', 40, 'RPE')
                  ) : (
                    <span className="sy-mono" style={{ fontSize: 13, color: fg }}>
                      {row.rpe ?? '–'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={row.done}
                  aria-label={`Mark set ${n} ${row.done ? 'not done' : 'done'}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: `1px solid ${row.done ? '#A9C3A0' : 'rgba(255,255,255,0.14)'}`,
                    background: row.done ? '#A9C3A0' : 'transparent',
                    color: row.done ? '#0B0F0D' : 'rgba(243,241,236,0.5)',
                    transition: 'background 200ms',
                  }}
                >
                  <Icon name="check" size={18} stroke={2} />
                </button>
              </div>
            )
          })}
        </div>
        <PillButton
          variant="ghost"
          icon="plus"
          height={40}
          fontSize={13}
          onClick={() => addSet(cur)}
          style={{ alignSelf: 'center' }}
        >
          Add set
        </PillButton>
      </GlassCard>

      {nextEntry ? (
        <section aria-label="Up next" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            className="sy-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              color: 'rgba(243,241,236,0.5)',
              padding: '0 4px',
            }}
          >
            UP NEXT
          </div>
          <GlassCard
            onClick={() => setCurrent(cur + 1)}
            radius={22}
            padding="0 18px"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: 60,
            }}
          >
            <span style={{ fontSize: 15 }}>{exTitle(nextEntry.id)}</span>
            <span className="sy-mono" style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>
              {nextEntry.sets.length} × {nextEntry.target?.reps ?? nextEntry.sets[0]?.r}
            </span>
          </GlassCard>
        </section>
      ) : null}
      <div
        style={{ textAlign: 'center', fontSize: 12, color: 'rgba(243,241,236,0.45)' }}
        className="sy-mono"
      >
        {prog.done} / {prog.total} SETS · EXERCISE {cur + 1} / {A.entries.length}
      </div>

      <BottomSheet
        open={listOpen}
        onClose={() => setListOpen(false)}
        title="Exercises in this session"
      >
        <div style={{ display: 'grid', gap: 6 }}>
          {A.entries.map((e, i) => {
            const d = e.sets.filter((s) => s.done).length
            return (
              <button
                key={`${e.id}-${i}`}
                type="button"
                onClick={() => {
                  setCurrent(i)
                  setListOpen(false)
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: 54,
                  padding: '0 16px',
                  borderRadius: 18,
                  font: 'inherit',
                  cursor: 'pointer',
                  color: '#F3F1EC',
                  background: i === cur ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === cur ? 'rgba(255,199,176,0.4)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <span style={{ fontSize: 14.5 }}>{exTitle(e.id)}</span>
                <span
                  className="sy-mono"
                  style={{
                    fontSize: 12,
                    color: d === e.sets.length ? '#A9C3A0' : 'rgba(243,241,236,0.55)',
                  }}
                >
                  {d}/{e.sets.length}
                </span>
              </button>
            )
          })}
        </div>
      </BottomSheet>
      <BottomSheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={prog.done < prog.total ? 'Finish early?' : 'Finish session'}
      >
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'rgba(243,241,236,0.7)',
          }}
        >
          {prog.done === 0
            ? 'No sets are checked off yet.'
            : prog.done < prog.total
              ? `${prog.total - prog.done} sets are still unchecked. Unchecked sets are not saved.`
              : 'Every set is done. Nicely worked.'}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          <PillButton icon="check" block onClick={doFinish} disabled={prog.done === 0}>
            Finish and save
          </PillButton>
          <PillButton
            variant="ghost"
            height={48}
            block
            onClick={() => {
              skipRest()
              discard()
              router.replace('/plan/')
            }}
          >
            Discard session
          </PillButton>
        </div>
      </BottomSheet>
    </Screen>
  )
}
