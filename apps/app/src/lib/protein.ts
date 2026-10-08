import { FOOD_BY_ID } from '@syntropy/nutrition'
import type { Diet } from '@/stores/profile'

// One protein-dense, everyday food per diet for the Home hint.
const PICK: Record<Diet, string> = {
  veg: 'paneer-bhurji',
  jain: 'tofu',
  egg: 'egg-bhurji',
  nonveg: 'chicken-breast',
  vegan: 'tofu',
}

/** "a katori of paneer bhurji covers 20 g", fitted to the user's diet. */
export function proteinIdea(diet: Diet | null): string {
  const f = FOOD_BY_ID[PICK[diet ?? 'nonveg']]
  if (!f) return ''
  const amount = f.unit === 'katori' ? 'a katori of' : f.unit === 'pc' ? 'one' : `${f.unitLabel} of`
  return `${amount} ${f.name.toLowerCase()} covers ${Math.round(f.protein)} g`
}
