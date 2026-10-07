'use client'

import {
  GOAL_INFO,
  type GoalType,
  PACE_RATE,
  type Pace,
  type Targets,
  trendRate,
  weightTrend,
} from '@syntropy/nutrition'
import { Callout, Dot, fitDot, IconButton, PillButton, Screen, Segmented } from '@syntropy/ui'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { BottomBar, Header } from '@/components/BottomBar'
import { addDays, fmt, parseIso, shortDate, today } from '@/lib/dates'
import { targetsFor } from '@/lib/summary'
import { success, tap } from '@/platform/haptics'
import { toast, useGoal, useNutrition, useProfile, useTraining } from '@/stores'

const ORDER: GoalType[] = ['cut', 'recomp', 'gain', 'maintain']

const kicker = { fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }
const sub = { fontSize: 11.5, color: 'rgba(243,241,236,0.58)' }

function paceLine(t: Targets): string {
  const kg = Math.abs(t.rateKgPerWeek).toFixed(2)
  if (t.floored && (t.type === 'cut' || t.type === 'gain'))
    return `${t.type === 'cut' ? '−' : '+'}${kg} kg / week · limited by the safety floor`
  if (t.type === 'cut') return `−${kg} kg / week · ${PACE_RATE.cut[t.pace] * 100}% of body weight`
  if (t.type === 'gain')
    return `+${kg} kg / week · ${Math.round(PACE_RATE.gain[t.pace] * 4.345 * 1000) / 10}% a month`
  if (t.type === 'recomp') return 'Small deficit, high protein. Weight stays, waist goes down.'
  return 'Eat at maintenance. Weight holds within about ±1 kg.'
}

function maintenanceNote(t: Targets): string {
  const m = fmt(t.maintenanceKcal)
  if (t.maintenanceSource === 'measured')
    return `Maintenance is about ${m} kcal, measured from your last ${t.measuredDays} days of food and weight. It keeps updating as you log.`
  if (t.maintenanceSource === 'blended')
    return `Maintenance is about ${m} kcal: ${t.measuredDays} days of your own food and weight, blended with the formula estimate (${fmt(t.formulaKcal)}). It gets sharper every day you log.`
  return `Maintenance is about ${m} kcal, estimated from your body (Mifflin-St Jeor), daily activity and training. Log food and weigh in for 2 weeks and Syntropy measures it from your own data instead.`
}

