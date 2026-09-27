'use client'

import { cancelRest, scheduleRestEnd } from '@/platform/notifications'
import { useSettings, useUi } from '@/stores'

export function startRest(label: string, seconds = useSettings.getState().restSec) {
  const endsAt = Date.now() + seconds * 1000
  useUi.getState().setRest({ endsAt, total: seconds, label })
  void scheduleRestEnd(endsAt, label)
}

export function addRest(seconds: number) {
  const r = useUi.getState().rest
  if (!r) return
  const endsAt = r.endsAt + seconds * 1000
  useUi.getState().setRest({ ...r, endsAt, total: r.total + seconds })
  void scheduleRestEnd(endsAt, r.label)
}

export function skipRest() {
  useUi.getState().setRest(null)
  void cancelRest()
}
