'use client'

import {
  BottomSheet,
  EmptyState,
  GlassCard,
  Icon,
  IconButton,
  PillButton,
  Screen,
  Segmented,
} from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react'
import { BottomBar, Header } from '@/components/BottomBar'
import { addDays, daysBetween, shortDate, today } from '@/lib/dates'
import { PHOTO_EVERY, POSES, useProgressPhotos, weightNear } from '@/lib/photos'
import { deletePhoto, loadPhoto } from '@/platform/storage'
import { type Pose, type ProgressPhoto, toast, usePhotos, useTraining } from '@/stores'

function usePhotoSrc(id?: string) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    setSrc(null)
    if (id) void loadPhoto(id).then(setSrc)
  }, [id])
  return src
}

function Img({
  src,
  alt,
  style,
}: {
  src: string | null
  alt: string
  style?: React.CSSProperties
}) {
  return src ? (
    // biome-ignore lint/performance/noImgElement: local photo
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }}
    />
  ) : null
}

function Label({
  kicker,
  value,
  align,
}: {
  kicker: string
  value: string
  align: 'left' | 'right'
}) {
  return (
    <span
      style={{
        position: 'absolute',
        top: 12,
        [align]: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
        gap: 1,
        padding: '6px 10px',
        borderRadius: 14,
        background: 'rgba(10,13,12,0.55)',
        backdropFilter: 'blur(12px)',
        pointerEvents: 'none',
      }}
    >
      <span
        className="sy-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          color: align === 'left' ? 'var(--sy-peach-text)' : 'var(--sy-sage-light)',
        }}
      >
        {kicker}
      </span>
      <span style={{ fontSize: 12.5 }}>{value}</span>
    </span>
  )
}

/** Day one under, the newer photo over it, revealed by dragging the divider. */
function Slider({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: string | null
  after: string | null
  beforeLabel: [string, string]
  afterLabel: [string, string]
}) {
  const box = useRef<HTMLDivElement>(null)
  const [pct, setPct] = useState(50)
  const drag = useRef(false)
  const move = (e: PointerEvent) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    setPct(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
  }
  const key = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0
    if (!step) return
    e.preventDefault()
    setPct((p) => Math.min(100, Math.max(0, p + step)))
  }
  return (
    <div
      ref={box}
      onPointerDown={(e) => {
        drag.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={(e) => drag.current && move(e)}
      onPointerUp={() => {
        drag.current = false
      }}
      style={{
        position: 'relative',
        aspectRatio: '3 / 4',
        borderRadius: 28,
        overflow: 'hidden',
        touchAction: 'pan-y',
        userSelect: 'none',
        cursor: 'ew-resize',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(170deg, #2A302C 0%, #151917 100%)',
      }}
    >
      <Img src={before} alt={`Day one, ${beforeLabel[1]}`} />
      <Img
        src={after}
        alt={`${afterLabel[0]}, ${afterLabel[1]}`}
        style={{ clipPath: `inset(0 0 0 ${pct}%)` }}
      />
      <Label kicker={beforeLabel[0]} value={beforeLabel[1]} align="left" />
      <Label kicker={afterLabel[0]} value={afterLabel[1]} align="right" />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${pct}%`,
          width: 2,
          marginLeft: -1,
          background: 'var(--sy-bone)',
          boxShadow: '0 0 12px rgba(0,0,0,0.4)',
        }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Compare day one with the newer photo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={`${Math.round(100 - pct)}% of the newer photo shown`}
        onKeyDown={key}
        style={{
          position: 'absolute',
          top: '50%',
          left: `${pct}%`,
          width: 44,
          height: 44,
          margin: '-22px 0 0 -22px',
          borderRadius: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sy-void)',
          background: 'var(--sy-bone)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        }}
      >
        <Icon name="chevronLeft" size={14} stroke={2.2} />
        <Icon name="chevronRight" size={14} stroke={2.2} />
      </div>
    </div>
  )
}

function SideBySide({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: string | null
  after: string | null
  beforeLabel: [string, string]
  afterLabel: [string, string]
}) {
  const cell = {
    position: 'relative',
    aspectRatio: '3 / 4',
    borderRadius: 22,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'linear-gradient(170deg, #2A302C 0%, #151917 100%)',
  } as const
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
      <div style={cell}>
        <Img src={before} alt={`Day one, ${beforeLabel[1]}`} />
        <Label kicker={beforeLabel[0]} value={beforeLabel[1]} align="left" />
      </div>
      <div style={cell}>
        <Img src={after} alt={`${afterLabel[0]}, ${afterLabel[1]}`} />
        <Label kicker={afterLabel[0]} value={afterLabel[1]} align="left" />
      </div>
    </div>
  )
}

function Thumb({
  p,
  day,
  on,
  onClick,
}: {
  p: ProgressPhoto
  day: number
  on: boolean
  onClick: () => void
}) {
  const src = usePhotoSrc(p.id)
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Photo from ${shortDate(p.d)}, day ${day}`}
      onClick={onClick}
      style={{
        position: 'relative',
        flex: '0 0 auto',
        width: 66,
        height: 88,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 0,
        cursor: 'pointer',
        border: `1.5px solid ${on ? 'var(--sy-bone)' : 'rgba(255,255,255,0.1)'}`,
        background: 'linear-gradient(170deg, #2A302C 0%, #151917 100%)',
      }}
    >
      <Img src={src} alt="" />
      <span
        className="sy-mono"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 0 5px',
          fontSize: 9.5,
          letterSpacing: '0.04em',
          color: 'var(--sy-bone)',
          background: 'linear-gradient(180deg, rgba(10,13,12,0), rgba(10,13,12,0.8))',
        }}
      >
        {day === 1 ? 'DAY 1' : shortDate(p.d).toUpperCase()}
      </span>
    </button>
  )
}

