'use client'

import { create, type StateCreator } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { appStorage } from '@/platform/storage'

/** A Zustand store persisted as one JSON document through the platform storage adapter. */
export function persisted<T extends object>(
  name: string,
  init: StateCreator<T, [], []>,
  version = 1,
  migrate?: (s: unknown, v: number) => T,
) {
  return create<T>()(
    persist(init, {
      name,
      version,
      storage: createJSONStorage(() => appStorage()),
      skipHydration: true,
      migrate: migrate as never,
    }),
  )
}

type Hydratable = { persist: { rehydrate: () => Promise<void> | void; hasHydrated: () => boolean } }

export async function hydrateAll(stores: Hydratable[]) {
  await Promise.all(stores.map((s) => s.persist.rehydrate()))
}
