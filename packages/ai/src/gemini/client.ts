/*
 * Minimal Gemini REST client used on the phone. The key is read at call time from the
 * platform's secure storage and travels only in the `x-goog-api-key` header.
 */

export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } }
export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] }

export type GeminiErrorKind =
  | 'no-key'
  | 'auth'
  | 'quota'
  | 'blocked'
  | 'timeout'
  | 'network'
  | 'server'
  | 'bad-output'

export class GeminiError extends Error {
  constructor(
    public kind: GeminiErrorKind,
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

/** Calm, user-facing copy for each failure. */
export const ERROR_COPY: Record<GeminiErrorKind, string> = {
  'no-key': 'Add your Gemini API key in AI settings to use this.',
  auth: 'Gemini did not accept the API key. Check it in AI settings.',
  quota: 'The free Gemini quota is used up for now. Try again in a little while.',
  blocked: 'Gemini could not answer this one. Try rephrasing or a clearer photo.',
  timeout: 'Gemini took too long to answer. Check your connection and try again.',
  network: 'No connection to Gemini right now. Your data is safe on the phone.',
  server: 'Gemini is having trouble right now. Try again shortly.',
  'bad-output': 'Gemini sent back something unreadable. Try again.',
}

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
  text: () => Promise<string>
  body?: ReadableStream<Uint8Array> | null
}>

export interface GeminiOptions {
  getKey: () => Promise<string | null | undefined>
  fetch?: FetchLike
  /** Non-streaming fetch used on Android (CapacitorHttp avoids CORS). Defaults to `fetch`. */
  timeoutMs?: number
  baseUrl?: string
}

export interface GenerateRequest {
  model: string
  system?: string
  contents: GeminiContent[]
  /** JSON schema for structured output. */
  schema?: object
  temperature?: number
  maxOutputTokens?: number
}

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

function bodyOf(req: GenerateRequest) {
  return JSON.stringify({
    ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
    contents: req.contents,
    generationConfig: {
      temperature: req.temperature ?? 0.4,
      ...(req.maxOutputTokens ? { maxOutputTokens: req.maxOutputTokens } : {}),
      ...(req.schema
        ? { responseMimeType: 'application/json', responseJsonSchema: req.schema }
        : {}),
    },
  })
}

function kindForStatus(status: number): GeminiErrorKind {
  if (status === 400 || status === 401 || status === 403) return 'auth'
  if (status === 429) return 'quota'
  return 'server'
}

async function errorFrom(res: {
  status: number
  text: () => Promise<string>
}): Promise<GeminiError> {
  let msg = `HTTP ${res.status}`
  try {
    const t = await res.text()
    const j = JSON.parse(t) as { error?: { message?: string; status?: string } }
    msg = j.error?.message ?? msg
    // A bad key comes back as 400 INVALID_ARGUMENT with "API key not valid".
    if (res.status === 400 && !/api key/i.test(msg))
      return new GeminiError('bad-output', msg, res.status)
  } catch {}
  return new GeminiError(kindForStatus(res.status), msg, res.status)
}

type Candidate = { content?: { parts?: { text?: string }[] }; finishReason?: string }
type GenResponse = { candidates?: Candidate[]; promptFeedback?: { blockReason?: string } }

function textOf(data: GenResponse): string {
  const cand = data.candidates?.[0]
  if (!cand) throw new GeminiError('blocked', data.promptFeedback?.blockReason ?? 'no candidates')
  if (cand.finishReason && !['STOP', 'MAX_TOKENS'].includes(cand.finishReason)) {
    throw new GeminiError('blocked', `stopped: ${cand.finishReason}`)
  }
  return (cand.content?.parts ?? []).map((p) => p.text ?? '').join('')
}

export function createGemini(opts: GeminiOptions) {
  const doFetch: FetchLike = opts.fetch ?? ((url, init) => fetch(url, init))
  const base = opts.baseUrl ?? BASE
  const timeoutMs = opts.timeoutMs ?? 25000

  async function key() {
    const k = (await opts.getKey())?.trim()
    if (!k) throw new GeminiError('no-key', 'no API key')
    return k
  }

  async function once(req: GenerateRequest): Promise<string> {
    const k = await key()
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await doFetch(`${base}/models/${encodeURIComponent(req.model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': k },
        body: bodyOf(req),
        signal: ctrl.signal,
      })
      if (!res.ok) throw await errorFrom(res)
      return textOf((await res.json()) as GenResponse)
    } catch (e) {
      if (e instanceof GeminiError) throw e
      if ((e as Error)?.name === 'AbortError') throw new GeminiError('timeout', 'timed out')
      throw new GeminiError('network', (e as Error)?.message ?? 'network error')
    } finally {
      clearTimeout(timer)
    }
  }

  /** One retry on timeouts, network blips and 5xx. */
  async function generate(req: GenerateRequest): Promise<string> {
    try {
      return await once(req)
    } catch (e) {
      if (e instanceof GeminiError && ['timeout', 'network', 'server'].includes(e.kind))
        return once(req)
      throw e
    }
  }

  async function generateJSON<T>(req: GenerateRequest & { schema: object }): Promise<T> {
    const text = await generate(req)
    try {
      return JSON.parse(stripFence(text)) as T
    } catch {
      throw new GeminiError('bad-output', 'invalid JSON')
    }
  }

  /** Server-sent-events stream of text chunks. Needs a fetch with a readable body. */
  async function* stream(req: GenerateRequest, signal?: AbortSignal): AsyncGenerator<string> {
    const k = await key()
    let res: Awaited<ReturnType<FetchLike>>
    try {
      res = await doFetch(
        `${base}/models/${encodeURIComponent(req.model)}:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': k },
          body: bodyOf(req),
          signal,
        },
      )
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return
      throw new GeminiError('network', (e as Error)?.message ?? 'network error')
    }
    if (!res.ok) throw await errorFrom(res)
    if (!res.body) {
      // No streaming support: fall back to the whole answer at once.
      const t = await res.text()
      for (const line of t.split('\n')) {
        if (line.startsWith('data:')) yield textOf(JSON.parse(line.slice(5)) as GenResponse)
      }
      return
    }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let i = buf.indexOf('\n')
      while (i >= 0) {
        const line = buf.slice(0, i).trim()
        buf = buf.slice(i + 1)
        if (line.startsWith('data:')) {
          const chunk = textOf(JSON.parse(line.slice(5)) as GenResponse)
          if (chunk) yield chunk
        }
        i = buf.indexOf('\n')
      }
    }
  }

  /** Cheap round trip used by "Test connection". */
  async function ping(model: string): Promise<boolean> {
    const t = await generate({
      model,
      contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: ok' }] }],
      temperature: 0,
      maxOutputTokens: 8,
    })
    return /ok/i.test(t)
  }

  return { generate, generateJSON, stream, ping }
}

export type Gemini = ReturnType<typeof createGemini>

export const stripFence = (t: string) =>
  t
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
