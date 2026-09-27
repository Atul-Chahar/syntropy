'use client'

import { createGemini, ERROR_COPY, GeminiError } from '@syntropy/ai'
import { geminiFetch } from '@/platform/http'
import { getApiKey } from '@/platform/secrets'
import { toast, useSettings } from '@/stores'

export const gemini = createGemini({ getKey: getApiKey, fetch: geminiFetch, timeoutMs: 25000 })

/** A second client for streaming chat: always the WebView fetch (needs a readable body). */
export const geminiStream = createGemini({
  getKey: getApiKey,
  fetch: (u, i) => window.fetch(u, i),
  timeoutMs: 45000,
})

export type AiGate = { ok: true } | { ok: false; reason: 'no-key' | 'cap' | 'offline' }

/** Checks before any AI call: a key, the local daily cap, and a connection. */
export async function aiReady(): Promise<AiGate> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    return { ok: false, reason: 'offline' }
  const key = await getApiKey()
  if (!key) return { ok: false, reason: 'no-key' }
  if (useSettings.getState().remaining() <= 0) return { ok: false, reason: 'cap' }
  return { ok: true }
}

export const GATE_COPY = {
  'no-key': 'Add your free Gemini API key in AI settings to use this.',
  cap: 'Daily AI limit reached. It resets at midnight — you can raise it in AI settings.',
  offline: 'You are offline. Everything else still works; AI needs a connection.',
}

/** Run an AI task with the usage counter and calm error copy. */
export async function withAi<T>(
  task: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; message: string; kind: string }> {
  const gate = await aiReady()
  if (!gate.ok) return { ok: false, message: GATE_COPY[gate.reason], kind: gate.reason }
  useSettings.getState().countUse()
  try {
    return { ok: true, value: await task() }
  } catch (e) {
    const kind = e instanceof GeminiError ? e.kind : 'network'
    return {
      ok: false,
      message: ERROR_COPY[kind as keyof typeof ERROR_COPY] ?? ERROR_COPY.network,
      kind,
    }
  }
}

export const aiToast = (message: string) => toast(message, { icon: 'sparkle' })
