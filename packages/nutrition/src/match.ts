import { FOODS, type Food } from './foods'

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokens = (s: string) =>
  norm(s)
    .split(' ')
    .filter((t) => t.length > 1)

type Indexed = { food: Food; names: string[] }
const INDEX: Indexed[] = FOODS.map((food) => ({
  food,
  names: [food.name, ...(food.aliases ?? [])].map(norm),
}))

/** Score 0..1 of how well a free-text dish name matches a table food. */
function score(query: string, names: string[]): number {
  const q = norm(query)
  let best = 0
  for (const n of names) {
    if (n === q) return 1
    const qt = tokens(q)
    const nt = tokens(n)
    if (!qt.length || !nt.length) continue
    const near = (a: string, b: string) =>
      a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)))
    const hit = nt.filter((t) => qt.some((x) => near(x, t))).length
    const covered = qt.filter((x) => nt.some((t) => near(x, t))).length
    const precision = hit / nt.length
    const recall = covered / qt.length
    // Most of the query must be explained, or "mango pickle" would become a mango.
    let s = precision * 0.6 + recall * 0.4
    if (recall < 0.6) s *= 0.5
    best = Math.max(best, s)
  }
  return best
}

export type FoodMatch = { food: Food; score: number }

/** Best table match for a dish name, or null below the threshold. */
export function matchFood(name: string, threshold = 0.6): FoodMatch | null {
  let best: FoodMatch | null = null
  const q = norm(name)
  for (const it of INDEX) {
    // A food's own name beats another food's alias ("scrambled eggs" is an alias of egg bhurji).
    if (it.names[0] === q) return { food: it.food, score: 1 }
    const s = score(name, it.names)
    if (!best || s > best.score) best = { food: it.food, score: s }
  }
  return best && best.score >= threshold ? best : null
}

/** Ranked search for the food picker. */
export function searchFoods(query: string, pool: Food[] = FOODS, limit = 30): Food[] {
  const q = norm(query)
  if (!q) return pool.slice(0, limit)
  return pool
    .map((food) => ({
      food,
      s:
        score(q, [food.name, ...(food.aliases ?? [])].map(norm)) +
        (norm(food.name).startsWith(q) ? 0.3 : 0),
    }))
    .filter((x) => x.s > 0.25)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.food)
}
