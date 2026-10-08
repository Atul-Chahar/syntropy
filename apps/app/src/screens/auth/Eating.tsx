'use client'

import { PillButton, Segmented } from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProfile } from '@/stores'
import type { Diet } from '@/stores/profile'
import { ChipToggle, Kick, OptionCard, StepIntro, toggle } from './choices'
import { AuthPage, bottomClass, StepHeader } from './parts'

const DIETS: { value: Diet; title: string; sub: string }[] = [
  { value: 'veg', title: 'Vegetarian', sub: 'Dairy yes, no eggs or meat' },
  { value: 'egg', title: 'Eggetarian', sub: 'Vegetarian plus eggs' },
  { value: 'nonveg', title: 'Non-vegetarian', sub: 'Chicken, fish, eggs, meat' },
  { value: 'vegan', title: 'Vegan', sub: 'No dairy, eggs or meat' },
  { value: 'jain', title: 'Jain', sub: 'Vegetarian, no root vegetables' },
]

const AVOID = ['Dairy', 'Gluten', 'Peanuts', 'Tree nuts', 'Soy', 'Seafood']

/** Eating step: diet, meals a day and foods to avoid. Shapes suggestions and the coach. */
export function EatingScreen() {
  const router = useRouter()
  const edit = useSearchParams().get('edit') === '1'
  const p = useProfile()
  const next = () => {
    if (!p.diet) p.set({ diet: 'nonveg' })
    if (edit) return router.back()
    router.push('/goal/?onboarding=1')
  }
  return (
    <AuthPage>
      {edit ? (
        <StepHeader step={0} back="/settings/" />
      ) : (
        <StepHeader step={4} back="/onboarding/body/" />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 26 }}>
        <StepIntro
          title="How you eat"
          lede="So food suggestions, protein ideas and the coach fit your plate."
        />
        <div
          role="radiogroup"
          aria-label="Diet"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}
        >
          {DIETS.map((d) => (
            <OptionCard
              key={d.value}
              on={p.diet === d.value}
              title={d.title}
              sub={d.sub}
              onClick={() => p.set({ diet: d.value })}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Kick>MEALS A DAY</Kick>
          <Segmented
            label="Meals a day"
            fill
            value={String(p.mealsPerDay)}
            onChange={(v) => p.set({ mealsPerDay: Number(v) })}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5+' },
            ]}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Kick>ANYTHING YOU AVOID? (OPTIONAL)</Kick>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AVOID.map((a) => (
              <ChipToggle
                key={a}
                on={p.avoidFoods.includes(a)}
                onClick={() => p.set({ avoidFoods: toggle(p.avoidFoods, a) })}
              >
                {a}
              </ChipToggle>
            ))}
          </div>
        </div>
      </div>
      <div className={bottomClass} style={{ paddingTop: 20 }}>
        <PillButton
          icon={edit ? 'check' : 'chevronRight'}
          iconAfter={!edit}
          lifted
          block
          disabled={!p.diet && !edit}
          onClick={next}
        >
          {edit ? 'Save' : 'Set your target physique'}
        </PillButton>
      </div>
    </AuthPage>
  )
}
