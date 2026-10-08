'use client'

import { analyzeMealPhoto, type MealAnalysis } from '@syntropy/ai'
import {
  FOOD_BY_ID,
  formatQty,
  itemFromFood,
  type MealSlot,
  mealTotals,
  newId,
  slotForHour,
} from '@syntropy/nutrition'
import { Dot, Icon, IconButton, PillButton, Skeleton, TrackSegmented } from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LiveVideo } from '@/components/LiveVideo'
import { ThaliArt } from '@/components/ThaliArt'
import { gemini, withAi } from '@/lib/ai'
import { captureFrame, ensureCameraPermission, pickPhoto } from '@/platform/camera'
import { success, thud } from '@/platform/haptics'
import { isDemoBuild } from '@/platform/native'
import { getApiKey } from '@/platform/secrets'
import { savePhoto } from '@/platform/storage'
import { useNutrition, useProfile, useSettings } from '@/stores'

type Phase = 'camera' | 'nocamera' | 'analysing' | 'result' | 'error'

// Where detection labels sit around the viewfinder (Scan.dc.html positions, % of the 330 box).
const SPOTS = [
  { dot: [226, 255], label: [222, 196] },
  { dot: [126, 265], label: [20, 208] },
  { dot: [281, 335], label: [248, 372] },
  { dot: [150, 380], label: [24, 400] },
  { dot: [230, 440], label: [196, 452] },
]

/** The board's thali, used for the demo and when no key is set ("Try a sample plate"). */
function samplePlate(): MealAnalysis {
  const conf: Record<string, number> = {
    'palak-paneer': 0.86,
    'dal-tadka': 0.91,
    roti: 0.94,
    dahi: 0.89,
    'jeera-rice': 0.84,
  }
  const items = [
    ['palak-paneer', 1],
    ['dal-tadka', 1],
    ['dahi', 1],
    ['roti', 2],
    ['jeera-rice', 1],
  ].map(([id, q]) =>
    itemFromFood(FOOD_BY_ID[id as string], q as number, 'photo', {
      confidence: conf[id as string],
      baseQty: q as number,
    }),
  )
  return { title: 'North Indian thali', items, notes: ['Sample result'], ms: 1600 }
}

