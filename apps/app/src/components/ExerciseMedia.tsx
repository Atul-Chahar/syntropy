'use client'

import { BODY_MUSCLES, BodyMap } from '@syntropy/ui'
import { useState } from 'react'
import { EX } from '@/lib/ex'
import MAP from '@/lib/exercisedb-map.json'
import { primaryMusclesOf } from '@/lib/summary'

/*
 * Exercise animations come from ExerciseDB's free V1 API (non-commercial use with attribution:
 * "Animation: ExerciseDB"). They stream from its CDN at runtime and are never stored in the repo
 * or the APK; the map below only links our catalogue ids to ExerciseDB V1 ids by name.
 * Without a match, offline, or on error, the exercise's muscle map is shown instead.
 */
const GIF = (v1: string) => `https://static.exercisedb.dev/media/${v1}.gif`
const V1 = MAP as Record<string, string>

export const hasAnimation = (exId: string) => !!V1[exId]

const BACK = new Set(BODY_MUSCLES.back.filter((m) => !BODY_MUSCLES.front.includes(m)))

function MuscleFallback({ exId, size }: { exId: string; size: number }) {
  const ex = EX[exId]
  const prim = primaryMusclesOf(exId)
  const side = prim.some((m) => BACK.has(m)) ? 'back' : 'front'
  const states = Object.fromEntries([
    ...(ex?.sm ?? []).map((m) => [m.split(' ')[0], 'secondary']),
    ...prim.map((m) => [m, 'primary']),
  ])
  return <BodyMap side={side} states={states} width={Math.round(size * 0.48)} glow={size > 90} />
}

/**
 * Square exercise demo: the ExerciseDB animation on a soft bone tile (its white background
 * multiplies into the tile), a shimmer while it loads, and the muscle map as the fallback.
 */
export function ExerciseMedia({
  exId,
  size = 56,
  radius,
  credit = false,
}: {
  exId: string
  size?: number | '100%'
  radius?: number
  /** Show the required "Animation: ExerciseDB" line under large demos. */
  credit?: boolean
}) {
  const v1 = V1[exId]
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const px = size === '100%' ? 320 : size
  const r = radius ?? (px <= 64 ? 16 : 28)
  const showGif = v1 && state !== 'error'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: size, flexShrink: 0 }}>
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: r,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: showGif
            ? '#EDEAE3'
            : 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
          border: `1px solid ${showGif ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
          transition: 'background 300ms',
        }}
      >
        {showGif ? (
          <>
            {state === 'loading' ? (
              <span className="sy-shimmer" style={{ position: 'absolute', inset: 0 }} />
            ) : null}
            {/* biome-ignore lint/performance/noImgElement: remote animated GIF, no optimisation in a static export */}
            <img
              src={GIF(v1)}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => setState('ok')}
              onError={() => setState('error')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                mixBlendMode: 'multiply',
                opacity: state === 'ok' ? 1 : 0,
                transition: 'opacity 260ms var(--sy-ease)',
              }}
            />
          </>
        ) : (
          <MuscleFallback exId={exId} size={px} />
        )}
      </div>
      {credit && showGif ? (
        <span
          className="sy-mono"
          style={{ fontSize: 9.5, letterSpacing: '0.04em', color: 'rgba(243,241,236,0.42)' }}
        >
          ANIMATION: EXERCISEDB
        </span>
      ) : null}
    </div>
  )
}
