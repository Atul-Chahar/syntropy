'use client'

import { persisted } from './persist'

export type Pose = 'front' | 'side' | 'back'

/** A progress photo. The image is a file (platform/storage), never state. */
export interface ProgressPhoto {
  id: string
  d: string
  t: number
  pose: Pose
}

type PhotoStore = {
  photos: ProgressPhoto[]
  /** Date (YYYY-MM-DD) before which the photo nudge stays hidden. */
  snoozedUntil: string | null
  add: (p: ProgressPhoto) => void
  remove: (id: string) => void
  snooze: (until: string) => void
}

export const usePhotos = persisted<PhotoStore>('photos', (set) => ({
  photos: [],
  snoozedUntil: null,
  add: (p) =>
    set((s) => ({ photos: [...s.photos, p].sort((a, b) => a.d.localeCompare(b.d) || a.t - b.t) })),
  remove: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
  snooze: (until) => set({ snoozedUntil: until }),
}))
