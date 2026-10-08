'use client'

import { PillButton, Segmented } from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { EQUIPMENT_OPTIONS, FOCUS_MUSCLES, GYM_PRESETS, INJURIES } from '@/lib/plan'
import { tap } from '@/platform/haptics'
import { useProfile, useTraining } from '@/stores'
import type { Cardio, Experience, TrainingGoal } from '@/stores/profile'
import { ChipToggle, Kick, OptionCard, StepIntro, toggle } from './choices'
import { AuthPage, bottomClass, StepHeader } from './parts'

type Part = 'basics' | 'where' | 'limits' | 'plan'
const PARTS: Part[] = ['basics', 'where', 'limits', 'plan']

const GOALS: { value: TrainingGoal; title: string; sub: string }[] = [
  { value: 'muscle', title: 'Build muscle', sub: '6–12 reps, more volume' },
  { value: 'strength', title: 'Get stronger', sub: 'Heavier, 3–6 reps' },
  { value: 'fatloss', title: 'Lose fat', sub: 'Keep muscle, add cardio' },
  { value: 'general', title: 'Stay fit', sub: 'Balanced and healthy' },
]
const LEVELS: { value: Experience; title: string; sub: string }[] = [
  {
    value: 'new',
    title: 'New to lifting',
    sub: 'Under 6 months, or coming back after a long break',
  },
  { value: 'some', title: 'Some experience', sub: '6 months to 2 years of regular training' },
  { value: 'experienced', title: 'Experienced', sub: '2+ years, comfortable with the main lifts' },
]
const CARDIO: { value: Cardio; title: string; sub: string }[] = [
  { value: 'none', title: 'No cardio', sub: 'Lifting only' },
  { value: 'finishers', title: 'Short finishers', sub: '10 minutes after lifting' },
  { value: 'separate', title: 'Separate days', sub: 'Two 30-minute sessions a week' },
]
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
// Weekday numbers as the planner stores them: Monday 1 … Sunday 0.
const WD = [1, 2, 3, 4, 5, 6, 0]
const PRESET_ICON: Record<string, 'trophy' | 'dumbbell' | 'home' | 'pulse' | 'loop'> = {
  large: 'trophy',
  local: 'dumbbell',
  basic: 'dumbbell',
  garage: 'home',
  home: 'home',
  bodyweight: 'pulse',
  travel: 'loop',
}

