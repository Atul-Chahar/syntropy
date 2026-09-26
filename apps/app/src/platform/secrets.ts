'use client'

import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import { isNative } from './native'

/*
 * The Gemini key lives in the Android Keystore-backed secure storage and nowhere else:
 * never in a store, an export, a log or the bundle. On the web (development and the demo)
 * it falls back to sessionStorage, which dies with the tab.
 */
const KEY = 'gemini-api-key'

export async function getApiKey(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    if (isNative()) return ((await SecureStorage.get(KEY)) as string | null) ?? null
    return window.sessionStorage.getItem(`sy:${KEY}`)
  } catch {
    return null
  }
}

export async function setApiKey(value: string): Promise<void> {
  const v = value.trim()
  if (isNative()) await SecureStorage.set(KEY, v)
  else window.sessionStorage.setItem(`sy:${KEY}`, v)
}

export async function clearApiKey(): Promise<void> {
  if (isNative()) await SecureStorage.remove(KEY)
  else window.sessionStorage.removeItem(`sy:${KEY}`)
}

export const maskKey = (k: string) => (k.length > 10 ? `${k.slice(0, 4)}…${k.slice(-4)}` : '••••')
