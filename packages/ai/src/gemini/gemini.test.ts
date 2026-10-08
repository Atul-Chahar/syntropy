import { describe, expect, it, vi } from 'vitest'
import { createGemini, type FetchLike, GeminiError } from './client'
import { buildChatRequest, parseActions, visiblePart } from './coach'
import {
  analyzeMealPhoto,
  parseFoodText,
  parseFoodTextLocally,
  toMealItem,
  validateMeal,
} from './meal'

const reply = (obj: unknown, status = 200) => ({
  ok: status < 300,
  status,
  json: async () => obj,
  text: async () => JSON.stringify(obj),
})
const answer = (text: string) =>
  reply({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] })

const THALI = {
  is_food: true,
  title: 'North Indian thali',
  cuisine: 'north_indian',
  items: [
    {
      name: 'Roti',
      unit: 'pc',
      quantity: 2,
      grams: 80,
      kcal: 210,
      protein_g: 6,
      carbs_g: 36,
      fat_g: 5,
      confidence: 0.94,
    },
    {
      name: 'Dal tadka',
      unit: 'katori',
      quantity: 1,
      grams: 150,
      kcal: 170,
      protein_g: 9,
      carbs_g: 22,
      fat_g: 5,
      confidence: 0.91,
    },
    {
      name: 'Palak paneer',
      unit: 'katori',
      quantity: 1,
      grams: 150,
      kcal: 250,
      protein_g: 12,
      carbs_g: 9,
      fat_g: 18,
      confidence: 0.86,
    },
    {
      name: 'Rice',
      unit: 'serving',
      quantity: 1,
      grams: 225,
      kcal: 290,
      protein_g: 6,
      carbs_g: 64,
      fat_g: 1,
      confidence: 0.84,
    },
    {
      name: 'Mango pickle',
      unit: 'tbsp',
      quantity: 1,
      grams: 15,
      kcal: 40,
      protein_g: 0,
      carbs_g: 2,
      fat_g: 3.5,
      confidence: 0.7,
    },
  ],
}

const gem = (f: FetchLike, key: string | null = 'k') =>
  createGemini({ getKey: async () => key, fetch: f, timeoutMs: 200 })

describe('Gemini client', () => {
  it('sends the key in a header, never the URL, with a JSON schema', async () => {
    const f = vi.fn<FetchLike>(async () => answer('{"a":1}'))
    await gem(f).generateJSON({
      model: 'gemini-x',
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      schema: { type: 'object' },
    })
    const [url, init] = f.mock.calls[0]
    expect(url).not.toContain('key=')
    expect(init.headers['x-goog-api-key']).toBe('k')
    expect(JSON.parse(init.body).generationConfig.responseJsonSchema).toEqual({ type: 'object' })
  })

  it('fails fast without a key', async () => {
    await expect(gem(vi.fn(), null).generate({ model: 'm', contents: [] })).rejects.toMatchObject({
      kind: 'no-key',
    })
  })

  it('maps quota and auth errors', async () => {
    await expect(
      gem(async () => reply({ error: { message: 'quota' } }, 429)).generate({
        model: 'm',
        contents: [],
      }),
    ).rejects.toMatchObject({ kind: 'quota' })
    await expect(
      gem(async () => reply({ error: { message: 'API key not valid' } }, 400)).generate({
        model: 'm',
        contents: [],
      }),
    ).rejects.toMatchObject({ kind: 'auth' })
  })

  it('retries once on a server error', async () => {
    let n = 0
    const f: FetchLike = async () =>
      n++ === 0 ? reply({ error: { message: 'x' } }, 503) : answer('ok')
    await expect(gem(f).generate({ model: 'm', contents: [] })).resolves.toBe('ok')
    expect(n).toBe(2)
  })

  it('reports blocked prompts', async () => {
    await expect(
      gem(async () => reply({ promptFeedback: { blockReason: 'SAFETY' } })).generate({
        model: 'm',
        contents: [],
      }),
    ).rejects.toMatchObject({ kind: 'blocked' })
  })

  it('rejects unreadable JSON', async () => {
    await expect(
      gem(async () => answer('not json')).generateJSON({ model: 'm', contents: [], schema: {} }),
    ).rejects.toBeInstanceOf(GeminiError)
  })

  it('streams server-sent events', async () => {
    const enc = new TextEncoder()
    const chunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Hel"}]}}]}\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"lo"}]}}]}\n',
    ]
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const ch of chunks) c.enqueue(enc.encode(ch))
        c.close()
      },
    })
    const f: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      body,
    })
    let out = ''
    for await (const t of gem(f).stream({ model: 'm', contents: [] })) out += t
    expect(out).toBe('Hello')
  })
})

