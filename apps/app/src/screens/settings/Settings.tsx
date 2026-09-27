'use client'

import {
  BottomSheet,
  GlassCard,
  Icon,
  IconButton,
  ListRow,
  PillButton,
  Screen,
  Segmented,
  Switch,
} from '@syntropy/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { loadSeed } from '@/lib/seed'
import { biometryAvailable, unlock } from '@/platform/biometric'
import { exportJson, pickJsonFile } from '@/platform/files'
import { ensureNotifyPermission, scheduleWaterReminders } from '@/platform/notifications'
import {
  toast,
  useCoach,
  useGoal,
  useNutrition,
  useProfile,
  useSettings,
  useTraining,
  useWater,
} from '@/stores'
import { initials } from '@/stores/profile'
import { DEF } from '@/stores/training'

const VERSION = '1.0.0'

/** Settings / Profile (DESIGN_GAPS #15). */
export function SettingsScreen() {
  const router = useRouter()
  const p = useProfile()
  const settings = useSettings()
  const water = useWater()
  const [reset, setReset] = useState(false)

  const exportAll = async () => {
    const data = {
      app: 'syntropy',
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: { ...p, set: undefined, reset: undefined },
      goal: {
        type: useGoal.getState().type,
        pace: useGoal.getState().pace,
        adjustKcal: useGoal.getState().adjustKcal,
        checkins: useGoal.getState().checkins,
      },
      training: useTraining.getState().S,
      nutrition: {
        meals: useNutrition.getState().meals,
        customFoods: useNutrition.getState().customFoods,
      },
      water: useWater.getState().days,
      coach: useCoach.getState().threads,
    }
    await exportJson(`syntropy-backup-${new Date().toISOString().slice(0, 10)}.json`, data)
    toast('Backup ready')
  }

  const importAll = async () => {
    const d = (await pickJsonFile()) as Record<string, unknown> | null
    if (d?.app !== 'syntropy') return toast('That file is not a Syntropy backup')
    const profile = d.profile as Record<string, unknown>
    if (profile) useProfile.getState().set(profile)
    const g = d.goal as { type: never; pace: never; adjustKcal: number; checkins: never }
    if (g)
      useGoal.setState({
        type: g.type,
        pace: g.pace,
        adjustKcal: g.adjustKcal ?? 0,
        checkins: g.checkins ?? [],
        set: true,
      })
    if (d.training) useTraining.getState().replaceAll(d.training as typeof DEF)
    const n = d.nutrition as { meals: never[]; customFoods: never[] }
    if (n)
      useNutrition
        .getState()
        .replaceAll({ meals: n.meals ?? [], customFoods: n.customFoods ?? [], recent: [] })
    if (d.water) useWater.getState().replaceAll(d.water as Record<string, number[]>)
    if (d.coach) useCoach.getState().replaceAll(d.coach as never[])
    toast('Backup restored')
  }

  const toggleLock = async (on: boolean) => {
    if (!on) return p.set({ lockEnabled: false })
    const avail = await biometryAvailable()
    if (!avail.available) return toast('Set up a screen lock on your phone first')
    const r = await unlock('Turn on the Syntropy app lock')
    if (r.ok) p.set({ lockEnabled: true })
  }

  const toggleReminders = async (on: boolean) => {
    if (on && !(await ensureNotifyPermission())) {
      water.setReminders(on)
      return toast('Reminders work in the Android app')
    }
    water.setReminders(on)
    await scheduleWaterReminders(on)
  }

  return (
    <Screen>
      <ModalHeader
        left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
        title="Settings"
      />
      <GlassCard
        href="/onboarding/body/?edit=1"
        padding={16}
        radius={26}
        style={{ display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'linear-gradient(145deg, #2A332E, #171C19)',
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          {initials(p.name)}
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.02em' }}>
            {p.name || 'You'}
          </span>
          <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>
            {p.age} Y · {p.heightCm} CM · {p.sex.toUpperCase()}
          </span>
        </span>
        <Icon name="chevronRight" size={18} style={{ color: 'rgba(243,241,236,0.5)' }} />
      </GlassCard>

      <Section title="Goal & AI">
        <ListRow
          icon="target"
          iconTone="ember"
          title="Target physique"
          subtitle="Calories, protein, water"
          href="/goal/"
        />
        <ListRow
          icon="sparkle"
          iconTone="peach"
          title="AI & Gemini key"
          subtitle={settings.hasKey ? 'Connected' : 'Add your free key'}
          href="/settings/ai/"
        />
        <ListRow
          icon="calendar"
          iconTone="sage"
          title="Weekly check-in"
          subtitle="Review the week and adjust targets"
          href="/coach/checkin/"
        />
      </Section>

      <Section title="Privacy">
        <ListRow
          icon="fingerprint"
          iconTone="sage"
          title="App lock"
          subtitle="Fingerprint, face or screen lock"
          trailing={<Switch label="App lock" checked={p.lockEnabled} onChange={toggleLock} />}
        />
      </Section>

      <Section title="Daily">
        <GlassCard
          radius={22}
          padding="12px 14px"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 500 }}>Glass size · ml</span>
          <Segmented
            label="Glass size"
            value={String(water.glassMl)}
            onChange={(v) => water.setGlass(Number(v))}
            fill
            options={['200', '250', '300', '500'].map((v) => ({ value: v, label: v }))}
            height={36}
            fontSize={13}
          />
        </GlassCard>
        <ListRow
          icon="drop"
          iconTone="water"
          title="Water reminders"
          subtitle="10:00, 13:00, 16:00, 19:00"
          trailing={
            <Switch label="Water reminders" checked={water.reminders} onChange={toggleReminders} />
          }
        />
        <GlassCard
          radius={22}
          padding="12px 14px"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 500 }}>Default rest · seconds</span>
          <Segmented
            label="Default rest"
            value={String(settings.restSec)}
            onChange={(v) => settings.set({ restSec: Number(v) })}
            fill
            options={['60', '90', '120', '180'].map((v) => ({ value: v, label: v }))}
            height={36}
            fontSize={13}
          />
        </GlassCard>
      </Section>

      <Section title="Your data">
        <ListRow
          icon="download"
          title="Export a backup"
          subtitle="Everything except your API key, as JSON"
          onClick={exportAll}
        />
        <ListRow
          icon="share"
          title="Restore a backup"
          subtitle="Replace this phone's data with a file"
          onClick={importAll}
        />
        <ListRow icon="trash" title="Reset or load sample data" onClick={() => setReset(true)} />
      </Section>

      <Section title="About">
        <GlassCard
          radius={22}
          padding="14px 16px"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgba(243,241,236,0.7)',
          }}
        >
          <span>
            Syntropy {VERSION} · open source under the{' '}
            <strong style={{ color: '#F3F1EC' }}>GNU AGPL v3</strong>.
          </span>
          <span>
            Built on the training engine of OpenGym by Duarte Santos. Exercise data from ExerciseDB
            (MIT). Food values are estimates.
          </span>
          <a
            href="https://github.com/Atul-Chahar/syntropy"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#FFC7B0' }}
          >
            Source code on GitHub
          </a>
        </GlassCard>
      </Section>

      <BottomSheet open={reset} onClose={() => setReset(false)} title="Your data">
        <div style={{ display: 'grid', gap: 8 }}>
          <PillButton
            variant="glass"
            block
            onClick={() => {
              loadSeed()
              setReset(false)
              toast('Sample data loaded')
              router.replace('/')
            }}
          >
            Load sample data
          </PillButton>
          <PillButton
            variant="ghost"
            icon="trash"
            block
            onClick={() => {
              useProfile.getState().reset()
              useTraining.getState().replaceAll(DEF)
              useNutrition.getState().replaceAll({ meals: [], customFoods: [], recent: [] })
              useWater.getState().replaceAll({})
              useCoach.getState().replaceAll([])
              useGoal.setState({ checkins: [], adjustKcal: 0, set: false })
              setReset(false)
              router.replace('/welcome/')
            }}
            style={{ color: '#FF9C78' }}
          >
            Erase everything on this phone
          </PillButton>
        </div>
      </BottomSheet>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        className="sy-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.06em',
          color: 'rgba(243,241,236,0.5)',
          padding: '0 4px',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </span>
      {children}
    </section>
  )
}
