'use client'

import {
  type ChatTurn,
  type CoachAction,
  coachReply,
  parseActions,
  visiblePart,
} from '@syntropy/ai'
import { FOOD_BY_ID, itemFromFood, slotForHour } from '@syntropy/nutrition'
import { CoachOrb, fadedBorder, fadedBorderUser, Icon, IconButton, TypingDots } from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { ThaliArt } from '@/components/ThaliArt'
import { GATE_COPY, geminiStream, withAi } from '@/lib/ai'
import { buildCoachContext } from '@/lib/coachContext'
import { hhmm, today } from '@/lib/dates'
import { compressImage } from '@/platform/camera'
import { success, tap } from '@/platform/haptics'
import { isDemoBuild } from '@/platform/native'
import { getApiKey } from '@/platform/secrets'
import { loadPhoto, savePhoto } from '@/platform/storage'
import {
  firstName,
  toast,
  useCoach,
  useNutrition,
  useProfile,
  useSettings,
  useWater,
} from '@/stores'
import { type ChatMessage, msgId } from '@/stores/coach'

type Pending = {
  kind: 'photo' | 'pdf'
  name: string
  mime: string
  data: string
  preview?: string
  size: string
}

// Offline demo replies (the board's own script) for the web demo without a key.
function demoReply(q: string) {
  const s = q.toLowerCase()
  if (/roti|dinner|eat|food|meal|protein/.test(s))
    return 'You have **80 kcal** and **35 g protein** left. For dinner, 150 g paneer tikka, or 1 katori Greek-style dahi with 1 roti, keeps you on target.\nACTIONS: [{"label":"Log 1 scoop whey","type":"log_food","foodId":"whey","qty":1},{"label":"Open food log","type":"open","to":"food"}]'
  if (/tired|sleep|recover|sore/.test(s))
    return 'Readiness is **82**. Lats and quads are still recovering from this week. Keep tomorrow light: mobility and a 30 minute walk.\nACTIONS: [{"label":"Open recovery","type":"open","to":"recovery"}]'
  if (/plan|week|split/.test(s))
    return 'Draft for next week:\n\n- **Monday** Push\n- **Wednesday** Legs\n- **Thursday** Pull\n- **Saturday** Full body\n\nI moved hamstring work earlier because it sits below your target range.\nACTIONS: [{"label":"Open plan","type":"open","to":"plan"}]'
  if (/water|drink/.test(s))
    return 'You are at **2.25 of 3.5 L**. Two glasses before dinner and one after gets you there.\nACTIONS: [{"label":"Log 500 ml water","type":"log_water","ml":500}]'
  return "Got it. I checked today's meals, training and recovery. Want me to turn this into something you can log?"
}

function AttachmentCards({
  items,
}: {
  items: {
    kind: 'photo' | 'pdf'
    name: string
    photoId?: string
    size?: string
    preview?: string
  }[]
}) {
  return (
    <div
      aria-label="Attached files"
      style={{
        position: 'relative',
        alignSelf: 'flex-end',
        width: items.length > 1 ? 214 : 112,
        height: 128,
      }}
    >
      {items.slice(0, 2).map((a, i) => (
        <Card
          key={a.name + i}
          a={a}
          style={{
            position: 'absolute',
            [i ? 'right' : 'left']: 0,
            top: i ? 0 : 6,
            transform: `rotate(${i ? 5 : items.length > 1 ? -6 : 3}deg)`,
          }}
        />
      ))}
    </div>
  )
}

