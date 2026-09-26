'use client'

import { buildDemoState } from '@syntropy/core/demoSeed'
import {
  FOOD_BY_ID,
  itemFromFood,
  type Meal,
  type MealItem,
  type MealSlot,
  newId,
} from '@syntropy/nutrition'
import {
  useCoach,
  useGoal,
  useNutrition,
  useProfile,
  useSettings,
  useTraining,
  useWater,
} from '@/stores'
import type { Thread } from '@/stores/coach'
import { DEF, type TrainingState } from '@/stores/training'
import { addDays, today } from './dates'

/*
 * Sample data for the web demo, screenshots, and "Explore with sample data" on Welcome.
 * Mirrors the numbers on the design boards: Atul, 74.2 kg, cutting at a steady pace, a
 * thali for lunch with a second helping, 9 glasses of water.
 */

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const it = (
  id: string,
  qty: number,
  source: MealItem['source'] = 'manual',
  extra: Partial<MealItem> = {},
) => itemFromFood(FOOD_BY_ID[id], qty, source, extra)

const MENUS: Record<MealSlot, [string, number][][]> = {
  breakfast: [
    [
      ['poha', 1],
      ['chai', 1],
      ['boiled-egg', 2],
    ],
    [
      ['besan-chilla', 2],
      ['dahi', 0.5],
      ['chai', 1],
    ],
    [
      ['idli', 3],
      ['sambar', 1],
      ['coconut-chutney', 1],
    ],
    [
      ['oats', 1],
      ['banana', 1],
    ],
    [
      ['aloo-paratha', 1],
      ['dahi', 1],
      ['chai', 1],
    ],
    [
      ['omelette', 1],
      ['brown-bread', 2],
      ['coffee', 1],
    ],
  ],
  lunch: [
    [
      ['roti', 3],
      ['dal-tadka', 1],
      ['jeera-rice', 1],
      ['palak-paneer', 1],
      ['dahi', 1],
    ],
    [
      ['rajma-chawal', 1],
      ['kachumber', 1],
      ['dahi', 1],
    ],
    [
      ['roti', 3],
      ['chicken-curry', 1],
      ['rice', 0.5],
      ['green-salad', 1],
    ],
    [
      ['roti', 2],
      ['chole', 1],
      ['jeera-rice', 1],
      ['raita', 1],
    ],
    [
      ['khichdi', 1.5],
      ['dahi', 1],
      ['papaya', 1],
    ],
  ],
  snack: [
    [
      ['whey', 1],
      ['banana', 1],
    ],
    [
      ['sprouts', 1],
      ['chai', 1],
    ],
    [
      ['roasted-chana', 1],
      ['coffee', 1],
    ],
    [
      ['makhana', 1],
      ['chai', 1],
    ],
    [
      ['greek-yogurt', 1],
      ['apple', 1],
    ],
  ],
  dinner: [
    [
      ['roti', 2],
      ['paneer-bhurji', 1],
      ['dal-tadka', 1],
    ],
    [
      ['roti', 2],
      ['egg-curry', 1],
      ['mix-veg', 1],
    ],
    [
      ['dosa', 2],
      ['sambar', 1],
    ],
    [
      ['roti', 2],
      ['soya-curry', 1],
      ['green-salad', 1],
    ],
    [
      ['chicken-tikka', 1],
      ['roti', 2],
      ['kachumber', 1],
    ],
  ],
}

const TIMES: Record<MealSlot, string> = {
  breakfast: '08:40',
  lunch: '13:42',
  snack: '17:15',
  dinner: '20:30',
}

