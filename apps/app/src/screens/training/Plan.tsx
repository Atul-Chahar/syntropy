'use client'

import { BottomSheet, Callout, GlassCard, Icon, IconButton, PillButton, Screen } from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Header } from '@/components/BottomBar'
import { parseIso, today } from '@/lib/dates'
import { DOT, estMinutes, exTitle, mondayOf, weekDays, workoutMinutes } from '@/lib/training'
import { tap } from '@/platform/haptics'
import { toast, useTraining } from '@/stores'

const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function PlanScreen() {
  const router = useRouter()
  const S = useTraining((s) => s.S)
  const start = useTraining((s) => s.start)
  const setDay = useTraining((s) => s.setDay)
  const days = useMemo(() => weekDays(S), [S])
  const [sel, setSel] = useState(() => days.find((d) => d.date === today())?.date ?? days[0].date)
  const [pickOpen, setPickOpen] = useState(false)
  const [optsOpen, setOptsOpen] = useState(false)
  const d = days.find((x) => x.date === sel) ?? days[0]
  const first = S.workouts[0]?.d
  const weekNo = first
    ? Math.max(
        1,
        Math.floor(
          (parseIso(mondayOf(today())).getTime() - parseIso(mondayOf(first)).getTime()) /
            (7 * 86400000),
        ) + 1,
      )
    : 1
  const routine = d.routines[0]
  const doneW = d.done[0]
  const isToday = d.status === 'today'

  const exList = doneW
    ? doneW.entries.map((e, i) => ({
        i: String(i + 1).padStart(2, '0'),
        name: exTitle(e.id),
        sch: `${e.sets.filter((s) => s.done).length} × ${e.sets[0]?.r ?? ''}`,
      }))
    : (routine?.ex ?? []).map((e, i) => ({
        i: String(i + 1).padStart(2, '0'),
        name: exTitle(e.id),
        sch: `${e.sets} × ${e.reps}`,
      }))

  const meta = doneW
    ? `${doneW.entries.length} exercises · ${workoutMinutes(doneW)} min · done`
    : routine
      ? `${routine.ex.length} exercises · ~${estMinutes(routine)} min · ${isToday ? 'today' : d.status === 'missed' ? 'skipped' : 'planned'}`
      : 'Rest day'

  const go = () => {
    if (doneW) return router.push(`/workout/summary/?id=${doneW.id}`)
    if (isToday || S.active) {
      if (!S.active && routine) start([routine.id])
      return router.push('/workout/')
    }
    router.push('/library/')
  }

  return (
    <Screen
      tabBar
      orbs={[
        { tone: 'ember', strength: 0.34, right: -240, top: -120 },
        { tone: 'sage', strength: 0.36, size: 540, left: -260, bottom: -200 },
      ]}
    >
      <Header
        kicker={`WEEK ${weekNo} · ${Object.keys(S.week).length ? 'CUSTOM SPLIT' : 'NO SPLIT YET'}`}
        title="Plan"
        right={
          <PillButton
            variant="glass"
            height={44}
            icon="list"
            iconSize={16}
            fontSize={13.5}
            href="/library/"
            style={{ padding: '0 16px' }}
          >
            Library
          </PillButton>
        }
      />
      <GlassCard
        href="/coach/"
        radius={26}
        padding="14px 16px 14px 14px"
        style={{ display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden' }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -40,
            top: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,61,0.32), rgba(255,107,61,0) 70%)',
          }}
        />
        <span
          style={{
            position: 'relative',
            width: 48,
            height: 48,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1A0E08',
            background: 'radial-gradient(circle at 32% 25%, #FFC2A3 0%, #FF7A4A 50%, #E0501F 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
            flexShrink: 0,
          }}
        >
          <Icon name="sparkle" size={22} stroke={1.7} />
        </span>
        <span
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            flexGrow: 1,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em' }}>Coach</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'rgba(243,241,236,0.66)' }}>
            Design, review and adjust your split from your own training data.
          </span>
        </span>
        <Icon
          name="chevronRight"
          size={18}
          style={{ position: 'relative', color: 'rgba(243,241,236,0.6)' }}
        />
      </GlassCard>

      <div
        role="group"
        aria-label="This week"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 5 }}
      >
        {days.map((x) => {
          const on = x.date === sel
          return (
            <button
              key={x.date}
              type="button"
              aria-pressed={on}
              aria-label={`${DAYN[x.weekday]}, ${x.routines[0]?.name ?? x.done[0]?.name ?? 'rest'}`}
              onClick={() => {
                tap()
                setSel(x.date)
              }}
              style={{
                height: 76,
                borderRadius: 22,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                font: 'inherit',
                cursor: 'pointer',
                background: on ? '#F3F1EC' : 'rgba(255,255,255,0.045)',
                color: on ? '#0B0F0D' : '#F3F1EC',
                border: `1px solid ${on ? '#F3F1EC' : x.status === 'today' ? 'rgba(255,107,61,0.6)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'background 250ms, color 250ms',
              }}
            >
              <span className="sy-mono" style={{ fontSize: 10.5, opacity: 0.7 }}>
                {LETTER[x.weekday]}
              </span>
              <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.02em' }}>
                {parseIso(x.date).getDate()}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: DOT[x.status] }} />
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          <GlassCard
            as="section"
            aria-label="Day routine"
            padding="20px 18px 18px"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span
                  className="sy-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    color: isToday ? '#FFB79A' : 'rgba(243,241,236,0.55)',
                  }}
                >
                  {isToday
                    ? `TODAY · ${DAYN[d.weekday].toUpperCase()}`
                    : DAYN[d.weekday].toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 300,
                    letterSpacing: '-0.045em',
                    lineHeight: 1.05,
                  }}
                >
                  {doneW?.name ?? routine?.name ?? 'Rest'}
                </span>
                <span style={{ fontSize: 12.5, color: 'rgba(243,241,236,0.6)' }}>{meta}</span>
              </div>
              <IconButton
                icon="more"
                label="Routine options"
                variant="outline"
                onClick={() => setOptsOpen(true)}
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            {!routine && !doneW ? (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '6px 0 2px' }}
              >
                <Callout tone="sage" style={{ padding: 14, fontSize: 13, lineHeight: 1.5 }}>
                  Recovery is part of the plan. Protein and sleep carry today&apos;s work.
                </Callout>
                <PillButton
                  variant="outline"
                  height={52}
                  icon="plus"
                  fontSize={15}
                  block
                  onClick={() => setPickOpen(true)}
                  style={{ borderStyle: 'dashed', borderColor: 'rgba(243,241,236,0.3)' }}
                >
                  Add routine
                </PillButton>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {exList.map((e) => (
                    <div
                      key={e.i + e.name}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '28px minmax(0,1fr) auto',
                        alignItems: 'center',
                        gap: 10,
                        height: 46,
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <span
                        className="sy-mono"
                        style={{ fontSize: 11, color: 'rgba(243,241,236,0.45)' }}
                      >
                        {e.i}
                      </span>
                      <span
                        style={{
                          fontSize: 14.5,
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {e.name}
                      </span>
                      <span
                        className="sy-mono"
                        style={{ fontSize: 12, color: 'rgba(243,241,236,0.62)' }}
                      >
                        {e.sch}
                      </span>
                    </div>
                  ))}
                </div>
                <PillButton
                  variant={isToday || S.active ? 'primary' : 'glass'}
                  height={54}
                  fontSize={15.5}
                  icon={doneW ? 'chevronRight' : isToday ? 'play' : 'chevronRight'}
                  iconAfter={!isToday}
                  block
                  onClick={go}
                  style={
                    isToday || S.active
                      ? undefined
                      : {
                          background: 'rgba(255,255,255,0.05)',
                          borderColor: 'rgba(255,255,255,0.12)',
                        }
                  }
                >
                  {doneW
                    ? 'Review session'
                    : S.active && isToday
                      ? 'Resume session'
                      : isToday
                        ? 'Start session'
                        : 'Preview in library'}
                </PillButton>
              </>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      <BottomSheet
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        title={`Train on ${DAYN[d.weekday]}s`}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {S.routines.map((r) => (
            <PillButton
              key={r.id}
              variant="glass"
              height={54}
              block
              onClick={() => {
                setDay(d.weekday, r.id)
                setPickOpen(false)
                toast(`${r.name} on ${DAYN[d.weekday]}s`)
              }}
            >
              {r.name} · {r.ex.length} exercises
            </PillButton>
          ))}
          <PillButton variant="outline" icon="plus" height={52} block href="/routine/">
            Build a new routine
          </PillButton>
        </div>
      </BottomSheet>
      <BottomSheet
        open={optsOpen}
        onClose={() => setOptsOpen(false)}
        title={routine?.name ?? 'This day'}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {routine ? (
            <PillButton
              variant="glass"
              icon="pencil"
              height={52}
              block
              href={`/routine/?id=${routine.id}`}
            >
              Edit routine
            </PillButton>
          ) : null}
          <PillButton
            variant="glass"
            icon="calendar"
            height={52}
            block
            onClick={() => {
              setOptsOpen(false)
              setPickOpen(true)
            }}
          >
            {routine ? 'Change routine for this day' : 'Add a routine'}
          </PillButton>
          {routine ? (
            <PillButton
              variant="ghost"
              icon="close"
              height={48}
              block
              onClick={() => {
                setDay(d.weekday, null)
                setOptsOpen(false)
                toast(`${DAYN[d.weekday]}s are rest days now`)
              }}
            >
              Make it a rest day
            </PillButton>
          ) : null}
          <Link
            href="/history/"
            style={{
              textAlign: 'center',
              fontSize: 13.5,
              color: 'rgba(243,241,236,0.66)',
              padding: 10,
            }}
          >
            Session history
          </Link>
        </div>
      </BottomSheet>
    </Screen>
  )
}
