'use client'

import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { del, get, set } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'
import { isNative } from './native'

/*
 * One JSON document per store. Android: the app's private files directory (not evictable,
 * survives updates). Web: IndexedDB. localStorage is avoided because of its ~5 MB quota.
 */
const path = (name: string) => `state/${name}.json`

const nativeStorage: StateStorage = {
  async getItem(name) {
    try {
      const r = await Filesystem.readFile({
        path: path(name),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })
      return typeof r.data === 'string' ? r.data : null
    } catch {
      return null
    }
  },
  async setItem(name, value) {
    // Write to a temp file then rename so a crash never leaves half a file.
    const tmp = `${path(name)}.tmp`
    await Filesystem.writeFile({
      path: tmp,
      data: value,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    await Filesystem.rename({
      from: tmp,
      to: path(name),
      directory: Directory.Data,
      toDirectory: Directory.Data,
    })
  },
  async removeItem(name) {
    try {
      await Filesystem.deleteFile({ path: path(name), directory: Directory.Data })
    } catch {}
  },
}

const webStorage: StateStorage = {
  getItem: async (name) => ((await get(`sy:${name}`)) as string | undefined) ?? null,
  setItem: (name, value) => set(`sy:${name}`, value),
  removeItem: (name) => del(`sy:${name}`),
}

/** Debounced writes: a burst of taps (steppers) becomes one file write. */
function debounced(inner: StateStorage, ms = 350): StateStorage {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const pending = new Map<string, string>()
  const flush = (name: string) => {
    const v = pending.get(name)
    if (v == null) return
    pending.delete(name)
    void inner.setItem(name, v)
  }
  if (typeof window !== 'undefined') {
    const flushAll = () => {
      for (const n of [...pending.keys()]) flush(n)
    }
    window.addEventListener('pagehide', flushAll)
    document.addEventListener(
      'visibilitychange',
      () => document.visibilityState === 'hidden' && flushAll(),
    )
  }
  return {
    getItem: (name) => (pending.has(name) ? (pending.get(name) as string) : inner.getItem(name)),
    setItem(name, value) {
      pending.set(name, value)
      clearTimeout(timers.get(name))
      timers.set(
        name,
        setTimeout(() => flush(name), ms),
      )
    },
    removeItem: (name) => {
      pending.delete(name)
      return inner.removeItem(name)
    },
  }
}

let cached: StateStorage | null = null
export function appStorage(): StateStorage {
  if (!cached) cached = debounced(isNative() ? nativeStorage : webStorage)
  return cached
}

/** Photos: files on Android, IndexedDB blobs (as data URLs) on the web. */
export async function savePhoto(id: string, dataUrl: string): Promise<void> {
  if (isNative()) {
    await Filesystem.writeFile({
      path: `photos/${id}.jpg`,
      data: dataUrl.split(',')[1] ?? '',
      directory: Directory.Data,
      recursive: true,
    })
  } else {
    await set(`sy:photo:${id}`, dataUrl)
  }
}

export async function loadPhoto(id: string): Promise<string | null> {
  try {
    if (isNative()) {
      const r = await Filesystem.readFile({ path: `photos/${id}.jpg`, directory: Directory.Data })
      return typeof r.data === 'string' ? `data:image/jpeg;base64,${r.data}` : null
    }
    return ((await get(`sy:photo:${id}`)) as string | undefined) ?? null
  } catch {
    return null
  }
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    if (isNative())
      await Filesystem.deleteFile({ path: `photos/${id}.jpg`, directory: Directory.Data })
    else await del(`sy:photo:${id}`)
  } catch {}
}
