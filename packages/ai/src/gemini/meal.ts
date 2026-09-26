import {
  FOOD_BY_ID,
  type Food,
  type MealItem,
  type MealSlot,
  matchFood,
  newId,
  type Unit,
} from '@syntropy/nutrition'
import { type Gemini, GeminiError } from './client'

/** Structured output contract from docs/SCREENS.md, as a JSON schema. */
export const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    is_food: { type: 'boolean', description: 'false if the photo shows no food' },
    title: {
      type: 'string',
      description: 'short name for the whole meal, e.g. "North Indian thali"',
    },
    cuisine: { type: 'string' },
    items: {
      type: 'array',
      maxItems: 15,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          unit: {
            type: 'string',
            enum: ['pc', 'katori', 'cup', 'glass', 'plate', 'bowl', 'serving', 'tbsp', 'scoop'],
          },
          quantity: { type: 'number' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
          confidence: { type: 'number', description: '0..1' },
        },
        required: [
          'name',
          'unit',
          'quantity',
          'grams',
          'kcal',
          'protein_g',
          'carbs_g',
          'fat_g',
          'confidence',
        ],
      },
    },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['is_food', 'items'],
} as const

const UNITS_HELP = `Units, Indian serving sizes first:
- pc: countable pieces (roti, idli, dosa, egg, samosa, fruit). 1 medium roti ≈ 40 g.
- katori: a 150 g bowl for dal, sabzi, rice, curd, curry. Half katori = 0.5.
- cup: 150 ml (chai, coffee). glass: 250 ml (lassi, milk, juice).
- plate: a full plate of one dish (pav bhaji, momos). serving: anything else, with grams.`

export const MEAL_SYSTEM = `You are the nutrition vision model inside Syntropy, a calm health app used mostly for Indian home food.
Identify every distinct dish on the plate or in the photo and estimate each portion.
${UNITS_HELP}
Rules:
- Name dishes the way an Indian home cook would ("Dal tadka", "Palak paneer", "Jeera rice", "Roti").
- Count pieces carefully. Estimate katoris from the bowl size.
- Give calories and macros for the WHOLE portion of each item (quantity included), assuming typical home oil and ghee.
- confidence is how sure you are of the dish identity and portion, 0 to 1.
- If there is no food, set is_food false and return no items. Never invent items you cannot see.`

type RawItem = {
  name: string
  unit: string
  quantity: number
  grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: number
}
type RawMeal = {
  is_food?: boolean
  title?: string
  cuisine?: string
  items?: RawItem[]
  notes?: string[]
}

const finite = (n: unknown, lo: number, hi: number): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi
const UNITS: Unit[] = ['pc', 'katori', 'cup', 'glass', 'plate', 'bowl', 'serving', 'tbsp', 'scoop']

/** Server-side style validation, run on the phone: drop anything implausible. */
export function validateMeal(raw: unknown): RawMeal {
  if (!raw || typeof raw !== 'object') throw new GeminiError('bad-output', 'not an object')
  const m = raw as RawMeal
  const items = (Array.isArray(m.items) ? m.items : []).filter(
    (it) =>
      it &&
      typeof it.name === 'string' &&
      it.name.trim().length > 0 &&
      finite(it.quantity, 0.1, 30) &&
      finite(it.kcal, 0, 3000) &&
      finite(it.protein_g, 0, 300) &&
      finite(it.carbs_g, 0, 500) &&
      finite(it.fat_g, 0, 300),
  )
  return { ...m, items }
}

const roundTo = (v: number, step: number) => Math.max(step, Math.round(v / step) * step)

/**
 * Turn one model item into a MealItem. When the dish is in the local table the steppers use the
 * table's per-unit values (so "+1 roti" is exactly one roti); otherwise the model's numbers are
 * divided by its quantity.
 */
