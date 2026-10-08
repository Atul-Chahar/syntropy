'use client'

import { EmptyState, GlassCard, IconButton, MetricNumber, Screen, Sparkline } from '@syntropy/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { fmtNum, RecordRow, Trophy } from '@/components/RecordBits'
import { addDays, relDay, today } from '@/lib/dates'
import { exTitle } from '@/lib/ex'
import { allRecords, type ExerciseRecords } from '@/lib/records'
import { mondayOf } from '@/lib/training'
import { useTraining } from '@/stores'

const WEEKS = 12

/** Personal records (DESIGN_GAPS #28): every lift's bests and the latest records. */
export function RecordsScreen() {
  const router = useRouter()
  const S = useTraining((s) => s.S)
  const { byEx, moments } = useMemo(() => allRecords(S), [S])
  const t = today()
  const month = moments.filter((e) => e.d.slice(0, 7) === t.slice(0, 7)).length

  // Records per week for the strip, oldest first.
  const weeks = useMemo(() => {
    const start = addDays(mondayOf(t), -(WEEKS - 1) * 7)
    const n = Array.from({ length: WEEKS }, () => 0)
    for (const e of moments) {
      if (e.d < start) continue
      const i = Math.floor((Date.parse(e.d) - Date.parse(start)) / (7 * 86400000))
      if (i >= 0 && i < WEEKS) n[i]++
    }
    return n
  }, [moments, t])

  // Lifts with the freshest record first, then the most-trained.
  const lifts = useMemo(() => {
    const lastPr = (r: ExerciseRecords) => r.events[r.events.length - 1]?.d ?? ''
    return [...byEx]
      .filter((r) => r.sessions > 0)
      .sort((a, b) => lastPr(b).localeCompare(lastPr(a)) || b.sessions - a.sessions)
  }, [byEx])

  return (
    <Screen
      orbs={[
        { tone: 'peach', strength: 0.34, right: -240, top: -160 },
        { tone: 'ember', strength: 0.22, size: 520, left: -280, bottom: -220 },
      ]}
    >
      <ModalHeader
        left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
        title="Records"
        sub="PERSONAL BESTS"
      />

      <GlassCard
        as="section"
        aria-label="Records this month"
        radius={30}
        padding="18px 18px 16px"
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              className="sy-mono"
              style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'rgba(243,241,236,0.55)' }}
            >
              THIS MONTH
            </span>
            <MetricNumber value={month} size={58} color="#FFE6DA" />
            <span style={{ fontSize: 13, color: 'rgba(243,241,236,0.7)' }}>
              {month === 1 ? 'personal record' : 'personal records'} · {moments.length} all time
            </span>
          </div>
          <Trophy size={64} glow />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            aria-hidden="true"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${WEEKS}, minmax(0,1fr))`,
              alignItems: 'end',
              height: 40,
            }}
          >
            {weeks.map((n, i) => (
              <span
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {Array.from({ length: Math.max(1, Math.min(4, n)) }, (_, j) => (
                  <span
                    key={j}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      background: n ? '#FFC7B0' : 'rgba(243,241,236,0.1)',
                      boxShadow:
                        n && i === WEEKS - 1 ? '0 0 10px rgba(255,199,176,0.7)' : undefined,
                    }}
                  />
                ))}
              </span>
            ))}
          </div>
          <div
            className="sy-mono"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'rgba(243,241,236,0.45)',
            }}
          >
            <span>{WEEKS} WEEKS AGO</span>
            <span>THIS WEEK</span>
          </div>
        </div>
      </GlassCard>

      {moments.length ? (
        <>
          <SectionTitle title="Recent" right={`${Math.min(8, moments.length)} LATEST`} />
          <GlassCard as="section" aria-label="Recent records" radius={28} padding="2px 16px">
            {moments.slice(0, 8).map((m, i) => (
              <RecordRow key={`${m.workoutId}-${m.exId}`} m={m} first={i === 0} />
            ))}
          </GlassCard>
        </>
      ) : (
        <GlassCard radius={28}>
          <EmptyState
            icon="trophy"
            title="No records yet"
            body="Your first session of a lift sets the baseline. Beat it next time and it shows up here."
          />
        </GlassCard>
      )}

      {lifts.length ? (
        <>
          <SectionTitle title="All lifts" right={`${lifts.length} LOGGED`} />
          <GlassCard as="section" aria-label="All lifts" radius={28} padding="2px 16px">
            {lifts.map((r, i) => (
              <LiftRow key={r.exId} r={r} first={i === 0} />
            ))}
          </GlassCard>
        </>
      ) : null}
    </Screen>
  )
}

function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '6px 4px 0',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 400, letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {right ? (
        <span
          className="sy-mono"
          style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
        >
          {right}
        </span>
      ) : null}
    </div>
  )
}

function LiftRow({ r, first }: { r: ExerciseRecords; first: boolean }) {
  const key = r.repsOnly ? 'reps' : 'e1rm'
  const series = r.points
    .map((p) => (r.repsOnly ? p.reps : p.e1rm))
    .filter((v): v is number => v != null)
    .slice(-10)
  const best = r.best[key]?.value ?? 0
  const lastPr = r.events[r.events.length - 1]
  return (
    <Link
      href={`/records/exercise/?id=${r.exId}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 64px 76px',
        alignItems: 'center',
        gap: 10,
        minHeight: 60,
        borderTop: first ? undefined : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontSize: 14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {exTitle(r.exId)}
        </span>
        <span
          className="sy-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.04em',
            color: 'rgba(243,241,236,0.5)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {r.sessions} {r.sessions === 1 ? 'session' : 'sessions'}
          {lastPr ? ` · PR ${relDay(lastPr.d)}` : ''}
        </span>
      </span>
      <Sparkline points={series} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: 14.5, whiteSpace: 'nowrap' }}>
          {r.repsOnly ? `${best} reps` : `${fmtNum(best)} kg`}
        </span>
        <span
          className="sy-mono"
          style={{ fontSize: 9.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.45)' }}
        >
          {r.repsOnly ? 'BEST' : 'EST 1RM'}
        </span>
      </span>
    </Link>
  )
}
