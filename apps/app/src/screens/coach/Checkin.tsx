'use client'

import { explainCheckin } from '@syntropy/ai'
import {
  dayTotals,
  GOAL_INFO,
  plannedRateKgPerWeek,
  trendRate,
  weeklyAdjustment,
} from '@syntropy/nutrition'
import { Callout, CoachOrb, GlassCard, IconButton, PillButton, Screen } from '@syntropy/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { aiToast, gemini, withAi } from '@/lib/ai'
import { addDays, fmt, today } from '@/lib/dates'
import { primaryMusclesOf, useToday } from '@/lib/summary'
import { muscleName } from '@/lib/training'
import { success } from '@/platform/haptics'
import { toast, useGoal, useNutrition, useSettings, useTraining } from '@/stores'
import type { Checkin } from '@/stores/goal'

/** Weekly check-in (DESIGN_GAPS #14): code decides the change, Coach explains it. */
/** Check-in copy once maintenance is measured: targets self-correct, so explain the gap. */
function measuredBody(
  observed: number | null,
  planned: number,
  avgKcal: number,
  target: number,
  maintenance: number,
): string {
  const head = `Maintenance is now measured from your own logs (about ${fmt(maintenance)} kcal), so daily targets adjust by themselves.`
  if (observed == null) return `${head} Weigh in a few times this week to keep the trend fresh.`
  const trend = `Your trend moved ${observed.toFixed(2)} kg a week against a plan of ${planned.toFixed(2)}.`
  const diff = observed - planned
  if (Math.abs(diff) < 0.1) return `${trend} That is on pace. ${head}`
  const slower = planned < 0 ? observed > planned : observed < planned
  if (slower)
    return `${trend} ${head} You averaged ${fmt(Math.round(avgKcal))} kcal against a ${fmt(target)} target; eating closer to it closes the gap.`
  return `${trend} Faster than plan. ${head} Eat your full target to protect muscle.`
}

