'use client'

import { Icon, IconButton, PillButton, TrackSegmented } from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LiveVideo } from '@/components/LiveVideo'
import { daysBetween, today } from '@/lib/dates'
import { PHOTO_RULES, POSES, useProgressPhotos } from '@/lib/photos'
import { cropPortrait, ensureCameraPermission, pickPhoto } from '@/platform/camera'
import { success, thud } from '@/platform/haptics'
import { loadPhoto, savePhoto } from '@/platform/storage'
import { type Pose, toast, usePhotos } from '@/stores'

type Phase = 'camera' | 'nocamera' | 'review'
type Facing = 'user' | 'environment'
const TIMERS = [0, 3, 10] as const

/** Lines a first photo up: head near the top, knees near the bottom, centred. */
function FrameGuide() {
  const line = '1px dashed rgba(243,241,236,0.35)'
  const tag = {
    position: 'absolute',
    right: 12,
    fontSize: 10,
    letterSpacing: '0.06em',
    color: 'rgba(243,241,236,0.55)',
  } as const
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '9%', borderTop: line }} />
      <span className="sy-mono" style={{ ...tag, top: 'calc(9% + 6px)' }}>
        HEAD
      </span>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '90%', borderTop: line }} />
      <span className="sy-mono" style={{ ...tag, top: 'calc(90% - 18px)' }}>
        KNEES
      </span>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          borderLeft: line,
          opacity: 0.6,
        }}
      />
    </div>
  )
}

