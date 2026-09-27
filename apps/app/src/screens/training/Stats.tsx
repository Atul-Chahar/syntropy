'use client'

import { e1rmSeries } from '@syntropy/core/onerm'
import { weightTrend } from '@syntropy/nutrition'
import {
  BodyMap,
  GlassCard,
  IconButton,
  PillButton,
  Screen,
  Segmented,
  Sparkline,
  Tabs,
} from '@syntropy/ui'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Header } from '@/components/BottomBar'
import { addDays, monthShort, parseIso, today } from '@/lib/dates'
import { muscleRows, primaryMusclesOf, trendRate } from '@/lib/summary'
import { exTitle, mondayOf, muscleName, streakWeeks } from '@/lib/training'
import { useTraining } from '@/stores'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function DotGrid() {
  const S = useTraining((s) => s.S)
  const t = today()
  const start = addDays(mondayOf(t), -25 * 7)
  const vol = new Map<string, number>()
  for (const w of S.workouts) vol.set(w.d, (vol.get(w.d) ?? 0) + (w.vol ?? 1))
  const vals = [...vol.values()].sort((a, b) => a - b)
  const q = (p: number) => vals[Math.floor(p * (vals.length - 1))] ?? 0
  const lo = q(0.33)
  const hi = q(0.66)
  const cols = Array.from({ length: 26 }, (_, c) => c)
  const months: { x: number; label: string }[] = []
  let lastM = ''
  for (const c of cols) {
    const d = addDays(start, c * 7)
    const m = monthShort(d)
    const x = 6.1 + c * 12.23
    if (m !== lastM && (!months.length || x - months[months.length - 1].x > 34)) {
      months.push({ x, label: m })
      lastM = m
    } else if (m !== lastM) lastM = m
  }
  return (
    <div>
      <svg aria-hidden="true" width="100%" viewBox="0 0 318 92" style={{ display: 'block' }}>
        {cols.map((c) =>
          Array.from({ length: 7 }, (_, r) => {
            const d = addDays(start, c * 7 + r)
            const x = 6.1 + c * 12.23
            const y = 8 + r * 12.5
            if (d > t)
              return (
                <circle
                  key={d}
                  cx={x}
                  cy={y}
                  r="3.6"
                  fill="none"
                  stroke="rgba(243,241,236,0.1)"
                  strokeWidth="0.8"
                />
              )
            const v = vol.get(d)
            const op = v == null ? null : v <= lo ? 0.38 : v <= hi ? 0.68 : 1
            return (
              <g key={d}>
                {d === t ? (
                  <circle cx={x} cy={y} r="7" fill="none" stroke="#FFC7B0" strokeWidth="1.2" />
                ) : null}
                <circle
                  cx={x}
                  cy={y}
                  r="4.2"
                  fill={op == null ? 'rgba(243,241,236,0.07)' : '#FF6B3D'}
                  fillOpacity={op ?? 1}
                />
              </g>
            )
          }),
        )}
      </svg>
      <div style={{ position: 'relative', height: 14, marginTop: 4 }}>
        {months.map((m) => (
          <span
            key={m.x}
            className="sy-mono"
            style={{
              position: 'absolute',
              left: `${(m.x / 318) * 100}%`,
              fontSize: 10,
              color: 'rgba(243,241,236,0.5)',
            }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}

type Tab = 'balance' | 'fatigue' | 'strength'
type Range = 'wk' | 'd30' | 'd90'

export function StatsScreen() {
  const S = useTraining((s) => s.S)
  const [tab, setTab] = useState<Tab>('balance')
  const [range, setRange] = useState<Range>('wk')
  const t = today()
  const month = S.workouts.filter((w) => w.d.slice(0, 7) === t.slice(0, 7)).length
  const trend = weightTrend(S.bodyweight)
  const last = trend[trend.length - 1]
  const month30 = trend.find((x) => x.d >= addDays(t, -30))
  const delta = last && month30 ? last.ema - month30.ema : 0

  const balance = useMemo(() => {
    const days = range === 'wk' ? 7 : range === 'd30' ? 30 : 90
    const since = addDays(t, -days)
    const sets: Record<string, number> = {}
    for (const w of S.workouts)
      if (w.d > since)
        for (const e of w.entries) {
          const n = e.sets.filter((s) => s.done && s.phase !== 'warmup').length
          for (const m of primaryMusclesOf(e.id)) sets[m] = (sets[m] ?? 0) + n
        }
    const weeks = days / 7
    return Object.entries(sets)
      .map(([m, n]) => ({ m, v: n / weeks }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6)
  }, [S, range, t])

  const recov = useMemo(() => muscleRows(S), [S])
  const topFatigue = recov.rows
    .filter((r) => r.state === 'fatigued' || r.state === 'recovering')
    .slice(0, 3)
    .map((r) => muscleName(r.slug).toLowerCase())

  const strength = useMemo(() => {
    const count: Record<string, number> = {}
    for (const w of S.workouts) for (const e of w.entries) count[e.id] = (count[e.id] ?? 0) + 1
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => {
        const pts = (e1rmSeries(S, id) as { d: string; y: number }[]).filter((p) => p.y > 0)
        const recent = pts.filter((p) => p.d >= addDays(t, -90))
        const series = (recent.length > 1 ? recent : pts).slice(-8).map((p) => p.y)
        const lastV = series[series.length - 1] ?? 0
        const d = series.length > 1 ? lastV - series[0] : 0
        return { id, v: lastV, d, series }
      })
      .filter((x) => x.v > 0)
  }, [S, t])

  return (
    <Screen
      tabBar
      orbs={[
        { tone: 'ember', strength: 0.3, right: -240, top: -120 },
        { tone: 'sage', strength: 0.36, size: 540, left: -260, bottom: -200 },
      ]}
    >
      <Header
        kicker="PROGRESS & HISTORY"
        title="Stats"
        right={<IconButton icon="history" label="Session history" href="/history/" />}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
        {[
          ['Workouts', S.workouts.length, '', undefined],
          [MONTHS[parseIso(t).getMonth()], month, '', undefined],
          ['Streak', streakWeeks(S), 'wk', undefined],
          [
            'Weight 30D',
            `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta).toFixed(1)}`,
            'kg',
            '/progress/',
          ],
        ].map(([k, v, u, href]) => (
          <GlassCard
            key={k as string}
            href={href as string | undefined}
            radius={22}
            padding="12px 12px 14px"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'rgba(243,241,236,0.58)',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              {k}
            </span>
            <span
              style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 2 }}
            >
              <span
                className="sy-dot"
                style={{ fontSize: String(v).length > 3 ? 21 : 25, lineHeight: 1 }}
              >
                {v}
              </span>
              <span style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.55)' }}>{u}</span>
            </span>
          </GlassCard>
        ))}
      </div>
      <GlassCard
        as="section"
        aria-label="Activity"
        radius={28}
        padding="16px 16px 14px"
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Activity</span>
          <span className="sy-mono" style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}>
            26 WEEKS
          </span>
        </div>
        <DotGrid />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            justifyContent: 'flex-end',
            fontSize: 10.5,
            color: 'rgba(243,241,236,0.5)',
          }}
        >
          Less
          {[0.07, 0.38, 0.68, 1].map((o, i) => (
            <span
              key={o}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: i ? '#FF6B3D' : 'rgba(243,241,236,0.07)',
                opacity: i ? o : 1,
              }}
            />
          ))}
          More
        </div>
      </GlassCard>
      <GlassCard
        as="section"
        aria-label="Muscles"
        radius={28}
        padding={14}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <Tabs
          label="Muscle view"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'balance', label: 'Balance' },
            { value: 'fatigue', label: 'Fatigue' },
            { value: 'strength', label: 'Strength' },
          ]}
        />
        {tab === 'balance' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>
                Sets per week, by muscle
              </span>
              <Segmented
                label="Range"
                height={30}
                value={range}
                onChange={setRange}
                options={[
                  { value: 'wk', label: 'Week' },
                  { value: 'd30', label: '30D' },
                  { value: 'd90', label: '90D' },
                ]}
              />
            </div>
            {balance.map((b) => (
              <div
                key={b.m}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '82px minmax(0,1fr) 52px',
                  alignItems: 'center',
                  gap: 10,
                  height: 30,
                }}
              >
                <span style={{ fontSize: 13, color: 'rgba(243,241,236,0.82)' }}>
                  {muscleName(b.m)}
                </span>
                <span
                  style={{
                    position: 'relative',
                    height: 8,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: '40%',
                      width: '40%',
                      top: -3,
                      bottom: -3,
                      borderRadius: 6,
                      border: '1px dashed rgba(169,195,160,0.35)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: 8,
                      borderRadius: 4,
                      width: `${Math.min(100, (b.v / 25) * 100)}%`,
                      background: b.v < 10 ? '#FFC7B0' : b.v <= 20 ? '#A9C3A0' : '#FF6B3D',
                      transition: 'width 500ms var(--sy-ease)',
                    }}
                  />
                </span>
                <span
                  className="sy-mono"
                  style={{ fontSize: 11.5, textAlign: 'right', color: 'rgba(243,241,236,0.72)' }}
                >
                  {b.v.toFixed(range === 'wk' ? 0 : 1)}
                </span>
              </div>
            ))}
            {!balance.length ? (
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(243,241,236,0.55)' }}>
                No sets in this range yet.
              </p>
            ) : null}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingTop: 4,
                fontSize: 11,
                color: 'rgba(243,241,236,0.52)',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 8,
                  borderRadius: 4,
                  border: '1px dashed rgba(169,195,160,0.5)',
                }}
              />
              Productive range · 10–20 sets / week
            </div>
          </>
        ) : null}
        {tab === 'fatigue' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <BodyMap side="front" states={recov.states} width={70} />
            <BodyMap side="back" states={recov.states} width={70} />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flexGrow: 1,
                paddingLeft: 6,
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1.45, color: 'rgba(243,241,236,0.78)' }}>
                {topFatigue.length
                  ? `${topFatigue.join(', ')} carry the most fatigue from this week.`
                  : 'Everything is recovered. A good day to train hard.'}
              </span>
              <PillButton
                height={44}
                fontSize={13.5}
                icon="chevronRight"
                iconAfter
                href="/recovery/"
              >
                Fatigue map
              </PillButton>
            </div>
          </div>
        ) : null}
        {tab === 'strength' ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)', paddingBottom: 6 }}>
              Estimated one-rep max
            </span>
            {strength.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) 64px 84px',
                  alignItems: 'center',
                  gap: 10,
                  height: 46,
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {exTitle(s.id)}
                </span>
                <Sparkline points={s.series} />
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 1,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{s.v.toFixed(1)} kg</span>
                  <span
                    className="sy-mono"
                    style={{ fontSize: 10, color: s.d >= 0 ? '#C9DCBF' : '#FFC7B0' }}
                  >
                    {s.d >= 0 ? '+' : '−'}
                    {Math.abs(s.d).toFixed(1)} · 90D
                  </span>
                </span>
              </div>
            ))}
            {!strength.length ? (
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(243,241,236,0.55)' }}>
                Log a few sessions to see strength trends.
              </p>
            ) : null}
          </div>
        ) : null}
      </GlassCard>
      <Link
        href="/progress/"
        style={{ textAlign: 'center', fontSize: 13, color: 'rgba(243,241,236,0.6)' }}
      >
        Body progress
        {trendRate(S.bodyweight) != null
          ? ` · ${(trendRate(S.bodyweight) as number).toFixed(2)} kg / week`
          : ''}
      </Link>
    </Screen>
  )
}
