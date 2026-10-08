import type { Gemini, GeminiContent, GeminiPart } from './client'

/** Everything the coach may see: summaries built on the phone from the stores. */
export interface CoachContext {
  today: string
  profile: {
    name: string
    sex?: string
    age?: number
    heightCm?: number
    weightKg?: number
    goal?: string
    pace?: string
    /** veg, egg (eggetarian), nonveg, vegan or jain. Never suggest foods outside it. */
    diet?: string
    avoidFoods?: string[]
    training?: {
      focus: string
      experience: string
      daysPerWeek: number
      sessionMin: number
      gym: string
      injuries: string[]
      cardio: string
    }
  }
  targets?: {
    kcal: number
    protein: number
    carbs: number
    fat: number
    waterMl: number
    trainingDay: boolean
  }
  todayIntake?: {
    kcal: number
    protein: number
    carbs: number
    fat: number
    meals: { slot: string; items: string }[]
  }
  waterMl?: number
  readiness?: number
  fatigued?: string[]
  lastSessions?: { date: string; name: string; sets: number; volumeKg: number; prs?: string[] }[]
  nextSession?: { date: string; name: string }
  weightTrend?: { current: number; kgPerWeek: number | null }
  week?: { avgKcal: number; avgProtein: number; trainingDays: number }
  foodsForActions?: { id: string; name: string; unit: string }[]
}

export const COACH_SYSTEM = `You are Coach, the assistant inside Syntropy — a calm, scientific health app that treats training and nutrition as one loop. The user is usually Indian and eats Indian home food.

How you speak:
- Warm, brief and specific. 2 to 6 short sentences or a few bullets. No lectures, no guilt, no red-flag language about going over targets.
- Use the user's own numbers from CONTEXT. NEVER state a number that is not in CONTEXT or derived from it by simple arithmetic. If you do not have the data, say so and suggest how to log it.
- Prefer Indian food suggestions in katori and piece units (roti, dal, paneer, dahi, eggs, chana, soya), and only foods that fit profile.diet and avoid profile.avoidFoods (no eggs or meat for veg/jain, no dairy for vegan, no onion/garlic/potato for jain).
- Training advice must fit profile.training: their gym's equipment, session length and any injuries.
- Markdown allowed: **bold**, bullet lists. No tables, no headings.
- You are not a doctor. For pain, injury, illness, medication or eating-disorder concerns, suggest seeing a professional.

Actions: when a concrete one-tap action would help, end your reply with ONE line exactly like
ACTIONS: [{"label":"Log 1 scoop whey","type":"log_food","foodId":"whey","qty":1}]
Allowed types: log_food (foodId must be from CONTEXT.foodsForActions), log_water (ml), open (to: "scan" | "food" | "plan" | "recovery" | "progress" | "goal"). At most 3 actions. Omit the line when no action fits. The app asks the user before doing anything.`

export type CoachAction =
  | { label: string; type: 'log_food'; foodId: string; qty: number }
  | { label: string; type: 'log_water'; ml: number }
  | { label: string; type: 'open'; to: 'scan' | 'food' | 'plan' | 'recovery' | 'progress' | 'goal' }

export type ChatTurn = {
  role: 'user' | 'coach'
  text: string
  attachments?: { mime: string; data: string; name?: string }[]
}

/** Split the trailing ACTIONS line off a finished reply. */
export function parseActions(
  reply: string,
  allowedFoodIds?: Set<string>,
): { text: string; actions: CoachAction[] } {
  const m = reply.match(/\n?\s*ACTIONS:\s*(\[[\s\S]*\])\s*$/)
  if (!m) return { text: reply.trim(), actions: [] }
  let actions: CoachAction[] = []
  try {
    const arr = JSON.parse(m[1]) as CoachAction[]
    actions = arr
      .filter((a) => a && typeof a.label === 'string')
      .filter((a) => {
        if (a.type === 'log_food')
          return (
            typeof a.foodId === 'string' &&
            (!allowedFoodIds || allowedFoodIds.has(a.foodId)) &&
            Number(a.qty) > 0 &&
            Number(a.qty) <= 10
          )
        if (a.type === 'log_water') return Number(a.ml) > 0 && Number(a.ml) <= 2000
        if (a.type === 'open')
          return ['scan', 'food', 'plan', 'recovery', 'progress', 'goal'].includes(a.to)
        return false
      })
      .slice(0, 3)
  } catch {}
  return { text: reply.slice(0, m.index).trim(), actions }
}