export function PhotoCaptureScreen() {
  const router = useRouter()
  const initial = (useSearchParams().get('pose') as Pose) || 'front'
  const add = usePhotos((s) => s.add)
  const all = useProgressPhotos()
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>('camera')
  const [facing, setFacing] = useState<Facing>('user')
  const [pose, setPose] = useState<Pose>(POSES.some((p) => p.value === initial) ? initial : 'front')
  const [still, setStill] = useState<string | null>(null)
  const [ghost, setGhost] = useState<string | null>(null)
  const [ghostOn, setGhostOn] = useState(true)
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(0)
  const [count, setCount] = useState(0)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  const first = all.find((p) => p.pose === pose)
  const day = first ? daysBetween(first.d, today()) + 1 : 1
  const isDayOne = !first
  const firstId = first?.id

  // The day-one shot of this pose, faded over the viewfinder to line the new one up.
  useEffect(() => {
    setGhost(null)
    if (firstId) void loadPhoto(firstId).then(setGhost)
  }, [firstId])

  // Bumped by every start and stop, so a camera that opens late cannot undo a newer choice.
  const gen = useRef(0)
  const stop = useCallback(() => {
    gen.current += 1
    for (const t of stream.current?.getTracks() ?? []) t.stop()
    stream.current = null
  }, [])

  const start = useCallback(
    async (f: Facing) => {
      stop()
      const my = gen.current
      setPhase('camera')
      if (!navigator.mediaDevices?.getUserMedia || !(await ensureCameraPermission()))
        return my === gen.current && setPhase('nocamera')
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: f, width: { ideal: 1920 }, height: { ideal: 1920 } },
          audio: false,
        })
        if (my !== gen.current) {
          for (const t of s.getTracks()) t.stop()
          return
        }
        stream.current = s
        if (video.current) {
          video.current.srcObject = s
          await video.current.play().catch(() => {})
        }
      } catch {
        if (my === gen.current) setPhase('nocamera')
      }
    },
    [stop],
  )

  useEffect(() => {
    void start(facing)
    return stop
  }, [start, stop, facing])

  useEffect(
    () => () => {
      if (tick.current) clearInterval(tick.current)
    },
    [],
  )

  const snap = async () => {
    const v = video.current
    if (!v?.videoWidth) return
    const shot = await cropPortrait(v, { mirror: facing === 'user' })
    thud()
    stop()
    setStill(shot)
    setPhase('review')
  }

  const shutter = () => {
    if (count) {
      if (tick.current) clearInterval(tick.current)
      return setCount(0)
    }
    if (!timer) return void snap()
    let n: number = timer
    setCount(n)
    tick.current = setInterval(() => {
      n -= 1
      setCount(n)
      if (n <= 0) {
        if (tick.current) clearInterval(tick.current)
        void snap()
      }
    }, 1000)
  }

  const fromGallery = async () => {
    const p = await pickPhoto()
    if (!p) return
    stop()
    setStill(await cropPortrait(p))
    setPhase('review')
  }

  const retake = () => {
    setStill(null)
    void start(facing)
  }

  const save = async () => {
    if (!still) return
    const id = `pp_${Date.now().toString(36)}`
    await savePhoto(id, still)
    add({ id, d: today(), t: Date.now(), pose })
    success()
    if (isDayOne) {
      toast('Day one saved. Next photo in four weeks.')
      router.replace('/progress/')
    } else {
      toast('Photo saved')
      router.replace(`/progress/compare/?pose=${pose}&id=${id}`)
    }
  }

  const poseLabel = POSES.find((p) => p.value === pose)?.label ?? 'Front'

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'var(--sy-void)' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,107,61,0.16), rgba(255,107,61,0) 70%)',
        }}
      />

      {/* Top bar */}
      <header
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: 'calc(10px + var(--sy-safe-top))',
          display: 'grid',
          gridTemplateColumns: '44px minmax(0,1fr) 44px',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <IconButton icon="close" label="Close" onClick={() => router.back()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span
            className="sy-mono"
            style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--sy-peach-text)' }}
          >
            {isDayOne ? 'DAY ONE' : `DAY ${day}`} · {poseLabel.toUpperCase()}
          </span>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: '-0.02em' }}>
            {isDayOne ? 'Day-one photo' : 'Check-in photo'}
          </h1>
        </div>
        {phase === 'camera' ? (
          <IconButton
            icon="loop"
            label={facing === 'user' ? 'Use the back camera' : 'Use the front camera'}
            onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}
          />
        ) : (
          <span />
        )}
      </header>

      {/* Viewfinder, 3:4 so every photo lines up with the last */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 'calc(66px + var(--sy-safe-top))',
          width:
            'min(calc(100% - 24px), calc((100dvh - 370px - var(--sy-safe-top) - var(--sy-safe-bottom)) * 0.75))',
          aspectRatio: '3 / 4',
          borderRadius: 28,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(170deg, #2A302C 0%, #151917 100%)',
        }}
      >
        <LiveVideo
          ref={video}
          visible={phase === 'camera'}
          mirror={facing === 'user'}
          label="Camera preview"
        />
        {still ? (
          // biome-ignore lint/performance/noImgElement: local photo
          <img
            src={still}
            alt="You, just now"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        {phase === 'camera' && ghost && ghostOn ? (
          // biome-ignore lint/performance/noImgElement: local photo
          <img
            src={ghost}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          />
        ) : null}
        {phase === 'camera' && !(ghost && ghostOn) ? <FrameGuide /> : null}
        {phase === 'nocamera' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 28,
              textAlign: 'center',
            }}
          >
            <Icon name="camera" size={28} style={{ color: 'var(--sy-peach)' }} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: 'var(--sy-text-72)' }}>
              The camera is not available here. Pick a photo from your gallery instead.
            </p>
          </div>
        ) : null}

        {/* The one rule that matters most */}
        <span
          className="sy-mono"
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            height: 28,
            padding: '0 11px',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--sy-peach-badge)',
            background: 'rgba(10,13,12,0.55)',
            border: '1px solid rgba(255,199,176,0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          NO FLEX
        </span>
        {phase === 'camera' && ghost ? (
          <button
            type="button"
            aria-pressed={ghostOn}
            onClick={() => setGhostOn(!ghostOn)}
            style={{
              position: 'absolute',
              right: 8,
              top: 4,
              minHeight: 44,
              padding: '0 6px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <span
              style={{
                height: 28,
                padding: '0 11px',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                color: ghostOn ? 'var(--sy-bone)' : 'var(--sy-text-66)',
                background: ghostOn ? 'rgba(169,195,160,0.3)' : 'rgba(10,13,12,0.55)',
                border: `1px solid ${ghostOn ? 'rgba(169,195,160,0.45)' : 'rgba(255,255,255,0.12)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              Day one overlay
            </span>
          </button>
        ) : null}

        <AnimatePresence>
          {count ? (
            <motion.div
              key={count}
              role="timer"
              aria-live="assertive"
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="sy-dot"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 120,
                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
              }}
            >
              {count}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'calc(28px + var(--sy-safe-bottom))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '0 20px',
        }}
      >
        <ul
          aria-label="How to take it"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            width: '100%',
            maxWidth: 360,
          }}
        >
          {PHOTO_RULES.map((r, i) => (
            <li
              key={r}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                fontSize: 13,
                color: i === 0 ? 'var(--sy-bone)' : 'var(--sy-text-66)',
              }}
            >
              <Icon
                name="check"
                size={14}
                style={{ color: i === 0 ? 'var(--sy-peach)' : 'var(--sy-sage)', flexShrink: 0 }}
              />
              {r}
            </li>
          ))}
        </ul>

        {phase === 'review' ? (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 400, marginTop: 4 }}>
            <PillButton variant="glass" icon="loop" block onClick={retake}>
              Retake
            </PillButton>
            <PillButton icon="check" block onClick={save}>
              Save photo
            </PillButton>
          </div>
        ) : (
          <>
            <TrackSegmented label="Pose" value={pose} onChange={setPose} options={POSES} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 76px 1fr',
                alignItems: 'center',
                width: '100%',
                maxWidth: 320,
              }}
            >
              <button
                type="button"
                aria-label={`Self-timer: ${timer ? `${timer} seconds` : 'off'}`}
                onClick={() => setTimer(TIMERS[(TIMERS.indexOf(timer) + 1) % TIMERS.length])}
                className="sy-glass-dark"
                style={{
                  justifySelf: 'start',
                  height: 44,
                  minWidth: 64,
                  padding: '0 12px',
                  borderRadius: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  color: timer ? 'var(--sy-peach)' : 'var(--sy-text-72)',
                  font: 'inherit',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Icon name="stopwatch" size={16} />
                {timer ? `${timer}s` : 'Off'}
              </button>
              <button
                type="button"
                aria-label={count ? 'Cancel timer' : 'Take photo'}
                onClick={phase === 'camera' ? shutter : fromGallery}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  border: '3px solid var(--sy-bone)',
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
              <IconButton
                icon="gallery"
                label="Choose from gallery"
                onClick={fromGallery}
                style={{ justifySelf: 'end' }}
              />
            </div>
          </>
        )}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            color: 'var(--sy-text-50)',
          }}
        >
          <Icon name="lock" size={12} />
          Stays on this phone. Never sent to Gemini.
        </span>
      </div>
    </div>
  )
}
