'use client'

import { ACTIVITY_LABEL, type Activity, bmr } from '@syntropy/nutrition'
import { Callout, PillButton, Segmented, Switch, TileStepper } from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProfile, useTraining } from '@/stores'
import { AuthPage, bottomClass, StepHeader } from './parts'

const ACTS: Activity[] = ['sedentary', 'light', 'moderate', 'active']
const ACT_SUB: Record<Activity, string> = {
  sedentary: 'Desk job, little walking',
  light: '6–8k steps most days',
  moderate: 'Teaching, retail, lots of walking',
  active: 'Labour, delivery, sport',
}

/** Body profile (DESIGN_GAPS #1): the inputs Goal and energy maths need. */
export function BodyScreen() {
  const router = useRouter()
  const edit = useSearchParams().get('edit') === '1'
  const p = useProfile()
  const kcal = Math.round(bmr(p))
  const next = () => {
    p.set({ bodyDone: true })
    if (edit) return router.back()
    const S = useTraining.getState()
    if (!S.S.bodyweight.length) S.addWeighIn(p.weightKg)
    router.push('/goal/?onboarding=1')
  }
  return (
    <AuthPage>
      {edit ? (
        <StepHeader step={0} back="/settings/" />
      ) : (
        <StepHeader step={3} back="/signup/lock/" />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          marginTop: 26,
          paddingBottom: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.05,
              fontWeight: 300,
              letterSpacing: '-0.045em',
            }}
          >
            About your body
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'rgba(243,241,236,0.68)' }}>
            Used only on this phone to estimate what you burn and need.
          </p>
        </div>
        <Segmented
          label="Sex"
          fill
          value={p.sex}
          onChange={(sex) => p.set({ sex })}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
          <TileStepper
            kicker="AGE"
            label="Age"
            value={p.age}
            min={14}
            max={90}
            onChange={(age) => p.set({ age })}
            display={`${p.age}`}
          />
          <TileStepper
            kicker="HEIGHT · CM"
            label="Height"
            value={p.heightCm}
            min={130}
            max={220}
            onChange={(heightCm) => p.set({ heightCm })}
          />
          <TileStepper
            kicker="WEIGHT · KG"
            label="Weight"
            value={p.weightKg}
            min={35}
            max={200}
            step={0.5}
            onChange={(weightKg) => p.set({ weightKg })}
            display={p.weightKg.toFixed(1)}
          />
          <TileStepper
            kicker="TRAINING DAYS"
            label="Training days per week"
            value={p.trainingDaysPerWeek}
            min={0}
            max={7}
            onChange={(trainingDaysPerWeek) => p.set({ trainingDaysPerWeek })}
            display={`${p.trainingDaysPerWeek}/wk`}
          />
        </div>
        <div
          role="radiogroup"
          aria-label="Daily activity outside training"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}
        >
          {ACTS.map((a) => {
            const on = p.activity === a
            return (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => p.set({ activity: a })}
                style={{
                  minHeight: 72,
                  borderRadius: 22,
                  padding: '12px 14px',
                  textAlign: 'left',
                  font: 'inherit',
                  cursor: 'pointer',
                  color: '#F3F1EC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  background: on ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.035)',
                  border: `1px solid ${on ? 'rgba(255,199,176,0.55)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>{ACTIVITY_LABEL[a]}</span>
                <span style={{ fontSize: 11.5, opacity: 0.62 }}>{ACT_SUB[a]}</span>
              </button>
            )
          })}
        </div>
        <div
          className="sy-glass"
          style={{
            borderRadius: 22,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14.5, fontWeight: 500 }}>I know my body fat</span>
              <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.55)' }}>
                Optional, for body-fat targets
              </span>
            </span>
            <Switch
              label="I know my body fat"
              checked={p.bodyFatPct != null}
              onChange={(on) => p.set({ bodyFatPct: on ? 18 : null })}
            />
          </div>
          {p.bodyFatPct != null ? (
            <TileStepper
              kicker="BODY FAT · %"
              label="Body fat"
              value={p.bodyFatPct}
              min={4}
              max={50}
              onChange={(bodyFatPct) => p.set({ bodyFatPct })}
            />
          ) : null}
        </div>
        <Callout tone="sage">
          Resting burn is about {kcal.toLocaleString('en-IN')} kcal a day (Mifflin-St Jeor).
          Training adds to it on the days you lift.
        </Callout>
      </div>
      <div className={bottomClass} style={{ paddingTop: 20 }}>
        <PillButton
          icon={edit ? 'check' : 'chevronRight'}
          iconAfter={!edit}
          lifted
          block
          onClick={next}
        >
          {edit ? 'Save' : 'Set your target physique'}
        </PillButton>
      </div>
    </AuthPage>
  )
}