export function ScanScreen() {
  const router = useRouter()
  const slot = (useSearchParams().get('slot') as MealSlot) || slotForHour(new Date().getHours())
  const setDraft = useNutrition((s) => s.setDraft)
  const model = useSettings((s) => s.models.vision)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>('camera')
  const [still, setStill] = useState<string | null>(null)
  const [result, setResult] = useState<MealAnalysis | null>(null)
  const [error, setError] = useState('')
  const [torch, setTorch] = useState(false)
  const [hasKey, setHasKey] = useState(true)
  const [mode, setMode] = useState<'library' | 'photo' | 'manual'>('photo')

  useEffect(() => {
    void getApiKey().then((k) => setHasKey(!!k))
  }, [])

  const stop = useCallback(() => {
    for (const t of stream.current?.getTracks() ?? []) t.stop()
    stream.current = null
  }, [])

  const start = useCallback(async () => {
    setPhase('camera')
    if (!navigator.mediaDevices?.getUserMedia || !(await ensureCameraPermission()))
      return setPhase('nocamera')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      stream.current = s
      if (video.current) {
        video.current.srcObject = s
        await video.current.play().catch(() => {})
      }
    } catch {
      setPhase('nocamera')
    }
  }, [])

  useEffect(() => {
    void start()
    return stop
  }, [start, stop])

  const toggleTorch = async () => {
    const track = stream.current?.getVideoTracks()[0]
    try {
      await track?.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] })
      setTorch(!torch)
    } catch {}
  }

  const analyse = async (dataUrl: string | null) => {
    if (!dataUrl) return
    stop()
    setStill(dataUrl)
    setPhase('analysing')
    thud()
    if (!hasKey && isDemoBuild) {
      await new Promise((r) => setTimeout(r, 1600))
      setResult(samplePlate())
      setPhase('result')
      return success()
    }
    const r = await withAi(() =>
      analyzeMealPhoto(gemini, {
        model,
        imageBase64: dataUrl.split(',')[1] ?? '',
        mime: 'image/jpeg',
        slot,
        cuisine: useProfile.getState().cuisine,
      }),
    )
    if (r.ok) {
      setResult(r.value)
      setPhase('result')
      success()
    } else {
      setError(
        r.kind === 'blocked'
          ? 'Could not read this plate. Try a clearer, top-down photo, or add items manually.'
          : r.message,
      )
      setPhase('error')
    }
  }

  const shutter = async () => {
    if (!video.current || !stream.current) return
    await analyse(await captureFrame(video.current))
  }

  const trySample = async () => {
    stop()
    setStill(null)
    setPhase('analysing')
    await new Promise((r) => setTimeout(r, 1400))
    setResult(samplePlate())
    setPhase('result')
    success()
  }

  const review = async () => {
    if (!result) return
    let photoId: string | undefined
    if (still) {
      photoId = newId('ph')
      await savePhoto(photoId, still)
    }
    setDraft({ title: result.title, items: result.items, slot, photoId, ms: result.ms })
    router.push('/meal/review/')
  }

  const tot = result ? mealTotals({ items: result.items }) : null
  const showLabels = phase === 'result' && result

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0A0D0C' }}>
      {/* Camera, frozen photo, or the thali stand-in */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 55% at 50% 40%, #3A2E24 0%, #1C1712 55%, #0A0D0C 100%)',
        }}
      />
      <LiveVideo ref={video} visible={phase === 'camera'} label="Camera preview" />
      {still ? (
        // biome-ignore lint/performance/noImgElement: captured frame
        <img
          src={still}
          alt="Your meal"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : phase !== 'camera' ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(186px + var(--sy-safe-top) - 24px)',
            marginLeft: -155,
          }}
        >
          <ThaliArt blur={4} />
        </div>
      ) : null}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Viewfinder */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -165,
          top: 'calc(176px + var(--sy-safe-top) - 24px)',
          width: 330,
          height: 330,
        }}
      >
        {[
          {
            left: 0,
            top: 0,
            borderTop: '2px solid #F3F1EC',
            borderLeft: '2px solid #F3F1EC',
            borderTopLeftRadius: 22,
          },
          {
            right: 0,
            top: 0,
            borderTop: '2px solid #F3F1EC',
            borderRight: '2px solid #F3F1EC',
            borderTopRightRadius: 22,
          },
          {
            left: 0,
            bottom: 0,
            borderBottom: '2px solid #F3F1EC',
            borderLeft: '2px solid #F3F1EC',
            borderBottomLeftRadius: 22,
          },
          {
            right: 0,
            bottom: 0,
            borderBottom: '2px solid #F3F1EC',
            borderRight: '2px solid #F3F1EC',
            borderBottomRightRadius: 22,
          },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 34, height: 34, ...s }} />
        ))}
        {phase === 'camera' || phase === 'analysing' || phase === 'nocamera' ? (
          <div
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              top: 22,
              height: 2,
              borderRadius: 1,
              background:
                'linear-gradient(90deg, rgba(255,199,176,0), #FFC7B0, rgba(255,199,176,0))',
              boxShadow: '0 0 18px 4px rgba(255,150,110,0.45)',
              animation: `sy-scan ${phase === 'analysing' ? 1.4 : 3.4}s ease-in-out infinite`,
            }}
          />
        ) : null}
      </div>

      {/* Detection labels */}
      <AnimatePresence>
        {showLabels
          ? result.items.slice(0, 5).map((it, i) => {
              const s = SPOTS[i]
              return (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.12 * i }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: `calc(50% - 195px + ${s.dot[0]}px)`,
                      top: `calc(${s.dot[1]}px + var(--sy-safe-top) - 24px)`,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: 'rgba(243,241,236,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: '#F3F1EC',
                        boxShadow: '0 0 12px rgba(255,255,255,0.8)',
                      }}
                    />
                  </div>
                  <div
                    className="sy-glass-dark"
                    style={{
                      position: 'absolute',
                      left: `calc(50% - 195px + ${s.label[0]}px)`,
                      top: `calc(${s.label[1]}px + var(--sy-safe-top) - 24px)`,
                      maxWidth: 140,
                      padding: '8px 12px',
                      borderRadius: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {it.name}
                    </div>
                    <div
                      className="sy-mono"
                      style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.66)' }}
                    >
                      {formatQty(it.qty, it.unit)}
                      {it.confidence != null ? ` · ${Math.round(it.confidence * 100)}%` : ''}
                    </div>
                  </div>
                </motion.div>
              )
            })
          : null}
      </AnimatePresence>

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 'max(var(--sy-top-pad), calc(var(--sy-safe-top) + 16px))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 440,
          margin: '0 auto',
        }}
      >
        <IconButton
          icon="close"
          label="Close scanner"
          onClick={() => {
            stop()
            router.back()
          }}
        />
        <div
          className="sy-glass-dark"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            padding: '0 14px',
            borderRadius: 18,
            fontSize: 13,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              background: hasKey ? '#A9C3A0' : '#FFC7B0',
              animation: 'sy-pulse 1.6s ease-in-out infinite',
            }}
          />
          {hasKey
            ? 'Gemini Vision · any cuisine'
            : isDemoBuild
              ? 'Demo · sample results'
              : 'Add a Gemini key to scan'}
        </div>
        <IconButton
          icon="flash"
          label="Toggle flash"
          pressed={torch}
          onClick={toggleTorch}
          style={torch ? { color: '#FFC7B0' } : undefined}
        />
      </div>

      {/* Capture controls */}
      <AnimatePresence>
        {phase === 'camera' || phase === 'nocamera' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 'calc(34px + var(--sy-safe-bottom))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 22,
            }}
          >
            {phase === 'nocamera' ? (
              <div
                className="sy-glass-dark"
                style={{
                  margin: '0 24px',
                  padding: '12px 16px',
                  borderRadius: 18,
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  color: 'rgba(243,241,236,0.8)',
                  textAlign: 'center',
                  maxWidth: 340,
                }}
              >
                Camera is not available here. Pick a photo from your gallery
                {hasKey ? '' : ' or try a sample plate'}.
              </div>
            ) : null}
            <button
              type="button"
              aria-label="Take photo"
              onClick={
                phase === 'camera'
                  ? shutter
                  : hasKey
                    ? async () => analyse(await pickPhoto())
                    : trySample
              }
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                border: '3px solid #F3F1EC',
                background: 'transparent',
                padding: 5,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'var(--sy-fab)',
                  boxShadow: '0 10px 28px rgba(255,107,61,0.45)',
                }}
              />
            </button>
            <TrackSegmented
              label="Capture mode"
              value={mode}
              onChange={async (m) => {
                setMode(m)
                if (m === 'manual') return router.push(`/meal/add/?slot=${slot}`)
                if (m === 'library') {
                  const p = await pickPhoto()
                  setMode('photo')
                  if (p) await analyse(p)
                }
              }}
              options={[
                { value: 'library', label: 'Library', icon: 'gallery' },
                { value: 'photo', label: 'Photo' },
                { value: 'manual', label: 'Manual', icon: 'pencil' },
              ]}
            />
            {!hasKey ? (
              <button
                type="button"
                onClick={trySample}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#FFC7B0',
                  font: 'inherit',
                  fontSize: 13.5,
                  minHeight: 44,
                  cursor: 'pointer',
                }}
              >
                Try a sample plate
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Result / analysing / error sheet */}
      <AnimatePresence>
        {phase === 'analysing' || phase === 'result' || phase === 'error' ? (
          <motion.section
            aria-label="Scan result"
            aria-live="polite"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: '12px 22px calc(28px + var(--sy-safe-bottom))',
              borderRadius: '34px 34px 0 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: 'rgba(16,20,18,0.72)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                alignSelf: 'center',
                width: 38,
                height: 4,
                borderRadius: 2,
                background: 'rgba(243,241,236,0.25)',
              }}
            />
            {phase === 'analysing' ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    color: 'rgba(243,241,236,0.8)',
                  }}
                >
                  <Icon
                    name="sparkle"
                    size={16}
                    style={{ color: '#FFC7B0', animation: 'sy-pulse 1s infinite' }}
                  />
                  Reading your plate…
                </div>
                <Skeleton height={48} width="55%" radius={12} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Skeleton height={32} width={100} radius={16} />
                  <Skeleton height={32} width={100} radius={16} />
                  <Skeleton height={32} width={80} radius={16} />
                </div>
                <Skeleton height={56} radius={28} />
              </>
            ) : null}
            {phase === 'result' && result && tot ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 13, color: 'rgba(243,241,236,0.66)' }}>
                      {result.items.length} items · {result.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="sy-dot" style={{ fontSize: 54, lineHeight: 0.9 }}>
                        {Math.round(tot.kcal).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: 15, color: 'rgba(243,241,236,0.66)' }}>kcal</span>
                    </div>
                  </div>
                  <div
                    className="sy-mono"
                    style={{
                      fontSize: 11,
                      color: 'rgba(243,241,236,0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="stopwatch" size={13} />
                    {(result.ms / 1000).toFixed(1)} s
                  </div>
                </div>
                <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {[
                    ['Protein', tot.protein, '#A9C3A0'],
                    ['Carbs', tot.carbs, '#FFC7B0'],
                    ['Fat', tot.fat, '#FF8A5C'],
                  ].map(([n, v, c]) => (
                    <div
                      key={n as string}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        height: 32,
                        padding: '0 12px',
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Dot color={c as string} />
                      <span style={{ color: 'rgba(243,241,236,0.62)' }}>{n}</span>
                      <span>{Math.round(v as number)} g</span>
                    </div>
                  ))}
                </div>
                <PillButton height={56} icon="chevronRight" iconAfter block onClick={review}>
                  Review &amp; log
                </PillButton>
              </>
            ) : null}
            {phase === 'error' ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em' }}>
                  Could not read this plate
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'rgba(243,241,236,0.7)',
                  }}
                >
                  {error}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <PillButton
                    variant="glass"
                    height={54}
                    onClick={() => {
                      setStill(null)
                      setResult(null)
                      void start()
                    }}
                  >
                    Retake
                  </PillButton>
                  <PillButton height={54} block icon="pencil" href={`/meal/add/?slot=${slot}`}>
                    Add manually
                  </PillButton>
                </div>
                {!hasKey ? (
                  <PillButton variant="ghost" height={44} href="/settings/ai/">
                    Add a Gemini key
                  </PillButton>
                ) : null}
              </>
            ) : null}
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