export function toMealItem(it: RawItem, source: MealItem['source']): MealItem {
  const unit = (UNITS.includes(it.unit as Unit) ? it.unit : 'serving') as Unit
  const conf = finite(it.confidence, 0, 1) ? it.confidence : 0.6
  const match = matchFood(it.name)
  if (match) {
    const f: Food = match.food
    let qty = it.quantity
    if (unit !== f.unit) {
      const grams = finite(it.grams, 1, 3000) ? it.grams : f.gramsPerUnit * it.quantity
      qty = grams / f.gramsPerUnit
    }
    qty = roundTo(qty, f.step)
    return {
      id: newId('it'),
      foodId: f.id,
      name: f.name,
      qty,
      unit: f.unit,
      unitLabel: f.unitLabel,
      per: { kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat },
      confidence: Math.round(conf * Math.min(1, 0.6 + match.score * 0.4) * 100) / 100,
      source,
      addedLater: false,
      baseQty: qty,
    }
  }
  const q = Math.max(0.1, it.quantity)
  return {
    id: newId('it'),
    name: it.name.trim().replace(/^./, (c) => c.toUpperCase()),
    qty: it.quantity,
    unit,
    unitLabel: finite(it.grams, 1, 3000) ? `${Math.round(it.grams / q)} g each` : undefined,
    per: { kcal: it.kcal / q, protein: it.protein_g / q, carbs: it.carbs_g / q, fat: it.fat_g / q },
    confidence: conf,
    source,
    addedLater: false,
    baseQty: it.quantity,
  }
}

export interface MealAnalysis {
  title: string
  cuisine?: string
  items: MealItem[]
  notes: string[]
  ms: number
}

/** Photo → items. Throws GeminiError('blocked') with "could not read this plate" semantics. */
export async function analyzeMealPhoto(
  gemini: Gemini,
  input: { model: string; imageBase64: string; mime: string; slot: MealSlot },
): Promise<MealAnalysis> {
  const t0 = Date.now()
  const raw = await gemini.generateJSON<unknown>({
    model: input.model,
    system: MEAL_SYSTEM,
    schema: MEAL_SCHEMA,
    temperature: 0.2,
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: input.mime, data: input.imageBase64 } },
          { text: `This is my ${input.slot}. List the dishes with Indian serving units.` },
        ],
      },
    ],
  })
  const m = validateMeal(raw)
  if (m.is_food === false || !m.items?.length) throw new GeminiError('blocked', 'no food found')
  return {
    title: m.title?.trim() || 'Meal',
    cuisine: m.cuisine,
    items: m.items.map((it) => toMealItem(it, 'photo')),
    notes: (m.notes ?? []).slice(0, 3),
    ms: Date.now() - t0,
  }
}

export const TEXT_SYSTEM = `You turn short food descriptions into structured items for Syntropy, an Indian nutrition app.
${UNITS_HELP}
"2 more roti and a katori of dahi" → roti 2 pc, dahi 1 katori. "half plate rajma chawal" → rajma chawal 0.5 plate.
Give calories and macros for the whole quantity. If the text has no food, return is_food false.`

/** Free text ("2 more roti and a katori of dahi") → items. */
export async function parseFoodText(
  gemini: Gemini,
  input: { model: string; text: string },
): Promise<MealItem[]> {
  const raw = await gemini.generateJSON<unknown>({
    model: input.model,
    system: TEXT_SYSTEM,
    schema: MEAL_SCHEMA,
    temperature: 0.1,
    contents: [{ role: 'user', parts: [{ text: input.text.slice(0, 500) }] }],
  })
  const m = validateMeal(raw)
  return (m.items ?? []).map((it) => toMealItem(it, 'text'))
}

/**
 * Offline fallback for Quick add: understands "2 roti", "a katori of dahi", "half rice" with the
 * local table only, so simple sentences work without a key or connection.
 */
export function parseFoodTextLocally(text: string): MealItem[] {
  const words: Record<string, number> = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    half: 0.5,
    '½': 0.5,
  }
  const parts = text
    .toLowerCase()
    .replace(/\b(more|extra|of|some|and also)\b/g, ' ')
    .split(/,|\band\b|\+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const out: MealItem[] = []
  for (const p of parts) {
    const m = p.match(
      /^(\d+(?:\.\d+)?|a|an|one|two|three|four|five|half|½)?\s*(pc|pcs|piece|pieces|katori|katoris|bowl|cup|cups|glass|glasses|plate|plates)?\s*(.*)$/,
    )
    if (!m) continue
    const qty = m[1] ? (words[m[1]] ?? Number(m[1])) : 1
    const name = m[3].trim()
    if (!name) continue
    const hit = matchFood(name, 0.55)
    if (!hit) continue
    const f = FOOD_BY_ID[hit.food.id]
    out.push({
      id: newId('it'),
      foodId: f.id,
      name: f.name,
      qty: roundTo(qty, f.step),
      unit: f.unit,
      unitLabel: f.unitLabel,
      per: { kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat },
      source: 'text',
      addedLater: false,
    })
  }
  return out
}