describe('meal analysis', () => {
  it('matches dishes to the table so steppers scale by unit', async () => {
    const a = await analyzeMealPhoto(
      gem(async () => answer(JSON.stringify(THALI))),
      { model: 'm', imageBase64: 'AA', mime: 'image/jpeg', slot: 'lunch' },
    )
    expect(a.title).toBe('North Indian thali')
    const roti = a.items.find((i) => i.foodId === 'roti')!
    expect(roti.qty).toBe(2)
    expect(roti.per.kcal).toBe(102)
    // 225 g of rice in "serving" converts to 1.5 katori of the table's steamed rice.
    const rice = a.items.find((i) => i.foodId === 'rice')!
    expect(rice.unit).toBe('katori')
    expect(rice.qty).toBe(1.5)
    // Unknown dish keeps the model's own per-unit numbers.
    const pickle = a.items.find((i) => i.name === 'Mango pickle')!
    expect(pickle.foodId).toBeUndefined()
    expect(pickle.per.kcal).toBe(40)
  })

  it('says "could not read this plate" when there is no food', async () => {
    const f = async () => answer(JSON.stringify({ is_food: false, items: [] }))
    await expect(
      analyzeMealPhoto(gem(f), {
        model: 'm',
        imageBase64: 'AA',
        mime: 'image/jpeg',
        slot: 'lunch',
      }),
    ).rejects.toMatchObject({ kind: 'blocked' })
  })

  it('drops implausible items', () => {
    const m = validateMeal({
      is_food: true,
      items: [{ ...THALI.items[0], kcal: 99999 }, THALI.items[1]],
    })
    expect(m.items).toHaveLength(1)
  })

  it('clamps confidence into the item', () => {
    const it = toMealItem({ ...THALI.items[1], confidence: 0.9 }, 'photo')
    expect(it.confidence).toBeGreaterThan(0.8)
    expect(it.confidence).toBeLessThanOrEqual(0.9)
  })

  it('parses Quick add text with Gemini', async () => {
    const f = async () =>
      answer(
        JSON.stringify({
          is_food: true,
          items: [
            {
              name: 'roti',
              unit: 'pc',
              quantity: 2,
              grams: 80,
              kcal: 210,
              protein_g: 6,
              carbs_g: 36,
              fat_g: 5,
              confidence: 0.9,
            },
            {
              name: 'dahi',
              unit: 'katori',
              quantity: 1,
              grams: 150,
              kcal: 95,
              protein_g: 5,
              carbs_g: 7,
              fat_g: 5,
              confidence: 0.9,
            },
          ],
        }),
      )
    const items = await parseFoodText(gem(f), {
      model: 'm',
      text: '2 more roti and a katori of dahi',
    })
    expect(items.map((i) => [i.foodId, i.qty])).toEqual([
      ['roti', 2],
      ['dahi', 1],
    ])
    expect(items.every((i) => i.source === 'text')).toBe(true)
  })

  it('parses simple sentences offline', () => {
    const items = parseFoodTextLocally('2 more roti and a katori of dahi, half rice')
    expect(items.map((i) => [i.foodId, i.qty])).toEqual([
      ['roti', 2],
      ['dahi', 1],
      ['rice', 0.5],
    ])
  })
  it('reads global foods and units offline', () => {
    const items = parseFoodTextLocally('a slice of pepperoni pizza and a latte, 2 scrambled eggs')
    expect(items.map((i) => [i.foodId, i.qty])).toEqual([
      ['pizza-pepperoni', 1],
      ['latte', 1],
      ['scrambled-eggs', 2],
    ])
  })
})

describe('coach', () => {
  it('parses and filters trailing actions', () => {
    const r = parseActions(
      'Have a scoop of whey.\nACTIONS: [{"label":"Log 1 scoop whey","type":"log_food","foodId":"whey","qty":1},{"label":"bad","type":"log_food","foodId":"nope","qty":1},{"label":"Open scan","type":"open","to":"scan"}]',
      new Set(['whey']),
    )
    expect(r.text).toBe('Have a scoop of whey.')
    expect(r.actions.map((a) => a.label)).toEqual(['Log 1 scoop whey', 'Open scan'])
  })

  it('hides a half-streamed ACTIONS line', () => {
    expect(visiblePart('Eat dal.\nACTIONS: [{"lab')).toBe('Eat dal.')
  })

  it('puts context in the system prompt and maps roles', () => {
    const req = buildChatRequest('m', { today: '2026-09-24', profile: { name: 'Atul' } }, [
      { role: 'user', text: 'hi' },
      { role: 'coach', text: 'hello' },
    ])
    expect(req.system).toContain('"name":"Atul"')
    expect(req.contents.map((c) => c.role)).toEqual(['user', 'model'])
  })
})
