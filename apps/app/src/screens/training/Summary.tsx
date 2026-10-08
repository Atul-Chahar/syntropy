'use client'

import { GlassCard, Icon, IconButton, MetricNumber, PillButton, Screen, Tag } from '@syntropy/ui'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { RecordRow } from '@/components/RecordBits'
import { fmt, shortDate } from '@/lib/dates'
import { allRecords, groupMoments, workoutRecords } from '@/lib/records'
import { exTitle, fmtW, isBwExercise, workoutMinutes } from '@/lib/training'
import { useTraining } from '@/stores'

/** Workout summary (DESIGN_GAPS #3): after Finish, and for past sessions. */
export function SummaryScreen() {
  const router = useRouter()
  const id = useSearchParams().get('id')
  const S = useTraining((s) => s.S)
  const last = useTraining((s) => s.lastSummary)
  const w = S.workouts.find((x) => x.id === id) ?? last?.workout
  const records = useMemo(() => (w ? groupMoments(workoutRecords(S, w.id)) : []), [S, w])
  if (!w) {
    return (
      <Screen>
        <ModalHeader
          left={<IconButton icon="close" label="Close" href="/plan/" />}
          title="Session"
        />
        <p style={{ color: 'rgba(243,241,236,0.6)' }}>Session not found.</p>
      </Screen>
    )
  }
  const fresh = last?.workout.id === w.id
  const sets = w.entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)
  const prs = new Set(records.map((e) => e.exId))
  const index = S.workouts.findIndex((x) => x.id === w.id)
  const question = encodeURIComponent(
    `Debrief my ${w.name} session from ${shortDate(w.d)}: what went well and what should I change next time?`,
  )

  return (
    <Screen
      orbs={[
        { tone: 'sage', strength: 0.42, left: -240, top: -140 },
        { tone: 'ember', strength: 0.34, right: -260, bottom: -200 },
      ]}
    >
      <ModalHeader
        left={<IconButton icon="close" label="Close" onClick={() => router.replace('/plan/')} />}
        title={fresh ? 'Session saved' : 'Session'}
        sub={`${shortDate(w.d).toUpperCase()} · SESSION ${index >= 0 ? index + 1 : S.workouts.length}`}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: '14px 0 4px',
        }}
      >
        <span
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 35% 25%, #DDEBD4, #A9C3A0 60%, #6F8F63)',
            color: '#0B0F0D',
            boxShadow: '0 20px 50px rgba(169,195,160,0.3)',
          }}
        >
          <Icon name="check" size={34} stroke={2} />
        </span>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 300, letterSpacing: '-0.045em' }}>
          {w.name}
        </h1>
        {prs.size ? (
          <Tag tone="peach" height={26}>
            <Icon name="trophy" size={13} />
            {records.length} personal {records.length === 1 ? 'record' : 'records'}
          </Tag>
        ) : null}
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
        {[
          ['Duration', workoutMinutes(w), 'min'],
          ['Volume', Math.round((w.vol ?? 0) / 100) / 10, 't'],
          ['Sets', sets, ''],
        ].map(([k, v, u]) => (
          <GlassCard
            key={k as string}
            radius={22}
            padding="14px 12px"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.66)' }}>{k}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <MetricNumber value={v as number} size={26} decimals={k === 'Volume' ? 1 : 0} />
              <span style={{ fontSize: 11, color: 'rgba(243,241,236,0.5)' }}>{u}</span>
            </span>
          </GlassCard>
        ))}
      </div>
      {records.length ? (
        <GlassCard as="section" aria-label="Personal records" radius={28} padding="14px 16px 2px">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingBottom: 4,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 500 }}>Personal records</span>
            <Link
              href="/records/"
              className="sy-mono"
              style={{ fontSize: 10.5, letterSpacing: '0.06em', color: '#FFC7B0' }}
            >
              ALL RECORDS
            </Link>
          </div>
          {records.map((m, i) => (
            <RecordRow key={m.exId} m={m} first={i === 0} />
          ))}
        </GlassCard>
      ) : null}
      <GlassCard as="section" aria-label="Exercises" radius={28} padding="4px 16px">
        {w.entries.map((e, i) => {
          const done = e.sets.filter((s) => s.done && s.phase !== 'warmup')
          const top = done.reduce((b, s) => (s.w > b.w ? s : b), done[0] ?? { w: 0, r: 0 })
          return (
            <div
              key={`${e.id}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                alignItems: 'center',
                gap: 10,
                minHeight: 58,
                borderTop: i ? '1px solid rgba(255,255,255,0.07)' : undefined,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {exTitle(e.id)}
                  {prs.has(e.id) ? (
                    <Icon name="trophy" size={13} style={{ color: '#FFC7B0' }} />
                  ) : null}
                </span>
                <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>
                  {done.map((s) => `${fmtW(s.w, isBwExercise(e.id))}×${s.r}`).join('  ')}
                </span>
              </span>
              <span className="sy-mono" style={{ fontSize: 12, color: 'rgba(243,241,236,0.7)' }}>
                top {fmtW(top.w, isBwExercise(e.id))} kg
              </span>
            </div>
          )
        })}
      </GlassCard>
      <PillButton variant="peach" icon="sparkle" block href={`/coach/chat/?q=${question}`}>
        Ask Coach for a debrief
      </PillButton>
      <PillButton icon="check" block onClick={() => router.replace('/')}>
        Done
      </PillButton>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(243,241,236,0.45)', margin: 0 }}>
        {fmt(sets)} sets logged to your history. Recovery updates now.
      </p>
    </Screen>
  )
}

/** Workout history (DESIGN_GAPS #17). */
export function HistoryScreen() {
  const router = useRouter()
  const S = useTraining((s) => s.S)
  const list = [...S.workouts].reverse()
  const recordCount = useMemo(() => {
    const n = new Map<string, number>()
    for (const e of allRecords(S).moments) n.set(e.workoutId, (n.get(e.workoutId) ?? 0) + 1)
    return n
  }, [S])
  return (
    <Screen>
      <ModalHeader
        left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
        title="History"
        sub={`${S.workouts.length} SESSIONS`}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((w) => (
          <GlassCard
            key={w.id}
            href={`/workout/summary/?id=${w.id}`}
            radius={22}
            padding="12px 16px"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15 }}>{w.name}</span>
              <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>
                {shortDate(w.d).toUpperCase()} · {workoutMinutes(w)} MIN · {w.entries.length}{' '}
                EXERCISES
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {recordCount.get(w.id) ? (
                <span
                  className="sy-mono"
                  aria-label={`${recordCount.get(w.id)} personal records`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 11,
                    color: '#FFC7B0',
                  }}
                >
                  <Icon name="trophy" size={14} />
                  {recordCount.get(w.id)}
                </span>
              ) : null}
              <span style={{ fontSize: 15, fontWeight: 300 }}>
                {((w.vol ?? 0) / 1000).toFixed(1)} t
              </span>
            </span>
          </GlassCard>
        ))}
        {!list.length ? (
          <p style={{ color: 'rgba(243,241,236,0.6)', textAlign: 'center' }}>
            No sessions yet. Your first one starts from Plan.
          </p>
        ) : null}
      </div>
    </Screen>
  )
}
