'use client'

import {
  BottomSheet,
  CoachOrb,
  fadedBorder,
  GlassCard,
  Icon,
  IconButton,
  PillButton,
} from '@syntropy/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { shortDate } from '@/lib/dates'
import { isDemoBuild } from '@/platform/native'
import { getApiKey } from '@/platform/secrets'
import { AuthPage } from '@/screens/auth/parts'
import { firstName, useCoach, useProfile } from '@/stores'

const SUGGEST = [
  'What should I eat for dinner?',
  'Why am I tired today?',
  'Plan next week',
  'Is 3 roti too many?',
]

/** Coach.dc.html: the intro with the orb and suggested questions. */
export function CoachScreen() {
  const router = useRouter()
  const name = useProfile((p) => p.name)
  const threads = useCoach((c) => c.threads)
  const remove = useCoach((c) => c.remove)
  const [hist, setHist] = useState(false)
  const [hasKey, setHasKey] = useState(true)
  useEffect(() => void getApiKey().then((k) => setHasKey(!!k || isDemoBuild)), [])

  return (
    <AuthPage
      orbs={[
        { tone: 'sage', strength: 0.38, left: -240, bottom: -160 },
        { tone: 'ember', strength: 0.3, right: -240, top: -80 },
      ]}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '0 -4px',
        }}
      >
        <IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />
        <span
          className="sy-mono"
          style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(243,241,236,0.6)' }}
        >
          SYNTROPY COACH
        </span>
        <IconButton icon="history" label="Past chats" onClick={() => setHist(true)} />
      </div>
      <h1
        style={{
          margin: '36px 0 0',
          textAlign: 'center',
          fontSize: 40,
          lineHeight: 1.04,
          fontWeight: 300,
          letterSpacing: '-0.05em',
        }}
      >
        Your coach,
        <br />
        <span
          style={{
            background: 'linear-gradient(90deg, #FFC7B0 0%, #FF7A45 45%, #A9C3A0 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          trained on you.
        </span>
      </h1>
      <div style={{ position: 'relative', height: 270, margin: '18px auto 0', width: 290 }}>
        <div style={{ position: 'absolute', left: 45, top: 26 }}>
          <CoachOrb size={200} />
        </div>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 55,
            top: 234,
            width: 180,
            height: 36,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,120,80,0.35), rgba(255,120,80,0) 70%)',
            filter: 'blur(8px)',
          }}
        />
        <div
          style={{
            ...fadedBorder,
            position: 'absolute',
            left: -6,
            top: 0,
            padding: '10px 16px',
            borderRadius: '18px 18px 18px 6px',
            fontSize: 16,
            animation: 'sy-float 6s ease-in-out infinite',
          }}
        >
          Hello, {firstName(name)}!
        </div>
      </div>
      <p
        style={{
          margin: '8px 12px 0',
          textAlign: 'center',
          fontSize: 15,
          lineHeight: 1.5,
          color: 'rgba(243,241,236,0.68)',
        }}
      >
        Ask about meals, training and recovery. It reads your logs, so every answer fits your day.
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          marginTop: 22,
        }}
      >
        {SUGGEST.map((s) => (
          <Link
            key={s}
            href={`/coach/chat/?q=${encodeURIComponent(s)}`}
            style={{
              ...fadedBorder,
              height: 44,
              padding: '0 16px',
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              fontSize: 13.5,
              whiteSpace: 'nowrap',
            }}
          >
            {s}
          </Link>
        ))}
      </div>
      {!hasKey ? (
        <GlassCard
          href="/settings/ai/"
          radius={20}
          padding="12px 14px"
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderColor: 'rgba(255,199,176,0.3)',
          }}
        >
          <Icon name="key" size={18} style={{ color: '#FFC7B0' }} />
          <span style={{ flex: 1, fontSize: 13.5, color: 'rgba(243,241,236,0.8)' }}>
            Connect your free Gemini key to talk to Coach.
          </span>
          <Icon name="chevronRight" size={16} />
        </GlassCard>
      ) : null}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <PillButton icon="arrowUpRight" iconAfter lifted block href="/coach/chat/">
          Start a chat
        </PillButton>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(243,241,236,0.45)' }}>
          Coach can make mistakes. It is not medical advice.
        </div>
      </div>
      <BottomSheet open={hist} onClose={() => setHist(false)} title="Past chats">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {threads.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link
                href={`/coach/chat/?id=${t.id}`}
                style={{
                  flex: 1,
                  minHeight: 54,
                  padding: '8px 14px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 14.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.title}
                </span>
                <span
                  className="sy-mono"
                  style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}
                >
                  {shortDate(new Date(t.updatedAt).toISOString().slice(0, 10)).toUpperCase()} ·{' '}
                  {t.messages.length} MESSAGES
                </span>
              </Link>
              <IconButton
                icon="trash"
                label={`Delete ${t.title}`}
                variant="plain"
                onClick={() => remove(t.id)}
              />
            </div>
          ))}
          {!threads.length ? (
            <p style={{ margin: 0, color: 'rgba(243,241,236,0.55)', fontSize: 13.5 }}>
              No chats yet.
            </p>
          ) : null}
        </div>
      </BottomSheet>
    </AuthPage>
  )
}
