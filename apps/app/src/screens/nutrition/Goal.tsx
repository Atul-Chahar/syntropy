'use client'

import { computeTargets, GOAL_INFO, type GoalType, type Pace } from '@syntropy/nutrition'
import { Callout, Dot, IconButton, PillButton, Screen, Segmented } from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { BottomBar, Header } from '@/components/BottomBar'
import { fmt } from '@/lib/dates'
import { bodyOf } from '@/lib/summary'
import { success } from '@/platform/haptics'
import { toast, useGoal, useProfile, useTraining } from '@/stores'

const ORDER: GoalType[] = ['cut', 'recomp', 'gain', 'maintain']

export function GoalScreen() {
  const router = useRouter()
  const onboarding = useSearchParams().get('onboarding') === '1'
  const profile = useProfile()
  const S = useTraining((s) => s.S)
  const goal = useGoal()
  const [type, setType] = useState<GoalType>(goal.type)
  const [pace, setPace] = useState<Pace>(goal.pace)
  const body = bodyOf(profile, S)
  const t = computeTargets(
    body,
    type,
    pace,
    type === goal.type && pace === goal.pace ? goal.adjustKcal : 0,
  )
  const paced = type === 'cut' || type === 'gain'

  let eta = 'Hold steady'
  if (t.weeks)
    eta = `${t.targetBodyFatPct != null ? `~${t.targetBodyFatPct}% · ` : ''}${t.weeks} weeks`

  const save = () => {
    goal.choose(type, pace)
    if (onboarding) {
      profile.set({ onboarded: true })
      useTraining.getState().ensurePlan()
    }
    success()
    toast('Targets saved')
    router.replace(onboarding ? '/' : '/food/')
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
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 30px minmax(0,1fr)',
          alignItems: 'center',
          gap: 6,
          padding: '14px 16px',
          borderRadius: 26,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
          >
            NOW
          </span>
          <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.03em' }}>
            {body.weightKg.toFixed(1)} kg
          </span>
          <span style={{ fontSize: 11.5, color: 'rgba(243,241,236,0.58)' }}>
            {profile.bodyFatPct ? `~${profile.bodyFatPct}% body fat` : `${profile.heightCm} cm`}
          </span>
        </div>
        <span style={{ color: 'rgba(243,241,236,0.5)', display: 'flex', justifyContent: 'center' }}>
          ›
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: '#FFB79A' }}
          >
            TARGET
          </span>
          <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.03em' }}>
            {t.targetWeightKg.toFixed(1)} kg
          </span>
          <span style={{ fontSize: 11.5, color: 'rgba(243,241,236,0.58)' }}>{eta}</span>
        </div>
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
              onClick={() => setType(k)}
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '56px minmax(0,1fr)',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <span
          className="sy-mono"
          style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
        >
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
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              className="sy-mono"
              style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
            >
              TRAINING DAY
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="sy-dot" style={{ fontSize: 50, lineHeight: 0.95 }}>
                {fmt(t.kcalTraining)}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(243,241,236,0.62)' }}>kcal</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span
              className="sy-mono"
              style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
            >
              REST DAY
            </span>
            <span style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.03em' }}>
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
              <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.03em' }}>{v}</span>
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
          Maintenance is about {fmt(t.maintenanceKcal)} kcal from your body and activity.
          Recalculated every Sunday from your weight trend and training load.
        </Callout>
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