function Card({
  a,
  style,
}: {
  a: { kind: 'photo' | 'pdf'; name: string; photoId?: string; size?: string; preview?: string }
  style: React.CSSProperties
}) {
  const [src, setSrc] = useState<string | null>(a.preview ?? null)
  useEffect(() => {
    if (!src && a.photoId) void loadPhoto(a.photoId).then(setSrc)
  }, [a.photoId, src])
  return (
    <div
      style={{
        ...fadedBorder,
        ...style,
        width: 108,
        height: 118,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {a.kind === 'photo' ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 6,
            top: 6,
            width: 96,
            height: 72,
            borderRadius: 14,
            overflow: 'hidden',
            background: '#2A221B',
          }}
        >
          {src ? (
            // biome-ignore lint/performance/noImgElement: local attachment
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', left: -110, top: -40 }}>
              <ThaliArt scale={0.9} blur={1.2} />
            </div>
          )}
        </div>
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            right: 8,
            height: 70,
            borderRadius: 12,
            padding: 9,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            background: 'rgba(243,241,236,0.92)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                height: 14,
                padding: '0 4px',
                borderRadius: 4,
                background: '#FF6B3D',
                color: '#FFF',
                fontSize: 7.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              PDF
            </span>
            <span
              style={{ height: 4, flexGrow: 1, borderRadius: 2, background: 'rgba(20,24,22,0.35)' }}
            />
          </span>
          {[90, 75, 84, 60].map((w) => (
            <span
              key={w}
              style={{
                height: 3,
                width: `${w}%`,
                borderRadius: 2,
                background: 'rgba(20,24,22,0.22)',
              }}
            />
          ))}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: 9,
          right: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {a.name}
        </span>
        <span className="sy-mono" style={{ fontSize: 9.5, color: 'rgba(243,241,236,0.55)' }}>
          {a.size}
        </span>
      </div>
    </div>
  )
}

export function ChatScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const name = useProfile((p) => p.name)
  const coach = useCoach()
  const model = useSettings((s) => s.models.chat)
  const [threadId, setThreadId] = useState<string | null>(params.get('id'))
  const thread = coach.threads.find((t) => t.id === threadId)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [pending, setPending] = useState<Pending[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  const asked = useRef(false)
  const abort = useRef<AbortController | null>(null)

  const messages = thread?.messages ?? []
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [])

  const foodIds = useMemo(() => new Set(Object.keys(FOOD_BY_ID)), [])

  const send = async (text: string) => {
    const t = text.trim()
    if ((!t && !pending.length) || thinking) return
    tap()
    let tid = threadId
    if (!tid || !coach.threads.find((x) => x.id === tid)) {
      tid = useCoach.getState().newThread(t.slice(0, 48) || 'Attachment')
      setThreadId(tid)
      router.replace(`/coach/chat/?id=${tid}`)
    }
    const attachMeta: ChatMessage['attachments'] = []
    for (const p of pending) {
      if (p.kind === 'photo' && p.preview) {
        const photoId = msgId()
        await savePhoto(photoId, p.preview)
        attachMeta.push({ kind: 'photo', name: p.name, photoId, size: p.size })
      } else attachMeta.push({ kind: p.kind, name: p.name, size: p.size })
    }
    const userMsg: ChatMessage = {
      id: msgId(),
      role: 'user',
      text: t,
      at: Date.now(),
      attachments: attachMeta.length ? attachMeta : undefined,
    }
    useCoach.getState().append(tid, userMsg)
    const files = pending
    setPending([])
    setDraft('')
    setThinking(true)
    setStreamText('')

    const history: ChatTurn[] = [
      ...(useCoach.getState().threads.find((x) => x.id === tid)?.messages ?? []),
    ]
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }))
    if (files.length)
      history[history.length - 1] = {
        role: 'user',
        text: t || 'Please look at this.',
        attachments: files.map((f) => ({ mime: f.mime, data: f.data, name: f.name })),
      }

    const hasKey = !!(await getApiKey())
    let full = ''
    if (!hasKey && isDemoBuild) {
      await new Promise((r) => setTimeout(r, 1400))
      full = demoReply(t)
    } else {
      abort.current = new AbortController()
      const r = await withAi(async () => {
        let acc = ''
        for await (const chunk of coachReply(
          geminiStream,
          model,
          buildCoachContext(),
          history,
          abort.current?.signal,
        )) {
          acc += chunk
          setStreamText(visiblePart(acc))
        }
        return acc
      })
      if (!r.ok) {
        setThinking(false)
        setStreamText('')
        useCoach.getState().append(tid, {
          id: msgId(),
          role: 'coach',
          text: r.kind === 'no-key' ? GATE_COPY['no-key'] : r.message,
          at: Date.now(),
          error: true,
        })
        return
      }
      full = r.value
    }
    const { text: clean, actions } = parseActions(full, foodIds)
    useCoach
      .getState()
      .append(tid, { id: msgId(), role: 'coach', text: clean, actions, at: Date.now() })
    setThinking(false)
    setStreamText('')
  }

  // A question passed in from the intro or elsewhere (?q=) is asked once.
  useEffect(() => {
    const q = params.get('q')
    if (q && !asked.current) {
      asked.current = true
      void send(q)
    }
  })

  const runAction = (m: ChatMessage, a: CoachAction) => {
    if (!threadId) return
    if (a.type === 'log_food') {
      const f = FOOD_BY_ID[a.foodId]
      if (!f) return
      const slot = slotForHour(new Date().getHours())
      useNutrition.getState().addItems(
        today(),
        slot,
        [itemFromFood(f, a.qty, 'manual')],
        useNutrition.getState().meals.some((x) => x.date === today() && x.slot === slot),
      )
      toast(`Logged ${a.qty} × ${f.name}`)
    } else if (a.type === 'log_water') {
      for (let ml = a.ml; ml > 0; ml -= 250) useWater.getState().add(Math.min(250, ml))
      toast(`${a.ml} ml water logged`, { icon: 'drop' })
    } else {
      const to = {
        scan: '/scan/',
        food: '/food/',
        plan: '/plan/',
        recovery: '/recovery/',
        progress: '/progress/',
        goal: '/goal/',
      }[a.to]
      router.push(to)
      return
    }
    success()
    useCoach.getState().patch(threadId, m.id, { done: [...(m.done ?? []), a.label] })
  }

  const addFiles = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,application/pdf'
    input.multiple = true
    input.onchange = async () => {
      const out: Pending[] = []
      for (const f of Array.from(input.files ?? []).slice(0, 3)) {
        const dataUrl = await new Promise<string>((res) => {
          const r = new FileReader()
          r.onload = () => res(String(r.result))
          r.readAsDataURL(f)
        })
        const size =
          f.size > 1e6 ? `${(f.size / 1e6).toFixed(1)} MB` : `${Math.round(f.size / 1000)} KB`
        if (f.type === 'application/pdf') {
          if (f.size > 8e6) {
            toast('PDF is over 8 MB. Try a smaller one.')
            continue
          }
          out.push({
            kind: 'pdf',
            name: f.name,
            mime: 'application/pdf',
            data: dataUrl.split(',')[1] ?? '',
            size: `PDF · ${size}`,
          })
        } else {
          const small = await compressImage(dataUrl, 1280)
          out.push({
            kind: 'photo',
            name: f.name.replace(/\.[^.]+$/, '') || 'Photo',
            mime: 'image/jpeg',
            data: small.split(',')[1] ?? '',
            preview: small,
            size: `JPG · ${hhmm()}`,
          })
        }
      }
      setPending((p) => [...p, ...out].slice(0, 3))
    }
    input.click()
  }

  const QUICK = [
    {
      label: 'Scan plate',
      icon: 'scan' as const,
      run: () => router.push('/scan/'),
      art: <ThaliMini />,
    },
    { label: 'Add files', icon: 'file' as const, run: addFiles, art: <PdfMini /> },
    {
      label: 'Plan week',
      icon: 'calendar' as const,
      run: () => void send('Plan my training for next week from my logs.'),
      art: <PlanMini />,
    },
    {
      label: 'Voice chat',
      icon: 'waveform' as const,
      run: () => toast('Tap the mic on your keyboard to talk, then send.', { icon: 'mic' }),
      art: <CoachOrb size={50} glow={false} />,
    },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--sy-void)', overflow: 'hidden' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -260,
          top: -120,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, rgba(255,107,61,0.28) 0%, rgba(255,107,61,0.10) 38%, rgba(255,107,61,0) 70%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -260,
          bottom: -200,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, rgba(137,170,124,0.34) 0%, rgba(137,170,124,0.12) 38%, rgba(137,170,124,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 'max(60px, calc(var(--sy-safe-top) + 16px))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 480,
          margin: '0 auto',
          zIndex: 2,
        }}
      >
        <IconButton
          icon="plus"
          label="New chat"
          onClick={() => {
            setThreadId(null)
            router.replace('/coach/chat/')
          }}
          style={{ color: '#FFC7B0' }}
        />
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>
          Coach
        </h1>
        <IconButton
          icon="close"
          label="Close chat"
          onClick={() => {
            abort.current?.abort()
            router.back()
          }}
        />
      </div>
      <div
        ref={scroller}
        className="hide-scroll"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 'calc(max(60px, calc(var(--sy-safe-top) + 16px)) + 52px)',
          bottom: 'calc(210px + var(--sy-safe-bottom))',
          overflowY: 'auto',
          padding: '8px 20px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4 }}>
          <CoachOrb size={60} state={thinking ? 'thinking' : 'idle'} glow={false} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 14, color: 'rgba(243,241,236,0.62)' }}>
              Hi, {firstName(name)}!
            </span>
            <span style={{ fontSize: 23, fontWeight: 500, letterSpacing: '-0.03em' }}>
              How can I help today?
            </span>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {messages.map((m) =>
            m.role === 'user' ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}
              >
                {m.attachments?.length ? <AttachmentCards items={m.attachments} /> : null}
                {m.text ? (
                  <div
                    style={{
                      ...fadedBorderUser,
                      maxWidth: 270,
                      padding: '12px 15px',
                      borderRadius: '22px 22px 6px 22px',
                      fontSize: 14.5,
                      lineHeight: 1.45,
                    }}
                  >
                    {m.text}
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CoachOrb size={26} glow={false} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Coach</span>
                  <span
                    className="sy-mono"
                    style={{ fontSize: 10, color: 'rgba(243,241,236,0.5)' }}
                  >
                    {hhmm(new Date(m.at))}
                  </span>
                </div>
                <div
                  style={{
                    ...fadedBorder,
                    padding: '14px 16px',
                    borderRadius: '6px 22px 22px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: m.error ? '#FFC7B0' : 'rgba(243,241,236,0.86)',
                  }}
                >
                  <Markdown text={m.text} />
                  {m.error && /key/i.test(m.text) ? (
                    <a
                      href="/settings/ai/"
                      style={{ color: '#FFC7B0', fontSize: 13, textDecoration: 'underline' }}
                    >
                      Open AI settings
                    </a>
                  ) : null}
                  {m.actions?.length ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 2 }}>
                      {m.actions.map((a, i) => {
                        const done = m.done?.includes(a.label)
                        const primary = a.type !== 'open'
                        return (
                          <button
                            key={a.label + i}
                            type="button"
                            disabled={done}
                            onClick={() => runAction(m, a)}
                            style={{
                              height: 36,
                              padding: '0 12px',
                              borderRadius: 18,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              font: 'inherit',
                              fontSize: 12.5,
                              cursor: done ? 'default' : 'pointer',
                              background: primary
                                ? 'rgba(169,195,160,0.12)'
                                : 'rgba(255,255,255,0.06)',
                              border: `1px solid ${primary ? 'rgba(169,195,160,0.3)' : 'rgba(255,255,255,0.1)'}`,
                              color: primary ? '#C9DCBF' : '#F3F1EC',
                              opacity: done ? 0.55 : 1,
                            }}
                          >
                            {primary ? <Icon name={done ? 'check' : 'plus'} size={14} /> : null}
                            {done ? `${a.label} ✓` : a.label}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>
        {thinking ? (
          streamText ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CoachOrb size={26} state="thinking" glow={false} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Coach</span>
              </div>
              <div
                style={{
                  ...fadedBorder,
                  padding: '14px 16px',
                  borderRadius: '6px 22px 22px 22px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'rgba(243,241,236,0.86)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <Markdown text={streamText} />
              </div>
            </div>
          ) : (
            <div
              role="status"
              aria-label="Coach is thinking"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <CoachOrb size={26} state="thinking" glow={false} />
              <span
                style={{
                  ...fadedBorder,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <TypingDots />
              </span>
            </div>
          )
        ) : null}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'calc(196px + var(--sy-safe-bottom))',
          height: 40,
          background: 'linear-gradient(0deg, rgba(11,15,13,0.95), rgba(11,15,13,0))',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 'calc(100px + var(--sy-safe-bottom))',
          maxWidth: 488,
          margin: '0 auto',
        }}
      >
        {pending.length ? (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {pending.map((p, i) => (
              <span
                key={p.name + i}
                style={{
                  ...fadedBorder,
                  height: 32,
                  padding: '0 6px 0 12px',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <Icon name={p.kind === 'pdf' ? 'file' : 'gallery'} size={13} />
                {p.name.slice(0, 18)}
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => setPending((x) => x.filter((_, j) => j !== i))}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <Icon name="close" size={13} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            {QUICK.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={q.run}
                style={{
                  ...fadedBorder,
                  position: 'relative',
                  height: 92,
                  borderRadius: 22,
                  padding: '0 10px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  overflow: 'visible',
                  font: 'inherit',
                  color: '#F3F1EC',
                  cursor: 'pointer',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: -22,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {q.art}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon name={q.icon} size={13} />
                  {q.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(draft)
        }}
        style={{
          ...fadedBorder,
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 'calc(30px + var(--sy-safe-bottom))',
          maxWidth: 488,
          margin: '0 auto',
          height: 58,
          borderRadius: 29,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 7px 0 18px',
        }}
      >
        <label htmlFor="chat-in" className="sy-sr-only">
          Message your coach
        </label>
        <input
          id="chat-in"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask your coach anything"
          autoComplete="off"
          enterKeyHint="send"
          style={{
            flexGrow: 1,
            minWidth: 0,
            height: 44,
            border: 0,
            outline: 'none',
            background: 'transparent',
            font: 'inherit',
            fontSize: 15,
            color: '#F3F1EC',
          }}
        />
        <IconButton
          icon="mic"
          label="Speak"
          variant="plain"
          onClick={() => toast('Tap the mic on your keyboard to dictate.', { icon: 'mic' })}
          style={{ color: 'rgba(243,241,236,0.75)' }}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={thinking}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            padding: 0,
            border: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1A0E08',
            cursor: 'pointer',
            background: 'radial-gradient(circle at 32% 25%, #FFC2A3 0%, #FF7A4A 50%, #E0501F 100%)',
            boxShadow: '0 8px 20px rgba(255,107,61,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
            opacity: thinking ? 0.6 : 1,
          }}
        >
          <Icon name="arrowUp" size={20} stroke={2} />
        </button>
      </form>
    </div>
  )
}

function ThaliMini() {
  return (
    <span
      style={{
        display: 'block',
        position: 'relative',
        width: 58,
        height: 58,
        borderRadius: 29,
        overflow: 'hidden',
        boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
        transform: 'rotate(-8deg)',
      }}
    >
      <span style={{ position: 'absolute', left: -12, top: -12 }}>
        <ThaliArt scale={0.26} blur={0.6} />
      </span>
    </span>
  )
}
function PdfMini() {
  return (
    <span style={{ display: 'block', position: 'relative', width: 64, height: 58 }}>
      <span
        style={{
          position: 'absolute',
          left: 4,
          top: 6,
          width: 38,
          height: 48,
          borderRadius: 8,
          background: 'rgba(243,241,236,0.85)',
          transform: 'rotate(-10deg)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.35)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 22,
          top: 2,
          width: 38,
          height: 48,
          borderRadius: 8,
          background: '#F3F1EC',
          transform: 'rotate(8deg)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'flex-start',
          padding: 6,
        }}
      >
        <span
          style={{
            height: 11,
            padding: '0 3px',
            borderRadius: 3,
            background: '#FF6B3D',
            color: '#fff',
            fontSize: 6.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          PDF
        </span>
      </span>
    </span>
  )
}
function PlanMini() {
  const c = [
    '#A9C3A0',
    'rgba(255,255,255,0.12)',
    '#A9C3A0',
    '#FF6B3D',
    'rgba(255,255,255,0.12)',
    'rgba(243,241,236,0.45)',
    'rgba(255,255,255,0.12)',
    '#A9C3A0',
  ]
  return (
    <span
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 11px)',
        gap: 3,
        padding: 8,
        borderRadius: 14,
        background: 'rgba(28,34,31,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
        transform: 'rotate(6deg)',
      }}
    >
      {c.map((x, i) => (
        <span key={i} style={{ width: 11, height: 11, borderRadius: 4, background: x }} />
      ))}
    </span>
  )
}