/** Streaming text during generation hides a half-written ACTIONS line. */
export const visiblePart = (partial: string) => partial.replace(/\n?\s*ACTIONS:[\s\S]*$/, '')

export function buildChatRequest(model: string, ctx: CoachContext, history: ChatTurn[]) {
  const contents: GeminiContent[] = history.slice(-16).map((t) => {
    const parts: GeminiPart[] = []
    for (const a of t.attachments ?? [])
      parts.push({ inline_data: { mime_type: a.mime, data: a.data } })
    parts.push({ text: t.text || '(see attachment)' })
    return { role: t.role === 'coach' ? 'model' : 'user', parts }
  })
  return {
    model,
    system: `${COACH_SYSTEM}\n\nCONTEXT (JSON, today's data from the phone):\n${JSON.stringify(ctx)}`,
    contents,
    temperature: 0.6,
    maxOutputTokens: 900,
  }
}

export async function* coachReply(
  gemini: Gemini,
  model: string,
  ctx: CoachContext,
  history: ChatTurn[],
  signal?: AbortSignal,
) {
  yield* gemini.stream(buildChatRequest(model, ctx, history), signal)
}

export const CHECKIN_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    body: { type: 'string' },
    training_tips: { type: 'array', items: { type: 'string' }, maxItems: 3 },
  },
  required: ['headline', 'body'],
} as const

export type CheckinSummary = {
  goal: string
  plannedKgPerWeek: number
  observedKgPerWeek: number | null
  kcalChange: number
  reason: string
  avgKcal: number
  targetKcal: number
  avgProtein: number
  targetProtein: number
  trainingDays: number
  plannedDays: number
  topMuscles: string[]
  lowMuscles: string[]
}

/** The weekly check-in narrative. The calorie change is decided by code before this call. */
export async function explainCheckin(gemini: Gemini, model: string, s: CheckinSummary) {
  return gemini.generateJSON<{ headline: string; body: string; training_tips?: string[] }>({
    model,
    system:
      'You write the weekly check-in for Syntropy in a calm, encouraging voice. Explain the calorie change you are given (never change the number) in 2-3 sentences using only the numbers provided, then up to 3 short training tips based on the muscle lists. No guilt, no medical advice.',
    schema: CHECKIN_SCHEMA,
    temperature: 0.5,
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(s) }] }],
  })
}

export const REFINE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          routine: { type: 'string' },
          replace: { type: 'string' },
          with: { type: 'string' },
          sets: { type: 'integer' },
          reps: { type: 'integer' },
          why: { type: 'string' },
        },
        required: ['routine', 'replace', 'why'],
      },
    },
  },
  required: ['summary', 'changes'],
}

export type RefineInput = {
  request: string
  profile: Record<string, unknown>
  routines: {
    id: string
    name: string
    exercises: {
      id: string
      name: string
      sets: number
      reps: number
      options: { id: string; name: string }[]
    }[]
  }[]
}

export type RefineChange = {
  routine: string
  replace: string
  with?: string
  sets?: number
  reps?: number
  why: string
}

/**
 * Coach review of a generated plan. The model may only swap an exercise for one of that
 * exercise's listed `options` and nudge sets/reps; anything else is dropped here, and the
 * user accepts each change before it is applied.
 */
export async function refinePlan(gemini: Gemini, model: string, input: RefineInput) {
  const raw = await gemini.generateJSON<{ summary: string; changes: RefineChange[] }>({
    model,
    system:
      'You are Coach inside Syntropy, reviewing a weekly strength plan the app generated. Suggest at most 5 changes that make it better for this person (their request first, then balance, injuries, equipment and time). A change either swaps an exercise for one of ITS OWN listed options (use the option id), or adjusts sets (1-6) or reps (3-20). Never invent ids. Keep the reason to one short sentence. If the plan is already good, return no changes and say why in the summary.',
    schema: REFINE_SCHEMA,
    temperature: 0.4,
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(input) }] }],
  })
  const byRoutine = new Map(input.routines.map((r) => [r.id, r]))
  const changes = (raw.changes ?? []).filter((c) => {
    const r = byRoutine.get(c.routine)
    const ex = r?.exercises.find((e) => e.id === c.replace)
    if (!ex) return false
    if (c.with && !ex.options.some((o) => o.id === c.with)) return false
    if (c.sets != null && (c.sets < 1 || c.sets > 6)) return false
    if (c.reps != null && (c.reps < 3 || c.reps > 20)) return false
    return !!(c.with || c.sets || c.reps)
  })
  return { summary: raw.summary ?? '', changes: changes.slice(0, 5) }
}