export function buildSeed() {
  const rnd = rng(924)
  const t = today()
  const base = buildDemoState() as unknown as Partial<TrainingState>

  // 90 days of weigh-ins trending from 76.9 kg to 74.2 kg with daily water noise.
  const bodyweight: TrainingState['bodyweight'] = []
  for (let i = 89; i >= 0; i--) {
    if (i > 0 && rnd() < 0.18) continue
    const p = (89 - i) / 89
    const w = 76.9 - 2.7 * p + (rnd() - 0.5) * 0.9 + (i % 7 === 1 ? 0.3 : 0)
    bodyweight.push({ d: addDays(t, -i), w: i === 0 ? 74.2 : Math.round(w * 10) / 10 })
  }

  const S: TrainingState = {
    ...DEF,
    ...base,
    bodyweight,
    targetW: 71.5,
    effort: 'rpe',
  } as TrainingState

  const meals: Meal[] = []
  for (let i = 30; i >= 1; i--) {
    const d = addDays(t, -i)
    for (const slot of ['breakfast', 'lunch', 'snack', 'dinner'] as MealSlot[]) {
      if (slot === 'snack' && rnd() < 0.3) continue
      const menu = MENUS[slot][Math.floor(rnd() * MENUS[slot].length)]
      meals.push({
        id: newId('meal'),
        date: d,
        slot,
        time: TIMES[slot],
        items: menu.map(([id, q]) => it(id, q)),
        createdAt: 0,
      })
    }
  }
  // Today, as on FoodLog.dc.html: the thali was scanned, then 1 roti and 1 dahi added later.
  meals.push(
    {
      id: newId('meal'),
      date: t,
      slot: 'breakfast',
      time: '08:40',
      items: [it('poha', 1), it('chai', 1), it('boiled-egg', 2)],
      createdAt: 0,
    },
    {
      id: newId('meal'),
      date: t,
      slot: 'lunch',
      time: '13:42',
      title: 'Thali',
      items: [
        it('roti', 2, 'photo', { confidence: 0.94, baseQty: 2 }),
        it('dal-tadka', 1, 'photo', { confidence: 0.91, baseQty: 1 }),
        it('jeera-rice', 1, 'photo', { confidence: 0.84, baseQty: 1 }),
        it('palak-paneer', 1, 'photo', { confidence: 0.86, baseQty: 1 }),
        it('dahi', 1, 'photo', { confidence: 0.89, baseQty: 1 }),
        it('roti', 1, 'manual', { addedLater: true }),
        it('dahi', 1, 'manual', { addedLater: true }),
      ],
      createdAt: 0,
    },
    {
      id: newId('meal'),
      date: t,
      slot: 'snack',
      time: '17:15',
      items: [it('whey', 1), it('banana', 1), it('chai', 1)],
      createdAt: 0,
    },
  )

  const days: Record<string, number[]> = {}
  for (let i = 30; i >= 1; i--)
    days[addDays(t, -i)] = Array.from({ length: 8 + Math.floor(rnd() * 6) }, () => 250)
  days[t] = Array.from({ length: 9 }, () => 250)

  const now = Date.now()
  const threads: Thread[] = [
    {
      id: 'demo-dinner',
      title: 'What should I eat for dinner?',
      createdAt: now - 3600000,
      updatedAt: now - 3500000,
      messages: [
        {
          id: 'm1',
          role: 'user',
          text: 'What should I eat for dinner? I trained pull today.',
          at: now - 3600000,
        },
        {
          id: 'm2',
          role: 'coach',
          at: now - 3590000,
          text: "You have about **80 kcal** left today and you're at **115 g protein** of 150 g, so dinner should be protein-first and light on oil.\n\n- 2 roti with **1 katori paneer bhurji** (~16 g protein)\n- or **1 katori dal** plus a **scoop of whey** after\n\nIt's a training day, so a little over is fine. Your lats are still recovering, and protein helps them bounce back by Saturday.",
          actions: [
            { label: 'Log 1 scoop whey', type: 'log_food', foodId: 'whey', qty: 1 },
            { label: 'Log paneer bhurji', type: 'log_food', foodId: 'paneer-bhurji', qty: 1 },
          ],
        },
      ],
    },
    {
      id: 'demo-tired',
      title: 'Why am I tired today?',
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
      messages: [
        { id: 'm3', role: 'user', text: 'Why am I tired today?', at: now - 86400000 * 2 },
        {
          id: 'm4',
          role: 'coach',
          at: now - 86400000 * 2 + 9000,
          text: 'Two likely reasons from your logs: yesterday was a **heavy leg session**, and you averaged **2.1 L of water** over the last three days against a 3.5 L target. Start with two glasses now and keep today easy.',
          actions: [{ label: 'Log 500 ml water', type: 'log_water', ml: 500 }],
        },
      ],
    },
  ]

  return {
    profile: {
      name: 'Atul Chahar',
      email: 'you@email.com',
      sex: 'male' as const,
      age: 27,
      heightCm: 176,
      weightKg: 74.2,
      activity: 'light' as const,
      bodyFatPct: 16,
      trainingDaysPerWeek: 3,
      onboarded: true,
      bodyDone: true,
      lockEnabled: false,
      createdAt: now - 90 * 86400000,
    },
    S,
    meals,
    days,
    threads,
  }
}

/** Replace every store with the sample profile. */
export function loadSeed() {
  const s = buildSeed()
  useProfile.getState().set(s.profile)
  useTraining.getState().replaceAll(s.S)
  useNutrition.getState().replaceAll({
    meals: s.meals,
    customFoods: [],
    recent: ['roti', 'dahi', 'dal-tadka', 'chai', 'whey', 'boiled-egg', 'poha', 'paneer-bhurji'],
  })
  useWater.getState().replaceAll(s.days)
  useCoach.getState().replaceAll(s.threads)
  useGoal.setState({
    type: 'cut',
    pace: 'steady',
    adjustKcal: 0,
    set: true,
    updatedAt: Date.now(),
    checkins: [],
  })
  useSettings.getState().set({ aiConsent: true })
}
