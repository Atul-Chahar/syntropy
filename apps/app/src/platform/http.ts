'use client'

import { CapacitorHttp } from '@capacitor/core'
import type { FetchLike } from '@syntropy/ai'
import { isNative } from './native'

/**
 * Fetch for Gemini. On Android, CapacitorHttp makes the request natively (no CORS, no WebView
 * origin quirks). Streaming needs a readable body, so `stream` calls always use window.fetch.
 */
export const geminiFetch: FetchLike = async (url, init) => {
  if (isNative() && !url.includes('alt=sse')) {
    const res = await CapacitorHttp.request({
      url,
      method: init.method,
      headers: init.headers,
      data: JSON.parse(init.body),
      responseType: 'json',
      connectTimeout: 20000,
      readTimeout: 30000,
    })
    const data = res.data as unknown
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      json: async () => (typeof data === 'string' ? JSON.parse(data) : data),
      text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    }
  }
  const res = await window.fetch(url, init)
  return res
}