export function PhotoCompareScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const all = useProgressPhotos()
  const bodyweight = useTraining((s) => s.S.bodyweight)
  const [pose, setPose] = useState<Pose>((params.get('pose') as Pose) || 'front')
  const [pick, setPick] = useState<string | null>(params.get('id'))
  const [mode, setMode] = useState<'slide' | 'side'>('slide')
  const [confirm, setConfirm] = useState(false)

  const list = all.filter((p) => p.pose === pose)
  const first = list[0]
  const after = list.find((p) => p.id === pick) ?? list[list.length - 1]
  const beforeSrc = usePhotoSrc(first?.id)
  const afterSrc = usePhotoSrc(after?.id)

  const dayOf = (d: string) => (first ? daysBetween(first.d, d) + 1 : 1)
  const wLabel = (d: string) => {
    const w = weightNear(bodyweight, d)
    return w != null ? `${shortDate(d)} · ${w.toFixed(1)} kg` : shortDate(d)
  }
  const w0 = first ? weightNear(bodyweight, first.d) : null
  const w1 = after ? weightNear(bodyweight, after.d) : null
  const delta = w0 != null && w1 != null ? w1 - w0 : null
  const single = !first || !after || first.id === after.id
  const lastFront = list[list.length - 1]
  const nextIn = lastFront ? PHOTO_EVERY - daysBetween(lastFront.d, today()) : 0

  const remove = async () => {
    if (!after) return
    if (usePhotos.getState().photos.some((p) => p.id === after.id))
      usePhotos.getState().remove(after.id)
    else
      useTraining.getState().update((s) => {
        for (const b of s.bodyweight) if (b.photoId === after.id) delete b.photoId
      })
    await deletePhoto(after.id)
    setPick(null)
    setConfirm(false)
    toast('Photo deleted')
  }

  const kicker = single
    ? first
      ? `DAY 1 · ${shortDate(first.d).toUpperCase()}`
      : 'PROGRESS PHOTOS'
    : `DAY ${dayOf(after.d)}${delta != null ? ` · ${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta).toFixed(1)} KG` : ''}`

  return (
    <Screen
      orbs={[
        { tone: 'peach', strength: 0.3, right: -240, top: -160 },
        { tone: 'sage', strength: 0.34, left: -260, bottom: -220 },
      ]}
      contentClassName="pb-cta"
    >
      <Header
        kicker={kicker}
        title="Then and now"
        right={<IconButton icon="close" label="Close" onClick={() => router.back()} />}
      />
      <Segmented
        label="Pose"
        value={pose}
        onChange={(p) => {
          setPose(p)
          setPick(null)
        }}
        options={POSES}
      />

      {!first ? (
        <GlassCard padding={0}>
          <EmptyState
            icon="camera"
            title={`No ${pose} photo yet`}
            body="Take one now and it becomes day one for this pose. Relaxed, no flex."
            action={
              <PillButton height={48} icon="camera" href={`/progress/photo/?pose=${pose}`}>
                Take a {pose} photo
              </PillButton>
            }
          />
        </GlassCard>
      ) : single ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              position: 'relative',
              aspectRatio: '3 / 4',
              borderRadius: 28,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(170deg, #2A302C 0%, #151917 100%)',
            }}
          >
            <Img src={beforeSrc} alt={`Day one, ${shortDate(first.d)}`} />
            <Label kicker="DAY ONE" value={wLabel(first.d)} align="left" />
          </div>
          <p style={{ margin: '0 4px', fontSize: 13, color: 'var(--sy-text-66)' }}>
            {nextIn > 0
              ? `This is your starting point. Your next photo is due in ${nextIn} ${nextIn === 1 ? 'day' : 'days'}, on ${shortDate(addDays(lastFront.d, PHOTO_EVERY))}.`
              : 'This is your starting point. A new photo is due, so you can see the change.'}
          </p>
        </div>
      ) : mode === 'slide' ? (
        <Slider
          before={beforeSrc}
          after={afterSrc}
          beforeLabel={['DAY ONE', wLabel(first.d)]}
          afterLabel={[
            after.id === lastFront.id ? 'NOW' : `DAY ${dayOf(after.d)}`,
            wLabel(after.d),
          ]}
        />
      ) : (
        <SideBySide
          before={beforeSrc}
          after={afterSrc}
          beforeLabel={['DAY ONE', wLabel(first.d)]}
          afterLabel={[
            after.id === lastFront.id ? 'NOW' : `DAY ${dayOf(after.d)}`,
            wLabel(after.d),
          ]}
        />
      )}

      {first && !single ? (
        <Segmented
          label="Layout"
          value={mode}
          onChange={setMode}
          height={36}
          options={[
            { value: 'slide', label: 'Slider' },
            { value: 'side', label: 'Side by side' },
          ]}
        />
      ) : null}

      {list.length > 1 ? (
        <section
          aria-label="Timeline"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '0 4px',
            }}
          >
            <span style={{ fontSize: 15 }}>Timeline</span>
            <span style={{ fontSize: 12, color: 'var(--sy-text-55)' }}>
              {list.length} photos · {daysBetween(first.d, lastFront.d)} days
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              margin: '0 -20px',
              padding: '0 20px 4px',
              scrollbarWidth: 'none',
            }}
          >
            {list.map((p) => (
              <Thumb
                key={p.id}
                p={p}
                day={dayOf(p.d)}
                on={p.id === after?.id}
                onClick={() => setPick(p.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {after ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          style={{
            alignSelf: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            padding: '0 12px',
            border: 0,
            background: 'transparent',
            color: 'var(--sy-text-55)',
            font: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Icon name="trash" size={15} />
          Delete the {shortDate(after.d)} photo
        </button>
      ) : null}

      <BottomBar>
        <PillButton icon="camera" block href={`/progress/photo/?pose=${pose}`}>
          {first ? 'Take a check-in photo' : 'Take a day-one photo'}
        </PillButton>
      </BottomBar>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title="Delete this photo?">
        <div style={{ display: 'grid', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--sy-text-72)' }}>
            {after && first && after.id === first.id
              ? 'This is your day-one photo. The next oldest becomes day one.'
              : 'It is removed from this phone. There is no other copy.'}
          </p>
          <PillButton variant="glass" block onClick={() => setConfirm(false)}>
            Keep it
          </PillButton>
          <PillButton
            variant="ghost"
            icon="trash"
            block
            onClick={remove}
            style={{ color: 'var(--sy-fatigued)' }}
          >
            Delete photo
          </PillButton>
        </div>
      </BottomSheet>
    </Screen>
  )
}