/** Training setup (onboarding step 6, or Settings → Training setup with ?edit=1). */
export function TrainingSetupScreen() {
  const router = useRouter()
  const edit = useSearchParams().get('edit') === '1'
  const p = useProfile()
  const [part, setPart] = useState<Part>('basics')
  const [custom, setCustom] = useState(false)
  const [choice, setChoice] = useState<'auto' | 'own' | 'log'>('auto')
  const i = PARTS.indexOf(part)
  const days = p.trainingDaysPerWeek

  const back = () => (i === 0 ? router.back() : setPart(PARTS[i - 1]))
  const pickPreset = (id: string) => {
    const preset = GYM_PRESETS.find((g) => g.id === id)
    if (preset) p.set({ gymType: id, equipment: [...preset.equipment] })
  }

  const finish = () => {
    p.set({ trainingDone: true })
    if (choice === 'auto') return router.push(`/plan/preview/${edit ? '' : '?onboarding=1'}`)
    p.set({ onboarded: true })
    if (choice === 'own') useTraining.getState().ensurePlan()
    router.replace(choice === 'own' ? '/plan/' : '/')
  }
  const next = () => {
    tap()
    if (part === 'where' && !p.gymType) pickPreset('local')
    if (i < PARTS.length - 1) {
      setPart(PARTS[i + 1])
      window.scrollTo({ top: 0 })
    } else finish()
  }

  const eqOn = (values: string[]) => values.every((v) => p.equipment.includes(v))
  const eqToggle = (values: string[]) =>
    p.set({
      gymType: 'custom',
      equipment: eqOn(values)
        ? p.equipment.filter((v) => !values.includes(v))
        : [...new Set([...p.equipment, ...values])],
    })

  return (
    <AuthPage>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <StepHeader step={edit ? 0 : part === 'plan' ? 7 : 6} />
        <div
          aria-hidden="true"
          style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: -2 }}
        >
          {PARTS.map((x, k) => (
            <span
              key={x}
              style={{
                width: k === i ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: k <= i ? '#FFB79A' : 'rgba(255,255,255,0.14)',
                transition: 'width 300ms var(--sy-ease), background 300ms',
              }}
            />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={part}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}
        >
          {part === 'basics' ? (
            <>
              <StepIntro
                title="Your training"
                lede="Four quick answers and Syntropy builds a plan around your week."
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Kick>MAIN FOCUS</Kick>
                <div
                  role="radiogroup"
                  aria-label="Main focus"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                    gap: 10,
                  }}
                >
                  {GOALS.map((g) => (
                    <OptionCard
                      key={g.value}
                      on={p.trainingGoal === g.value}
                      title={g.title}
                      sub={g.sub}
                      onClick={() => p.set({ trainingGoal: g.value })}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Kick>EXPERIENCE</Kick>
                <div
                  role="radiogroup"
                  aria-label="Experience"
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {LEVELS.map((l) => (
                    <OptionCard
                      key={l.value}
                      on={p.experience === l.value}
                      title={l.title}
                      sub={l.sub}
                      minHeight={64}
                      onClick={() => p.set({ experience: l.value })}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Kick>DAYS A WEEK</Kick>
                <Segmented
                  label="Days a week"
                  fill
                  value={String(days)}
                  onChange={(v) =>
                    p.set({
                      trainingDaysPerWeek: Number(v),
                      preferredDays: p.preferredDays.slice(0, Number(v)),
                    })
                  }
                  options={['2', '3', '4', '5', '6'].map((v) => ({ value: v, label: v }))}
                />
                <div
                  role="group"
                  aria-label="Preferred days"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}
                >
                  {DAYS.map((d, k) => {
                    const on = p.preferredDays.includes(WD[k])
                    return (
                      <button
                        key={WD[k]}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        aria-label={
                          [
                            'Monday',
                            'Tuesday',
                            'Wednesday',
                            'Thursday',
                            'Friday',
                            'Saturday',
                            'Sunday',
                          ][k]
                        }
                        onClick={() =>
                          p.set({ preferredDays: toggle(p.preferredDays, WD[k], days) })
                        }
                        style={{
                          height: 44,
                          borderRadius: 14,
                          font: 'inherit',
                          fontSize: 13,
                          cursor: 'pointer',
                          color: on ? '#0B0F0D' : 'rgba(243,241,236,0.8)',
                          background: on ? '#F3F1EC' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${on ? '#F3F1EC' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
                <span style={{ fontSize: 11.5, color: 'rgba(243,241,236,0.5)' }}>
                  {p.preferredDays.length
                    ? `${p.preferredDays.length} of ${days} days picked`
                    : 'Optional: pick your days, or we spread them with rest in between.'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Kick>TIME PER SESSION</Kick>
                <Segmented
                  label="Time per session"
                  fill
                  padding={6}
                  value={String(p.sessionMin)}
                  onChange={(v) => p.set({ sessionMin: Number(v) })}
                  options={['30', '45', '60', '75', '90'].map((v) => ({
                    value: v,
                    label: `${v}m`,
                  }))}
                />
              </div>
            </>
          ) : null}

          {part === 'where' ? (
            <>
              <StepIntro
                title="Where you train"
                lede="Plans only use what you have. You can switch gyms any time."
              />
              <div
                role="radiogroup"
                aria-label="Where you train"
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {GYM_PRESETS.map((g) => (
                  <OptionCard
                    key={g.id}
                    on={p.gymType === g.id}
                    title={g.label}
                    sub={g.sub}
                    icon={PRESET_ICON[g.id] ?? 'dumbbell'}
                    minHeight={64}
                    onClick={() => pickPreset(g.id)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCustom(!custom)}
                aria-expanded={custom}
                style={{
                  alignSelf: 'flex-start',
                  minHeight: 44,
                  font: 'inherit',
                  fontSize: 13.5,
                  background: 'none',
                  border: 0,
                  padding: 0,
                  color: '#FFC7B0',
                  cursor: 'pointer',
                }}
              >
                {custom ? 'Hide equipment list' : 'Fine-tune the equipment list ›'}
              </button>
              {custom ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EQUIPMENT_OPTIONS.map((o) => {
                    const values = Array.isArray(o.value) ? o.value : [o.value]
                    return (
                      <ChipToggle key={o.label} on={eqOn(values)} onClick={() => eqToggle(values)}>
                        {o.label}
                      </ChipToggle>
                    )
                  })}
                </div>
              ) : null}
            </>
          ) : null}

          {part === 'limits' ? (
            <>
              <StepIntro
                title="Anything to work around?"
                lede="All optional. Focus muscles get extra sets; injuries skip risky moves."
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Kick>FOCUS · UP TO 3</Kick>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {FOCUS_MUSCLES.map((m) => (
                    <ChipToggle
                      key={m.id}
                      on={p.focus.includes(m.id)}
                      onClick={() => p.set({ focus: toggle(p.focus, m.id, 3) })}
                    >
                      {m.label}
                    </ChipToggle>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Kick>PAIN OR INJURIES</Kick>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INJURIES.map((m) => (
                    <ChipToggle
                      key={m.id}
                      on={p.injuries.includes(m.id)}
                      onClick={() => p.set({ injuries: toggle(p.injuries, m.id) })}
                    >
                      {m.label}
                    </ChipToggle>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Kick>CARDIO</Kick>
                <div
                  role="radiogroup"
                  aria-label="Cardio"
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {CARDIO.map((c) => (
                    <OptionCard
                      key={c.value}
                      on={p.cardio === c.value}
                      title={c.title}
                      sub={c.sub}
                      minHeight={60}
                      onClick={() => p.set({ cardio: c.value })}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {part === 'plan' ? (
            <>
              <StepIntro
                title="Your plan"
                lede="Let Syntropy build one from your answers, or bring your own."
              />
              <div
                role="radiogroup"
                aria-label="Plan"
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <OptionCard
                  on={choice === 'auto'}
                  icon="sparkle"
                  title="Make my plan"
                  sub={`A ${days}-day plan for ${GYM_PRESETS.find((g) => g.id === p.gymType)?.label.toLowerCase() ?? 'your gym'}, ${p.sessionMin} min each. Preview and edit it before saving.`}
                  minHeight={84}
                  onClick={() => setChoice('auto')}
                />
                <OptionCard
                  on={choice === 'own'}
                  icon="pencil"
                  title="I'll build my own"
                  sub="Start from a classic template and change anything in Plan."
                  minHeight={76}
                  onClick={() => setChoice('own')}
                />
                <OptionCard
                  on={choice === 'log'}
                  icon="list"
                  title="Just let me log"
                  sub="No plan. Log any workout as you go."
                  minHeight={76}
                  onClick={() => setChoice('log')}
                />
              </div>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
      <div
        className={bottomClass}
        style={{ paddingTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <PillButton variant="ghost" icon="chevronLeft" onClick={back} style={{ flexShrink: 0 }}>
          Back
        </PillButton>
        <div style={{ flex: 1 }}>
          <PillButton
            icon={part === 'plan' ? 'sparkle' : 'chevronRight'}
            iconAfter={part !== 'plan'}
            lifted
            block
            onClick={next}
          >
            {part === 'plan' ? (choice === 'auto' ? 'Build my plan' : 'Finish') : 'Continue'}
          </PillButton>
        </div>
      </div>
    </AuthPage>
  )
}
