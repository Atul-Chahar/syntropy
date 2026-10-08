'use client'

import { type RefineChange, refinePlan } from '@syntropy/ai'
import {
  BottomSheet,
  GlassCard,
  Icon,
  IconButton,
  PillButton,
  Screen,
  Tag,
  TextField,
} from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { BottomBar, Header } from '@/components/BottomBar'
import { ExerciseMedia } from '@/components/ExerciseMedia'
import { aiToast, gemini, withAi } from '@/lib/ai'
import { EX, exTitle } from '@/lib/ex'
import {
  alternatives,
  catalogueEq,
  estimateMinutes,
  type GeneratedPlan,
  GYM_PRESETS,
  generatePlan,
  type PlanInput,
} from '@/lib/plan'
import { success, tap } from '@/platform/haptics'
import { toast, useProfile, useSettings, useTraining } from '@/stores'

const DAYN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const WEEK = [1, 2, 3, 4, 5, 6, 0]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
type PlanEx = GeneratedPlan['routines'][number]['ex'][number]

function repsLabel(e: PlanEx) {
  if (e.mode === 'cardio') return `${e.min ?? 10} min`
  if (e.mode === 'time') return `${e.sets} × ${e.sec ?? 30} s`
  const min = e.repsMin
  return min && min < e.reps ? `${e.sets} × ${min}–${e.reps}` : `${e.sets} × ${e.reps}`
}

