'use client'

import { BodyMap, Icon, IconButton, type MuscleStates, Screen, TrackSegmented } from '@syntropy/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { FormFigure, isPullFamily, TEMPO_CSS } from '@/components/FormFigure'
import { EX, exTitle } from '@/lib/ex'
import { primaryMusclesOf } from '@/lib/summary'

const CUES = [
  'Drive your elbows down toward your ribs.',
  'Chin clears the bar. Chest up, pause.',
  'Lower slowly to a full, active hang.',
]
const AVOID = ['Kipping or swinging to reach the bar', 'Stopping short of a full hang between reps']

/** FormGuide.dc.html: the full-screen loop with tempo bar and cues. */
export function FormGuideScreen() {
  const router = useRouter()
  const id = useSearchParams().get('ex') ?? '2330'
  const name = exTitle(id)
  const pull = isPullFamily(name)
  const [mode, setMode] = useState<'3d' | 'steps'>(pull ? '3d' : 'steps')
  const [angle, setAngle] = useState<'side' | 'front'>('side')
  const [speed, setSpeed] = useState<0.5 | 1>(1)
  const [paused, setPaused] = useState(false)
  const anim = ['mq-wrap', speed === 0.5 ? 'mq-slow' : '', paused ? 'mq-paused' : ''].join(' ')
  const steps = EX[id]?.st ?? []
  const states = Object.fromEntries(
    primaryMusclesOf(id).map((m) => [m, 'fatigued']),
  ) as MuscleStates

  return (
    <Screen
      orbs={[{ tone: 'ember', strength: 0.3, size: 520, right: -260, bottom: -220 }]}
      contentClassName="fg"
    >
      <style>{`${TEMPO_CSS} .fg{padding-top:0 !important}`}</style>
      <section
        aria-label="Form demonstration"
        style={{
          position: 'relative',
          margin: '0 -20px',
          height: 486,
          overflow: 'hidden',
          borderRadius: '0 0 40px 40px',
          background: 'linear-gradient(180deg, #151A17 0%, #0D110F 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {mode === '3d' && pull ? (
          <div style={{ position: 'absolute', left: '50%', marginLeft: -165, top: 70 }}>
            <FormFigure view={angle} width={330} speed={speed} paused={paused} />
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              paddingTop: 40,
            }}
          >
            <BodyMap side="front" states={states} width={130} />
            <BodyMap side="back" states={states} width={130} />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: 'max(60px, calc(var(--sy-safe-top) + 16px))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <IconButton icon="close" label="Close form guide" onClick={() => router.back()} />
          {pull ? (
            <TrackSegmented
              label="Demo type"
              value={mode}
              onChange={setMode}
              options={[
                { value: '3d', label: '3D model' },
                { value: 'steps', label: 'Muscles' },
              ]}
            />
          ) : (
            <span
              className="sy-glass-dark"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              Working muscles
            </span>
          )}
          <IconButton icon="loop" label="Restart loop" onClick={() => setPaused(false)} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {mode === '3d' && pull ? (
            <TrackSegmented
              label="Camera angle"
              value={angle}
              onChange={setAngle}
              options={[
                { value: 'side', label: 'Side' },
                { value: 'front', label: 'Front' },
              ]}
            />
          ) : (
            <span />
          )}
          <span
            className="sy-glass-dark"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 12px',
              borderRadius: 18,
              fontSize: 11.5,
              color: 'rgba(243,241,236,0.8)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                background: '#FF6B3D',
                boxShadow: '0 0 8px rgba(255,107,61,0.9)',
              }}
            />
            Working muscle
          </span>
        </div>
      </section>

      <section
        aria-label="Rep tempo"
        className={anim}
        style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.03em' }}>{name}</span>
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.55)', whiteSpace: 'nowrap' }}
          >
            TEMPO 1.3 · 0.4 · 1.5 S
          </span>
        </div>
        <div style={{ position: 'relative', height: 26 }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              display: 'grid',
              gridTemplateColumns: '40fr 12fr 48fr',
              gap: 3,
            }}
          >
            <span style={{ height: 6, borderRadius: 3, background: 'rgba(255,107,61,0.55)' }} />
            <span style={{ height: 6, borderRadius: 3, background: 'rgba(255,199,176,0.55)' }} />
            <span style={{ height: 6, borderRadius: 3, background: 'rgba(169,195,160,0.55)' }} />
          </div>
          <div
            className="mq-playhead"
            style={{ position: 'absolute', left: 0, top: -3, width: '100%', height: 12 }}
          >
            <span
              style={{
                position: 'absolute',
                left: -6,
                top: 0,
                width: 12,
                height: 12,
                borderRadius: 6,
                background: '#F3F1EC',
                boxShadow: '0 0 10px rgba(243,241,236,0.8)',
              }}
            />
          </div>
          <div
            className="sy-mono"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 14,
              display: 'grid',
              gridTemplateColumns: '40fr 12fr 48fr',
              gap: 3,
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'rgba(243,241,236,0.55)',
            }}
          >
            <span>{pull ? 'PULL' : 'LIFT'}</span>
            <span>HOLD</span>
            <span>LOWER</span>
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            height: 64,
            borderRadius: 20,
            background: 'rgba(255,199,176,0.06)',
            border: '1px solid rgba(255,199,176,0.14)',
          }}
        >
          {(pull
            ? CUES
            : [
                steps[0] ?? 'Brace and move with control.',
                'Pause briefly at the top.',
                'Lower under control to the start.',
              ]
          ).map((c, k) => (
            <div
              key={c}
              className={`mq-cue${k}`}
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14.5,
                lineHeight: 1.3,
              }}
            >
              <Icon name="sparkle" size={15} style={{ color: '#FFC7B0' }} />
              <span
                style={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {c}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <IconButton
          icon={paused ? 'play' : 'pause'}
          label={paused ? 'Play' : 'Pause'}
          size={52}
          variant="bone"
          onClick={() => setPaused(!paused)}
        />
        <div
          role="group"
          aria-label="Playback speed"
          style={{
            display: 'flex',
            gap: 2,
            padding: 4,
            borderRadius: 26,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {([0.5, 1] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 18,
                border: 0,
                font: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                background: speed === s ? '#F3F1EC' : 'transparent',
                color: speed === s ? '#0B0F0D' : 'rgba(243,241,236,0.75)',
              }}
            >
              {s}×
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(243,241,236,0.5)' }}>
          Loops until you close
        </span>
      </div>

      <section
        aria-label="Avoid"
        style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 30 }}
      >
        <span
          className="sy-mono"
          style={{ fontSize: 11, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.5)' }}
        >
          {pull ? 'AVOID' : 'HOW TO'}
        </span>
        {(pull ? AVOID : steps.slice(0, 6)).map((m) => (
          <div
            key={m}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              fontSize: 13.5,
              lineHeight: 1.45,
              color: 'rgba(243,241,236,0.8)',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pull ? 'rgba(255,107,61,0.14)' : 'rgba(169,195,160,0.12)',
                color: pull ? '#FFB79A' : '#C9DCBF',
              }}
            >
              <Icon name={pull ? 'close' : 'check'} size={12} stroke={2} />
            </span>
            {m}
          </div>
        ))}
      </section>
    </Screen>
  )
}