export function CheckinScreen() {
  const router = useRouter()
  const goal = useGoal()
  const S = useTraining((s) => s.S)
  const meals = useNutrition((s) => s.meals)
  const model = useSettings((s) => s.models.chat)
  const t = useToday()
  const [busy, setBusy] = useState(false)

  const summary = useMemo(() => {
    const observed = trendRate(S.bodyweight, 14)
    const planned = plannedRateKgPerWeek(goal.type, goal.pace, t.body.weightKg)
    // Once maintenance is measured from the logs, targets already follow the trend.
    const adj =
      observed == null || t.targets.maintenanceSource !== 'formula'
        ? { kcal: 0, reason: 'on-track' as const }
        : weeklyAdjustment(observed, planned)
    const days = Array.from({ length: 7 }, (_, i) => addDays(today(), -i - 1))
    const logged = days
      .map((d) => meals.filter((m) => m.date === d))
      .filter((x) => x.length)
      .map(dayTotals)
    const avgKcal = logged.length ? logged.reduce((a, x) => a + x.kcal, 0) / logged.length : 0
    const avgProtein = logged.length ? logged.reduce((a, x) => a + x.protein, 0) / logged.length : 0
    const trainingDays = S.workouts.filter((w) => w.d > addDays(today(), -8)).length
    const sets: Record<string, number> = {}
    for (const w of S.workouts.filter((x) => x.d > addDays(today(), -8)))
      for (const e of w.entries)
        for (const m of primaryMusclesOf(e.id))
          sets[m] = (sets[m] ?? 0) + e.sets.filter((s) => s.done).length
    const ranked = Object.entries(sets).sort((a, b) => b[1] - a[1])
    return {
      observed,
      planned,
      adj,
      avgKcal,
      avgProtein,
      trainingDays,
      plannedDays: Object.keys(S.week).length,
      top: ranked.slice(0, 3).map(([m]) => muscleName(m)),
      low: ranked
        .filter(([, n]) => n < 10)
        .slice(-3)
        .map(([m]) => muscleName(m)),
      loggedDays: logged.length,
    }
  }, [S, meals, goal.type, goal.pace, t.body.weightKg, t.targets.maintenanceSource])

  const existing = goal.checkins.find((c) => c.date === today())
  const [c, setC] = useState<Checkin | null>(existing ?? null)

  useEffect(() => {
    if (existing) return
    const k = summary.adj.kcal
    const measured = t.targets.maintenanceSource !== 'formula'
    const local: Checkin = {
      id: `ci_${today()}`,
      date: today(),
      kcalChange: k,
      reason: summary.adj.reason,
      observedKgPerWeek: summary.observed,
      plannedKgPerWeek: summary.planned,
      headline: measured
        ? 'Targets follow your data'
        : k === 0
          ? 'Right on track — targets hold'
          : k > 0
            ? `Losing a little fast — +${k} kcal a day`
            : `Progress slowed — ${k} kcal a day`,
      body: measured
        ? measuredBody(
            summary.observed,
            summary.planned,
            summary.avgKcal,
            t.dt.kcal,
            t.targets.maintenanceKcal,
          )
        : summary.observed == null
          ? 'Log a few more weigh-ins this week and next Sunday’s check-in can read your trend.'
          : `Your trend moved ${summary.observed.toFixed(2)} kg a week against a plan of ${summary.planned.toFixed(2)}. ${k === 0 ? 'That is close enough, so nothing changes.' : 'A small, bounded change keeps the pace sustainable.'}`,
      tips: summary.low.length
        ? [`${summary.low.join(', ')} got fewer than 10 sets. Add a couple of sets next week.`]
        : [],
      status: 'pending',
    }
    goal.addCheckin(local)
    setC(local)
  }, [existing, summary, goal, t.targets, t.dt.kcal])

  const explain = async () => {
    if (!c) return
    setBusy(true)
    const r = await withAi(() =>
      explainCheckin(gemini, model, {
        goal: GOAL_INFO[goal.type].name,
        plannedKgPerWeek: summary.planned,
        observedKgPerWeek: summary.observed,
        kcalChange: c.kcalChange,
        reason: c.reason,
        avgKcal: Math.round(summary.avgKcal),
        targetKcal: t.dt.kcal,
        avgProtein: Math.round(summary.avgProtein),
        targetProtein: t.dt.protein,
        trainingDays: summary.trainingDays,
        plannedDays: summary.plannedDays,
        topMuscles: summary.top,
        lowMuscles: summary.low,
      }),
    )
    setBusy(false)
    if (!r.ok) return aiToast(r.message)
    const next = {
      ...c,
      headline: r.value.headline,
      body: r.value.body,
      tips: r.value.training_tips ?? c.tips,
    }
    goal.addCheckin(next)
    setC(next)
  }

  const resolve = (accept: boolean) => {
    if (!c) return
    goal.resolveCheckin(c.id, accept)
    success()
    toast(accept ? 'New targets from today' : 'Keeping your current targets')
    router.replace('/')
  }

  if (!c) return null
  const k = c.kcalChange
  return (
    <Screen
      orbs={[
        { tone: 'ember', strength: 0.32, right: -240, top: -120 },
        { tone: 'sage', strength: 0.4, left: -240, bottom: -200 },
      ]}
    >
      <ModalHeader
        left={<IconButton icon="close" label="Close" onClick={() => router.back()} />}
        title="Weekly check-in"
        sub="SUNDAY REVIEW"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <CoachOrb size={60} state={busy ? 'thinking' : 'idle'} glow={false} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
          >
            CALORIE TARGET
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              className="sy-dot"
              style={{ fontSize: 44, lineHeight: 1, color: k === 0 ? '#C9DCBF' : '#FFC7B0' }}
            >
              {k === 0 ? 'HOLD' : `${k > 0 ? '+' : '−'}${Math.abs(k)}`}
            </span>
            {k ? (
              <span style={{ fontSize: 13, color: 'rgba(243,241,236,0.6)' }}>kcal / day</span>
            ) : null}
          </span>
        </div>
      </div>
      <GlassCard padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.02em' }}>
          {c.headline}
        </span>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'rgba(243,241,236,0.78)' }}>
          {c.body}
        </p>
        {c.tips.map((tip) => (
          <Callout key={tip} tone="sage">
            {tip}
          </Callout>
        ))}
        <PillButton
          variant="peach"
          icon="sparkle"
          height={44}
          fontSize={13.5}
          onClick={explain}
          disabled={busy}
          style={{ alignSelf: 'flex-start' }}
        >
          {busy ? 'Coach is reading your week…' : 'Explain with Coach'}
        </PillButton>
      </GlassCard>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {[
          [
            'Trend',
            summary.observed == null ? '—' : summary.observed.toFixed(2),
            'kg / wk',
            `plan ${summary.planned.toFixed(2)}`,
          ],
          ['Training', String(summary.trainingDays), 'sessions', `plan ${summary.plannedDays}`],
          ['Energy in', fmt(Math.round(summary.avgKcal)), 'kcal avg', `target ${fmt(t.dt.kcal)}`],
          ['Protein', String(Math.round(summary.avgProtein)), 'g avg', `target ${t.dt.protein} g`],
        ].map(([a, v, u, sub]) => (
          <GlassCard
            key={a}
            radius={22}
            padding="12px 14px"
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.62)' }}>{a}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="sy-dot" style={{ fontSize: 24, lineHeight: 1 }}>
                {v}
              </span>
              <span style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.55)' }}>{u}</span>
            </span>
            <span className="sy-mono" style={{ fontSize: 10, color: 'rgba(243,241,236,0.45)' }}>
              {sub}
            </span>
          </GlassCard>
        ))}
      </div>
      {c.status === 'pending' ? (
        <div style={{ display: 'grid', gridTemplateColumns: k ? '1fr 1.4fr' : '1fr', gap: 10 }}>
          {k ? (
            <PillButton variant="glass" onClick={() => resolve(false)}>
              Keep current
            </PillButton>
          ) : null}
          <PillButton icon="check" onClick={() => resolve(true)}>
            {k ? `Apply ${k > 0 ? '+' : '−'}${Math.abs(k)} kcal` : 'Got it'}
          </PillButton>
        </div>
      ) : (
        <p
          style={{ margin: 0, textAlign: 'center', fontSize: 13, color: 'rgba(243,241,236,0.55)' }}
        >
          {c.status === 'accepted' ? 'Applied to your targets.' : 'You kept your current targets.'}
        </p>
      )}
      <p
        style={{ margin: 0, textAlign: 'center', fontSize: 11.5, color: 'rgba(243,241,236,0.45)' }}
      >
        {t.targets.maintenanceSource === 'formula'
          ? 'Targets move by at most 150 kcal a week.'
          : `Maintenance measured from ${t.targets.measuredDays} logged days.`}{' '}
        {summary.loggedDays} of 7 days logged.
      </p>
    </Screen>
  )
}
