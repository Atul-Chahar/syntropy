'use client'

import {
  Callout,
  GlassCard,
  Icon,
  IconButton,
  PillButton,
  Screen,
  TextField,
  TileStepper,
} from '@syntropy/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { gemini, withAi } from '@/lib/ai'
import { success } from '@/platform/haptics'
import { clearApiKey, getApiKey, maskKey, setApiKey } from '@/platform/secrets'
import { toast, useSettings } from '@/stores'
import { DEFAULT_MODELS } from '@/stores/settings'

const LEAVES = [
  ['scan', 'Meal photos you choose to scan'],
  ['pencil', 'Food sentences you ask Gemini to read'],
  [
    'sparkle',
    "For Coach: today's meals, targets, water, recent sessions, weight trend and your first name",
  ],
] as const

/** AI settings (DESIGN_GAPS #9): bring your own free Gemini key. */
export function AiSettingsScreen() {
  const router = useRouter()
  const s = useSettings()
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    void getApiKey().then((k) => {
      setSaved(k)
      s.set({ hasKey: !!k })
    })
  }, [s.set])

  const save = async () => {
    const k = key.trim()
    if (!/^[A-Za-z0-9_-]{20,}$/.test(k)) return toast('That does not look like a Gemini API key')
    await setApiKey(k)
    setSaved(k)
    setKey('')
    s.set({ hasKey: true, aiConsent: true })
    success()
    toast('Key saved to secure storage')
  }

  const test = async () => {
    setTesting(true)
    const r = await withAi(() => gemini.ping(s.models.text))
    setTesting(false)
    toast(r.ok ? 'Gemini answered. You are all set.' : r.message, {
      icon: r.ok ? 'check' : 'sparkle',
    })
  }

  const used = s.usage.date === new Date().toISOString().slice(0, 10) ? s.usage.count : 0

  return (
    <Screen>
      <ModalHeader
        left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
        title="AI settings"
        sub="GEMINI · FREE TIER"
      />
      <GlassCard padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 17, fontWeight: 400, letterSpacing: '-0.02em' }}>
          {saved ? 'Gemini is connected' : 'Connect your Gemini key'}
        </span>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'rgba(243,241,236,0.72)' }}>
          Syntropy has no server. Scans and Coach talk to Google Gemini directly from this phone
          with your own free key, kept in Android&apos;s secure hardware storage.
        </p>
        {saved ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span className="sy-mono" style={{ fontSize: 13 }}>
              {maskKey(saved)}
            </span>
            <PillButton
              variant="ghost"
              height={40}
              fontSize={13}
              icon="trash"
              onClick={async () => {
                await clearApiKey()
                setSaved(null)
                s.set({ hasKey: false })
                toast('Key removed')
              }}
            >
              Remove
            </PillButton>
          </div>
        ) : null}
        <TextField
          label={saved ? 'Replace key' : 'API key'}
          type="password"
          autoComplete="off"
          placeholder="AIza…"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <PillButton height={50} block icon="key" onClick={save} disabled={!key.trim()}>
            Save key
          </PillButton>
          <PillButton height={50} variant="glass" onClick={test} disabled={!saved || testing}>
            {testing ? 'Testing…' : 'Test'}
          </PillButton>
        </div>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: '#FFC7B0', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="arrowUpRight" size={14} />
          Get a free key in Google AI Studio
        </a>
      </GlassCard>

      <GlassCard
        padding={16}
        radius={24}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <span
          className="sy-mono"
          style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
        >
          WHAT LEAVES THE PHONE
        </span>
        {LEAVES.map(([ic, text]) => (
          <div
            key={text}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,199,176,0.1)',
                color: '#FFC7B0',
              }}
            >
              <Icon name={ic} size={15} />
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.4, color: 'rgba(243,241,236,0.78)' }}>
              {text}
            </span>
          </div>
        ))}
        <Callout tone="water">
          Nothing else. Progress photos, your email and full history never leave. On the free tier,
          Google may use prompts to improve its products.
        </Callout>
      </GlassCard>

      <GlassCard
        padding={16}
        radius={24}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
          >
            MODELS
          </span>
          <button
            type="button"
            onClick={() => s.set({ models: DEFAULT_MODELS })}
            style={{
              border: 0,
              background: 'transparent',
              color: '#FFC7B0',
              font: 'inherit',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
        <TextField
          label="Photo scanning"
          value={s.models.vision}
          onChange={(e) => s.set({ models: { ...s.models, vision: e.target.value.trim() } })}
        />
        <TextField
          label="Coach chat"
          value={s.models.chat}
          onChange={(e) => s.set({ models: { ...s.models, chat: e.target.value.trim() } })}
        />
        <TextField
          label="Food sentences"
          value={s.models.text}
          onChange={(e) => s.set({ models: { ...s.models, text: e.target.value.trim() } })}
        />
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        <TileStepper
          kicker="DAILY LIMIT"
          label="daily AI limit"
          value={s.dailyCap}
          step={10}
          min={10}
          max={500}
          onChange={(v) => s.set({ dailyCap: v })}
        />
        <GlassCard
          radius={22}
          padding={14}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <span
            className="sy-mono"
            style={{ fontSize: 11, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
          >
            USED TODAY
          </span>
          <span className="sy-dot" style={{ fontSize: 26, lineHeight: 1, marginTop: 'auto' }}>
            {used}
          </span>
        </GlassCard>
      </div>
    </Screen>
  )
}
