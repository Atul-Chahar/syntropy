'use client'

import { useMemo } from 'react'
import { type Pose, type ProgressPhoto, usePhotos, useTraining } from '@/stores'
import { daysBetween, today } from './dates'

/** Days between check-in photos. */
export const PHOTO_EVERY = 28

export const POSES: { value: Pose; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
]

/** The same rules every time, so changes in the photos are changes in the body. */
export const PHOTO_RULES = [
  'Relaxed, no flex. Arms loose by your sides.',
  'Same spot, same light, same time of day.',
  'Phone at chest height, head to knees in frame.',
]

/** Every progress photo, oldest first. Weigh-ins that carry a photo (1.0) count as front shots. */
export function useProgressPhotos(): ProgressPhoto[] {
  const photos = usePhotos((s) => s.photos)
  const bodyweight = useTraining((s) => s.S.bodyweight)
  return useMemo(() => {
    const own = new Set(photos.map((p) => p.id))
    const legacy: ProgressPhoto[] = bodyweight
      .filter((b) => b.photoId && !own.has(b.photoId))
      .map((b) => ({ id: b.photoId as string, d: b.d, t: b.t ?? 0, pose: 'front' }))
    return [...legacy, ...photos].sort((a, b) => a.d.localeCompare(b.d) || a.t - b.t)
  }, [photos, bodyweight])
}

/** The weigh-in closest to a date (within a week), for labelling a photo. */
export function weightNear(bodyweight: { d: string; w: number }[], d: string): number | null {
  let best: { w: number; gap: number } | null = null
  for (const b of bodyweight) {
    const gap = Math.abs(daysBetween(b.d, d))
    if (gap <= 7 && (!best || gap < best.gap)) best = { w: b.w, gap }
  }
  return best?.w ?? null
}

/** Whether to ask for a photo: none yet, or the last front shot is a month old. */
export function photoDue(
  photos: ProgressPhoto[],
  snoozedUntil: string | null,
  now = today(),
): { kind: 'first' } | { kind: 'due'; days: number; day: number } | null {
  if (snoozedUntil && now < snoozedUntil) return null
  const front = photos.filter((p) => p.pose === 'front')
  if (!front.length) return { kind: 'first' }
  const days = daysBetween(front[front.length - 1].d, now)
  if (days < PHOTO_EVERY) return null
  return { kind: 'due', days, day: daysBetween(front[0].d, now) + 1 }
}