/** Weight trend for the last 4 weeks, then the planned path to the target. */
function Projection({ t, now }: { t: Targets; now: number }) {
  const S = useTraining((s) => s.S)
  const past = useMemo(() => {
    const from = addDays(today(), -28)
    return weightTrend(S.bodyweight).filter((x) => x.d >= from)
  }, [S.bodyweight])
  const observed = trendRate(S.bodyweight, 21)
  const weeks = t.weeks ?? 8
  const W = 320
  const H = 116
  const span = 28 + weeks * 7
  const xOf = (day: number) => 8 + ((day + 28) / span) * (W - 16)
  const plan: [number, number][] = []
  const pct = Math.abs(t.rateKgPerWeek) / now
  for (let w = 0; w <= weeks; w++) {
    const kg = t.type === 'cut' ? now * (1 - pct) ** w : now * (1 + pct) ** w
    plan.push([
      w * 7,
      t.type === 'cut' ? Math.max(t.targetWeightKg, kg) : Math.min(t.targetWeightKg, kg),
    ])
  }
  const all = [...past.map((p) => p.ema), ...plan.map((p) => p[1]), t.targetWeightKg]
  const lo = Math.min(...all) - 0.4
  const hi = Math.max(...all) + 0.4
  const yOf = (kg: number) => 10 + ((hi - kg) / (hi - lo)) * (H - 30)
  const pastPath = past
    .map((p, i) => {
      const day = (parseIso(p.d).getTime() - parseIso(today()).getTime()) / 86400000
      return `${i ? 'L' : 'M'}${xOf(day).toFixed(1)} ${yOf(p.ema).toFixed(1)}`
    })
    .join(' ')
  const planPath = plan
    .map(([d, kg], i) => `${i ? 'L' : 'M'}${xOf(d).toFixed(1)} ${yOf(kg).toFixed(1)}`)
    .join(' ')

  let status = 'Weigh in a few times a week to see your trend against the plan.'
  if (observed != null) {
    const diff = observed - t.rateKgPerWeek
    const sign = observed > 0 ? '+' : observed < 0 ? '−' : ''
    const label =
      Math.abs(diff) < 0.1
        ? 'on track'
        : (t.rateKgPerWeek < 0 ? observed < t.rateKgPerWeek : observed > t.rateKgPerWeek)
          ? 'faster than plan'
          : 'slower than plan'
    status = `Your trend: ${sign}${Math.abs(observed).toFixed(2)} kg / week · ${label}`
  }

  return (
    <section
      aria-label="Projection"
      className="sy-glass"
      style={{
        borderRadius: 26,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="sy-mono" style={kicker}>
          PROJECTION
        </span>
        <span style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'rgba(243,241,236,0.55)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="#A9C3A0" /> Trend
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dot color="#FFB79A" /> Plan
          </span>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Planned path from ${now.toFixed(1)} to ${t.targetWeightKg.toFixed(1)} kg`}
      >
        <line
          x1="8"
          x2={W - 8}
          y1={yOf(t.targetWeightKg)}
          y2={yOf(t.targetWeightKg)}
          stroke="rgba(255,199,176,0.28)"
          strokeDasharray="2 4"
        />
        <line x1={xOf(0)} x2={xOf(0)} y1="6" y2={H - 20} stroke="rgba(243,241,236,0.14)" />
        {pastPath ? (
          <path d={pastPath} fill="none" stroke="#A9C3A0" strokeWidth="2.2" strokeLinecap="round" />
        ) : null}
        <path
          d={planPath}
          fill="none"
          stroke="#FFB79A"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
        <circle cx={xOf(0)} cy={yOf(now)} r="4" fill="#F3F1EC" />
        <circle cx={xOf(weeks * 7)} cy={yOf(t.targetWeightKg)} r="3.5" fill="#FFB79A" />
        <g className="sy-mono" fontSize="9.5" fill="rgba(243,241,236,0.5)">
          <text x="8" y={H - 4}>
            4 WK AGO
          </text>
          <text x={xOf(0)} y={H - 4} textAnchor="middle">
            TODAY
          </text>
          <text x={W - 8} y={H - 4} textAnchor="end">
            {t.weeks ? shortDate(addDays(today(), t.weeks * 7)).toUpperCase() : `+${weeks} WK`}
          </text>
        </g>
      </svg>
      <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.7)' }}>{status}</span>
    </section>
  )
}

export function GoalScreen() {
  const router = useRouter()
  const onboarding = useSearchParams().get('onboarding') === '1'
  const profile = useProfile()
  const S = useTraining((s) => s.S)
  const meals = useNutrition((s) => s.meals)
  const goal = useGoal()
  const [type, setType] = useState<GoalType>(goal.type)
  const [pace, setPace] = useState<Pace>(goal.pace)
  // A custom target only carries over while the goal direction stays the same.
  const [targetKg, setTargetKg] = useState<number | null>(goal.targetKg ?? null)
  const t = targetsFor(profile, S, goal, meals, today(), type, pace, targetKg)
  const nowKg = weightNow(profile.weightKg, S.bodyweight)
  const paced = type === 'cut' || type === 'gain'

  const pick = (k: GoalType) => {
    if ((k === 'cut') !== (type === 'cut') || (k === 'gain') !== (type === 'gain'))
      setTargetKg(null)
    setType(k)
  }
  const step = (d: number) => {
    tap()
    const next = Math.round((t.targetWeightKg + d) * 2) / 2
    setTargetKg(type === 'cut' ? Math.min(next, nowKg - 0.5) : Math.max(next, nowKg + 0.5))
  }

  const save = () => {
    goal.choose(type, pace, paced ? targetKg : null)
    if (onboarding) {
      profile.set({ onboarded: true })
      useTraining.getState().ensurePlan()
    }
    success()
    toast('Targets saved')
    router.replace(onboarding ? '/' : '/food/')
  }

  let targetTitle = `${t.targetWeightKg.toFixed(1)} kg`
  let targetSub = t.weeks ? `by ${shortDate(addDays(today(), t.weeks * 7))} · ${t.weeks} wk` : ''
  if (type === 'recomp') {
    targetTitle = 'Same weight'
    targetSub = 'Less fat, more muscle'
  } else if (type === 'maintain') {
    targetTitle = `${nowKg.toFixed(1)} kg`
    targetSub = 'Hold within ±1 kg'
  }

  return (
    <Screen
      orbs={[
        { tone: 'ember', strength: 0.34, right: -240, top: -140 },
        { tone: 'sage', strength: 0.36, size: 540, left: -260, bottom: -220 },
      ]}
      contentClassName="pb-cta"
    >
      <Header
        kicker={onboarding ? 'STEP 3 OF 3 · YOUR GOAL' : 'YOUR GOAL'}
        title="Target physique"
        right={
          onboarding ? undefined : (
            <IconButton icon="close" label="Close" onClick={() => router.back()} />
          )
        }
      />
      <section
        aria-label="Now and target"
        className="sy-glass"
        style={{
          padding: '14px 16px',
          borderRadius: 26,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 20px minmax(0,1.25fr)',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="sy-mono" style={kicker}>
              NOW
            </span>
            <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.03em' }}>
              {nowKg.toFixed(1)} kg
            </span>
            <span style={sub}>
              {t.bodyFatEstimated ? '~' : ''}
              {Math.round(t.bodyFatPct)}% body fat
            </span>
          </div>
          <span
            style={{ color: 'rgba(243,241,236,0.5)', display: 'flex', justifyContent: 'center' }}
          >
            ›
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span className="sy-mono" style={{ ...kicker, color: '#FFB79A' }}>
              TARGET{paced && targetKg == null ? ' · SUGGESTED' : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {paced ? (
                <IconButton
                  icon="minus"
                  label="Lower target weight"
                  size={30}
                  iconSize={14}
                  variant="outline"
                  onClick={() => step(-0.5)}
                />
              ) : null}
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                {targetTitle}
              </span>
              {paced ? (
                <IconButton
                  icon="plus"
                  label="Raise target weight"
                  size={30}
                  iconSize={14}
                  variant="outline"
                  onClick={() => step(0.5)}
                />
              ) : null}
            </span>
            <span style={sub}>
              {t.targetBodyFatPct != null ? `~${Math.round(t.targetBodyFatPct)}% fat · ` : ''}
              {targetSub}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[
            ['BODY FAT', `${t.bodyFatEstimated ? '~' : ''}${Math.round(t.bodyFatPct)}%`],
            ['LEAN MASS', `${t.leanKg.toFixed(1)} kg`],
            ['FFMI', t.ffmi.toFixed(1)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span className="sy-mono" style={{ ...kicker, fontSize: 9.5 }}>
                {k}
              </span>
              <span style={{ fontSize: 15, fontWeight: 300 }}>{v}</span>
            </div>
          ))}
        </div>
        {t.bodyFatEstimated ? (
          <Link
            href="/onboarding/body/?edit=1"
            style={{ fontSize: 11.5, color: '#FFC7B0', lineHeight: 1.4 }}
          >
            Body fat is estimated from BMI and runs high for muscular people. Add a measured value ›
          </Link>
        ) : null}
      </section>
      <div
        role="radiogroup"
        aria-label="Target physique"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}
      >
        {ORDER.map((k) => {
          const on = k === type
          const g = GOAL_INFO[k]
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(k)}
              style={{
                height: 84,
                borderRadius: 24,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                textAlign: 'left',
                font: 'inherit',
                cursor: 'pointer',
                color: '#F3F1EC',
                background: on ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.035)',
                border: `1px solid ${on ? 'rgba(255,199,176,0.55)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'background 300ms, border-color 300ms',
              }}
            >
              <Dot color={g.dot} size={8} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {g.name}
                </span>
                <span style={{ fontSize: 11.5, opacity: 0.66 }}>{g.sub}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '56px minmax(0,1fr)',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span className="sy-mono" style={kicker}>
            PACE
          </span>
          <Segmented
            label="Pace"
            fill
            fontSize={13}
            disabled={!paced}
            value={pace}
            onChange={setPace}
            options={[
              { value: 'gentle', label: 'Gentle' },
              { value: 'steady', label: 'Steady' },
              { value: 'faster', label: 'Faster' },
            ]}
          />
        </div>
        <span className="sy-mono" style={{ ...kicker, fontSize: 10, textAlign: 'center' }}>
          {paceLine(t)}
        </span>
      </div>
      {paced || S.bodyweight.length > 1 ? <Projection t={t} now={nowKg} /> : null}
      <section
        aria-label="Daily targets"
        className="sy-glass"
        style={{
          borderRadius: 32,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -60,
            top: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,61,0.25), rgba(255,107,61,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              flex: 1,
              minWidth: 0,
              containerType: 'inline-size',
            }}
          >
            <span className="sy-mono" style={{ ...kicker, color: 'rgba(243,241,236,0.55)' }}>
              TRAINING DAY
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="sy-dot"
                style={{ fontSize: fitDot(fmt(t.kcalTraining), 50, 0.78), lineHeight: 0.95 }}
              >
                {fmt(t.kcalTraining)}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(243,241,236,0.62)' }}>kcal</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span className="sy-mono" style={{ ...kicker, color: 'rgba(243,241,236,0.55)' }}>
              REST DAY
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 300,
                letterSpacing: '-0.03em',
                whiteSpace: 'nowrap',
              }}
            >
              {fmt(t.kcalRest)} kcal
            </span>
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
            gap: 8,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[
            ['Protein', `${t.protein} g`, '#A9C3A0'],
            ['Carbs', `${t.carbsTraining} g`, '#FFC7B0'],
            ['Fat', `${t.fat} g`, '#FF8A5C'],
            ['Water', `${(t.waterMl / 1000).toFixed(1)} L`, '#9CC7E0'],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  color: 'rgba(243,241,236,0.62)',
                }}
              >
                <Dot color={c} />
                {k}
              </span>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
        <Callout
          style={{
            background: 'transparent',
            padding: 0,
            fontSize: 12,
            color: 'rgba(243,241,236,0.66)',
          }}
        >
          {maintenanceNote(t)}
          {t.deltaKcal
            ? ` Your goal ${t.deltaKcal < 0 ? 'takes' : 'adds'} ${fmt(Math.abs(t.deltaKcal))} kcal a day.`
            : ''}
          {t.floored
            ? ` Calories are held at your resting energy (${fmt(t.kcalRest)} kcal) for safety, so the real pace is ${Math.abs(t.rateKgPerWeek).toFixed(2)} kg a week.`
            : ''}
        </Callout>
        <span className="sy-mono" style={{ ...kicker, fontSize: 9.5, lineHeight: 1.5 }}>
          PROTEIN {type === 'cut' || type === 'recomp' ? '2.6' : '2.2'} G / KG LEAN MASS · RATES:
          HELMS 2014, ARAGON · 7,700 KCAL / KG
        </span>
      </section>
      <div style={{ height: 90 }} />
      <BottomBar>
        <PillButton icon="check" block onClick={save}>
          Save targets
        </PillButton>
      </BottomBar>
    </Screen>
  )
}

/** Today's trend weight (falls back to the profile weight before any weigh-in). */
function weightNow(profileKg: number, entries: { d: string; w: number }[]): number {
  const tr = weightTrend(entries)
  return tr.length ? Math.round(tr[tr.length - 1].ema * 10) / 10 : profileKg
}