/** The plan Syntropy generated from the training setup: preview, swap, refine, save. */
export function PlanPreviewScreen() {
  const router = useRouter()
  const onboarding = useSearchParams().get('onboarding') === '1'
  const p = useProfile()
  const hasPlan = useTraining((s) => s.S.routines.length > 0)
  const chatModel = useSettings((s) => s.models.chat)

  const input: PlanInput = useMemo(
    () => ({
      goal: p.trainingGoal,
      experience: p.experience,
      days: p.trainingDaysPerWeek,
      preferredDays: p.preferredDays.length === p.trainingDaysPerWeek ? p.preferredDays : undefined,
      sessionMin: p.sessionMin,
      equipment: p.equipment.length
        ? p.equipment
        : (GYM_PRESETS.find((g) => g.id === 'local')?.equipment ?? []),
      focus: p.focus,
      injuries: p.injuries,
      cardio: p.cardio,
    }),
    [p],
  )
  const [plan, setPlan] = useState<GeneratedPlan>(() => generatePlan(input))
  const [swap, setSwap] = useState<{ r: number; e: number } | null>(null)
  const [ask, setAsk] = useState('')
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState<{ summary: string; changes: RefineChange[] } | null>(null)
  const [keep, setKeep] = useState<boolean[]>([])

  const gym = GYM_PRESETS.find((g) => g.id === p.gymType)?.label ?? 'Custom equipment'
  const ordered = WEEK.flatMap((d) => {
    const rid = plan.week[String(d)]
    const r = plan.routines.findIndex((x) => x.id === rid)
    return r >= 0 ? [{ d, r }] : []
  })

  const replace = (r: number, e: number, patch: Partial<PlanEx>) =>
    setPlan((pl) => ({
      ...pl,
      routines: pl.routines.map((rt, i) =>
        i !== r ? rt : { ...rt, ex: rt.ex.map((x, j) => (j === e ? { ...x, ...patch } : x)) },
      ),
    }))

  const askCoach = async () => {
    setBusy(true)
    const res = await withAi(() =>
      refinePlan(gemini, chatModel, {
        request: ask.trim() || 'Review this plan for me.',
        profile: {
          goal: input.goal,
          experience: input.experience,
          daysPerWeek: input.days,
          sessionMin: input.sessionMin,
          gym,
          focus: input.focus,
          injuries: input.injuries,
          cardio: input.cardio,
          sex: p.sex,
          age: p.age,
        },
        routines: plan.routines.map((rt) => ({
          id: rt.id,
          name: rt.name,
          exercises: rt.ex.map((x) => ({
            id: x.id,
            name: exTitle(x.id),
            sets: x.sets,
            reps: x.reps,
            options: alternatives(x.id, input, 6).map((id) => ({ id, name: exTitle(id) })),
          })),
        })),
      }),
    )
    setBusy(false)
    if (!res.ok) return aiToast(res.message)
    setReview(res.value)
    setKeep(res.value.changes.map(() => true))
    if (!res.value.changes.length) aiToast(res.value.summary || 'Coach is happy with this plan.')
  }

  const applyReview = () => {
    if (!review) return
    review.changes.forEach((c, k) => {
      if (!keep[k]) return
      const r = plan.routines.findIndex((x) => x.id === c.routine)
      const e = plan.routines[r]?.ex.findIndex((x) => x.id === c.replace) ?? -1
      if (r < 0 || e < 0) return
      replace(r, e, {
        ...(c.with ? { id: c.with } : {}),
        ...(c.sets ? { sets: c.sets } : {}),
        ...(c.reps ? { reps: c.reps } : {}),
      })
    })
    setReview(null)
    success()
    toast('Coach changes applied')
  }

  const save = () => {
    const eq = input.equipment
    useTraining.getState().update((s) => {
      s.routines = plan.routines.map((rt) => ({
        id: rt.id,
        name: rt.name,
        emoji: rt.emoji,
        ex: rt.ex.map((x) => {
          const min = (x as { repsMin?: number }).repsMin
          return {
            id: x.id,
            sets: x.sets,
            reps: x.reps,
            weight: 0,
            ...(x.mode ? { mode: x.mode } : {}),
            ...(x.sec ? { sec: x.sec } : {}),
            ...(x.min ? { min: x.min } : {}),
            ...(x.speed ? { speed: x.speed } : {}),
            ...(min && min < x.reps ? { repsMin: min, prog: 'double' } : {}),
          }
        }),
      }))
      s.week = { ...plan.week }
      // OpenGym's equipment profile, so Library and swaps follow the same gym.
      const S = s as typeof s & Record<string, unknown>
      S.equipProfiles = [{ id: 'syn-gym', name: gym, equipment: catalogueEq(eq) }]
      S.activeEquipId = 'syn-gym'
      S.equipFilterOn = true
    })
    if (onboarding) p.set({ onboarded: true })
    success()
    toast('Plan saved')
    router.replace(onboarding ? '/' : '/plan/')
  }

  const swapping = swap ? plan.routines[swap.r]?.ex[swap.e] : null

  return (
    <Screen
      orbs={[
        { tone: 'ember', strength: 0.34, right: -240, top: -140 },
        { tone: 'sage', strength: 0.36, size: 540, left: -260, bottom: -220 },
      ]}
      contentClassName="pb-cta"
    >
      <Header
        kicker={onboarding ? 'STEP 7 OF 7 · YOUR PLAN' : 'NEW PLAN'}
        title={plan.name}
        right={
          onboarding ? undefined : (
            <IconButton icon="close" label="Close" onClick={() => router.back()} />
          )
        }
      />

      <GlassCard
        as="section"
        aria-label="Plan summary"
        radius={26}
        padding="14px 16px"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'rgba(243,241,236,0.78)' }}>
          {plan.summary}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Tag tone="peach">{plan.split}</Tag>
          <Tag>{input.days} days</Tag>
          <Tag>{input.sessionMin} min</Tag>
          <Tag>{gym}</Tag>
        </div>
        <div
          role="list"
          aria-label="Week"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}
        >
          {WEEK.map((d) => {
            const rt = plan.routines.find((x) => x.id === plan.week[String(d)])
            return (
              <div
                key={d}
                role="listitem"
                style={{
                  height: 52,
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  background: rt ? 'rgba(255,107,61,0.14)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${rt ? 'rgba(255,183,154,0.35)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span
                  className="sy-mono"
                  style={{ fontSize: 9.5, color: 'rgba(243,241,236,0.55)' }}
                >
                  {DAYN[d].slice(0, 1)}
                </span>
                <span style={{ fontSize: rt?.emoji ? 15 : 10.5, color: 'rgba(243,241,236,0.6)' }}>
                  {rt ? (rt.emoji ?? '●') : 'rest'}
                </span>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {ordered.map(({ d, r }) => {
        const rt = plan.routines[r]
        return (
          <GlassCard
            key={`${d}-${rt.id}`}
            as="section"
            aria-label={rt.name}
            radius={26}
            padding="14px 12px 8px 16px"
            style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 4 }}>
              <span
                className="sy-mono"
                style={{ fontSize: 10.5, letterSpacing: '0.06em', color: '#FFB79A' }}
              >
                {DAYN[d]} · ~{estimateMinutes(rt)} MIN
              </span>
              <span style={{ fontSize: 19, fontWeight: 400, letterSpacing: '-0.02em' }}>
                {rt.emoji ? `${rt.emoji} ` : ''}
                {rt.name}
              </span>
              {rt.why ? (
                <span style={{ fontSize: 12, lineHeight: 1.45, color: 'rgba(243,241,236,0.6)' }}>
                  {rt.why}
                </span>
              ) : null}
            </div>
            {rt.ex.map((x, e) => (
              <div
                key={`${x.id}-${e}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px minmax(0,1fr) 44px',
                  alignItems: 'center',
                  gap: 12,
                  padding: '6px 0',
                  borderTop: e ? '1px solid rgba(255,255,255,0.06)' : undefined,
                }}
              >
                <ExerciseMedia exId={x.id} size={52} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 14,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {exTitle(x.id)}
                  </span>
                  <span
                    className="sy-mono"
                    style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}
                  >
                    {repsLabel(x)} · {cap(EX[x.id]?.eq ?? '')}
                  </span>
                </span>
                <IconButton
                  icon="loop"
                  label={`Swap ${exTitle(x.id)}`}
                  variant="plain"
                  iconSize={17}
                  onClick={() => {
                    tap()
                    setSwap({ r, e })
                  }}
                />
              </div>
            ))}
          </GlassCard>
        )
      })}

      <GlassCard
        as="section"
        aria-label="Ask Coach"
        radius={26}
        padding="14px 16px"
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
          <Icon name="sparkle" size={16} /> Ask Coach to refine
        </span>
        <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)', lineHeight: 1.45 }}>
          Gemini reviews the plan and suggests swaps from exercises your gym has. You approve each
          change.
        </span>
        <TextField
          label="What should Coach change? (optional)"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="e.g. more glutes, no barbell squats"
        />
        <PillButton variant="ghost" icon="sparkle" onClick={askCoach} disabled={busy}>
          {busy ? 'Coach is reviewing…' : 'Review with Coach'}
        </PillButton>
      </GlassCard>

      <div style={{ height: 90 }} />
      <BottomBar>
        <PillButton icon="check" block lifted onClick={save}>
          {hasPlan && !onboarding ? 'Replace my plan' : 'Save plan'}
        </PillButton>
      </BottomBar>

      <BottomSheet
        open={!!swapping}
        onClose={() => setSwap(null)}
        title={swapping ? `Swap ${exTitle(swapping.id)}` : 'Swap'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {swapping
            ? alternatives(swapping.id, input, 10).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (swap) replace(swap.r, swap.e, { id })
                    setSwap(null)
                    success()
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px minmax(0,1fr)',
                    alignItems: 'center',
                    gap: 12,
                    padding: '6px 4px',
                    font: 'inherit',
                    color: '#F3F1EC',
                    background: 'none',
                    border: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <ExerciseMedia exId={id} size={48} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14 }}>{exTitle(id)}</span>
                    <span style={{ fontSize: 11.5, color: 'rgba(243,241,236,0.55)' }}>
                      {cap(EX[id]?.eq ?? '')}
                    </span>
                  </span>
                </button>
              ))
            : null}
        </div>
      </BottomSheet>

      <BottomSheet open={!!review} onClose={() => setReview(null)} title="Coach suggests">
        {review ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: 'rgba(243,241,236,0.75)',
              }}
            >
              {review.summary}
            </p>
            {review.changes.map((c, k) => {
              const rt = plan.routines.find((x) => x.id === c.routine)
              return (
                <button
                  key={`${c.routine}-${c.replace}-${k}`}
                  type="button"
                  role="checkbox"
                  aria-checked={keep[k]}
                  onClick={() => setKeep((ks) => ks.map((v, j) => (j === k ? !v : v)))}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: 18,
                    font: 'inherit',
                    textAlign: 'left',
                    color: '#F3F1EC',
                    cursor: 'pointer',
                    background: keep[k] ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${keep[k] ? 'rgba(255,199,176,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <Icon name={keep[k] ? 'check' : 'close'} size={16} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 13.5 }}>
                      {rt?.name}: {exTitle(c.replace)}
                      {c.with ? ` → ${exTitle(c.with)}` : ''}
                      {c.sets || c.reps ? ` (${c.sets ?? '·'} × ${c.reps ?? '·'})` : ''}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>{c.why}</span>
                  </span>
                </button>
              )
            })}
            {review.changes.length ? (
              <PillButton icon="check" block onClick={applyReview}>
                Apply {keep.filter(Boolean).length} change
                {keep.filter(Boolean).length === 1 ? '' : 's'}
              </PillButton>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>
    </Screen>
  )
}
