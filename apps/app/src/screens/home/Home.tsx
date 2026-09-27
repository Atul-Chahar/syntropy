'use client'

import { carbBoost } from '@syntropy/nutrition'
import {
  Callout,
  Gauge,
  GlassCard,
  Icon,
  IconButton,
  MacroRow,
  MetricNumber,
  Screen,
  SegmentBar,
  Segmented,
} from '@syntropy/ui'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { addDays, fmt, greeting, kickerDate, today } from '@/lib/dates'
import { primaryMusclesOf, readinessOf, useToday, windowAverages } from '@/lib/summary'
import { firstName, initials, useGoal, useNutrition, useProfile, useTraining } from '@/stores'

type Range = 'today' | 'd7' | 'd30' | 'd90'

export function HomeScreen() {
  const name = useProfile((p) => p.name)
  const S = useTraining((s) => s.S)
  const meals = useNutrition((s) => s.meals)
  const checkins = useGoal((g) => g.checkins)
  const pending =
    checkins.find((c) => c.status === 'pending') ??
    (new Date().getDay() === 0 && !checkins.some((c) => c.date === today())
      ? { headline: 'Review the week and adjust your targets' }
      : undefined)
  const t = useToday()
  const [range, setRange] = useState<Range>('today')

  const readiness = useMemo(() => readinessOf(S), [S])

  const view = useMemo(() => {
    if (range === 'today') {
      const net = t.eaten.kcal - t.out.total
      const left = Math.max(0, t.dt.kcal - t.eaten.kcal)
      return {
        net,
        label: 'kcal net balance',
        inV: fmt(Math.round(t.eaten.kcal)),
        outV: fmt(t.out.total),
        inSub: `${t.meals.length} ${t.meals.length === 1 ? 'meal' : 'meals'} · ${fmt(Math.round(left))} kcal left`,
        outSub: `BMR ${fmt(t.out.bmr)} + ${fmt(t.out.daily + t.out.training)} active`,
      }
    }
    const days = range === 'd7' ? 7 : range === 'd30' ? 30 : 90
    const w = windowAverages(S, meals, t.body, days)
    return {
      net: w.avgIn - w.avgOut,
      label: 'avg kcal / day',
      inV: fmt(Math.round(w.avgIn)),
      outV: fmt(Math.round(w.avgOut)),
      inSub: `daily average · ${w.logged} days logged`,
      outSub: 'daily average',
    }
  }, [range, t, S, meals])

  // Training-adjusted carbs: a heavy lower-body session yesterday raises today's carb target.
  const boost = useMemo(() => {
    const y = S.workouts.filter((w) => w.d === addDays(today(), -1))
    const vol = y.reduce((a, w) => a + (w.vol ?? 0), 0)
    const legs = y.some((w) =>
      w.entries.some((e) =>
        primaryMusclesOf(e.id).some((m) => ['quadriceps', 'hamstring', 'gluteal'].includes(m)),
      ),
    )
    return carbBoost(vol, legs)
  }, [S])

  const carbTarget = t.dt.carbs + boost
  const left = Math.max(0, t.dt.kcal - t.eaten.kcal)
  const proteinLeft = Math.max(0, t.dt.protein - t.eaten.protein)
  const insight = boost
    ? `Heavy leg session yesterday. Carbohydrate target raised by ${boost} g to support recovery.`
    : t.training
      ? `Training day: ${fmt(t.dt.kcal)} kcal target. ${proteinLeft > 5 ? `${Math.round(proteinLeft)} g protein to go — a katori of paneer bhurji covers 16 g.` : 'Protein is covered. Nicely done.'}`
      : `Rest day: a little lower on carbs. ${proteinLeft > 5 ? `${Math.round(proteinLeft)} g protein still to go.` : 'Protein is covered.'}`

  return (
    <Screen tabBar>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            className="sy-mono"
            style={{ fontSize: 11, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
          >
            {kickerDate()}
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 400, letterSpacing: '-0.035em' }}>
            {greeting()}, {firstName(name)}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton icon="sparkle" label="Coach" href="/coach/" style={{ color: '#FFC7B0' }} />
          <Link
            href="/settings/"
            aria-label="Profile and settings"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'linear-gradient(145deg, #2A332E, #171C19)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {initials(name)}
          </Link>
        </div>
      </header>

      <Segmented
        label="Time range"
        value={range}
        onChange={setRange}
        options={[
          { value: 'today', label: 'Today' },
          { value: 'd7', label: '7D' },
          { value: 'd30', label: '30D' },
          { value: 'd90', label: '90D' },
        ]}
      />

      {pending ? (
        <GlassCard
          href="/coach/checkin/"
          radius={22}
          padding="12px 14px"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderColor: 'rgba(255,199,176,0.3)',
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--sy-fab)',
              color: '#1A0E08',
            }}
          >
            <Icon name="sparkle" size={18} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>Your weekly check-in is ready</span>
            <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>{pending.headline}</span>
          </span>
          <Icon name="chevronRight" size={18} style={{ color: 'rgba(243,241,236,0.5)' }} />
        </GlassCard>
      ) : null}

      <GlassCard as="section" aria-label="Energy balance" padding="20px 20px 18px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: 'rgba(243,241,236,0.72)',
            }}
          >
            <Icon name="sparkle" size={14} style={{ color: '#FFC7B0' }} />
            <span>Homeostasis</span>
          </div>
          <IconButton
            icon="arrowUpRight"
            label="Open trends"
            href="/progress/"
            size={32}
            iconSize={15}
            variant="outline"
            style={{ color: 'rgba(243,241,236,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}
          />
        </div>
        <Gauge net={view.net} label={view.label} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
            marginTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 14,
          }}
        >
          <Link
            href="/food/"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingRight: 12,
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'rgba(243,241,236,0.62)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 4, background: '#A9C3A0' }} />
              Energy in
            </div>
            <div style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.03em' }}>
              {view.inV}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(243,241,236,0.5)' }}>{view.inSub}</div>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'rgba(243,241,236,0.62)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 4, background: '#FF6B3D' }} />
              Energy out
            </div>
            <div style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.03em' }}>
              {view.outV}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(243,241,236,0.5)' }}>{view.outSub}</div>
          </div>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
        <Tile href="/recovery/" label="Readiness" value={readiness} unit="/100">
          <SegmentBar segments={10} filled={Math.round(readiness / 10)} color="#A9C3A0" />
        </Tile>
        <Tile href="/food/" label="Fuel left" value={Math.round(left)} unit="kcal">
          <SegmentBar
            segments={7}
            filled={Math.max(
              0,
              Math.min(7, Math.round((t.eaten.kcal / Math.max(1, t.dt.kcal)) * 7)),
            )}
            color="#FFC7B0"
            from={0.5}
          />
        </Tile>
        <Tile
          href="/food/"
          label="Water"
          value={t.water / 1000}
          decimals={2}
          unit={`/${(t.dt.waterMl / 1000).toFixed(1)} L`}
        >
          <SegmentBar
            segments={7}
            filled={Math.min(7, Math.round((t.water / Math.max(1, t.dt.waterMl)) * 7))}
            color="#9CC7E0"
            from={0.5}
            step={0.1}
          />
        </Tile>
      </div>

      <GlassCard
        as="section"
        aria-label="Fuel today"
        radius={28}
        padding={18}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/food/" style={{ fontSize: 15, fontWeight: 500 }}>
            Fuel today
          </Link>
          <div className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.5)' }}>
            {boost || t.training ? 'ADJUSTED FOR TRAINING' : 'REST DAY'}
          </div>
        </div>
        <MacroRow name="Protein" value={t.eaten.protein} target={t.dt.protein} color="#A9C3A0" />
        <MacroRow name="Carbohydrates" value={t.eaten.carbs} target={carbTarget} color="#FFC7B0" />
        <Callout>{insight}</Callout>
        <MacroRow name="Fat" value={t.eaten.fat} target={t.dt.fat} color="#FF8A5C" />
      </GlassCard>
    </Screen>
  )
}

function Tile({
  href,
  label,
  value,
  unit,
  decimals = 0,
  children,
}: {
  href: string
  label: string
  value: number
  unit: string
  decimals?: number
  children: React.ReactNode
}) {
  return (
    <GlassCard
      href={href}
      radius={24}
      padding="14px 12px"
      style={{ display: 'flex', flexDirection: 'column', gap: 9, height: 118 }}
    >
      <div style={{ fontSize: 12, color: 'rgba(243,241,236,0.66)' }}>{label}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          columnGap: 3,
          minWidth: 0,
        }}
      >
        <MetricNumber value={value} size={30} decimals={decimals} />
        <span style={{ fontSize: 11, color: 'rgba(243,241,236,0.5)' }}>{unit}</span>
      </div>
      <div style={{ marginTop: 'auto' }}>{children}</div>
    </GlassCard>
  )
}
