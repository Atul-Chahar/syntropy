import { type CuisinePref, FOOD_BY_ID } from '@syntropy/nutrition'
import type { Diet } from '@/stores/profile'

// One protein-dense, everyday food per diet for the Home hint, from the cuisine they eat most.
const PICK: Record<Diet, string> = {
  veg: 'paneer-bhurji',
  jain: 'tofu',
  egg: 'egg-bhurji',
  nonveg: 'chicken-breast',
  vegan: 'tofu',
}
const PICK_GLOBAL: Record<Diet, string> = {
  veg: 'greek-yogurt-plain',
  jain: 'greek-yogurt-plain',
  egg: 'scrambled-eggs',
  nonveg: 'grilled-chicken',
  vegan: 'edamame',
}

// How the global picks read in a sentence; table names are written for lists.
const PHRASE: Record<string, string> = {
  'greek-yogurt-plain': 'a pot of Greek yogurt',
  'scrambled-eggs': 'two scrambled eggs',
  'grilled-chicken': 'a grilled chicken breast',
  edamame: 'a cup of edamame',
}

/** "a katori of paneer bhurji covers 20 g", fitted to the user's diet and cuisine. */
export function proteinIdea(diet: Diet | null, cuisine: CuisinePref = 'indian'): string {
  const pick = cuisine === 'global' ? PICK_GLOBAL : PICK
  const f = FOOD_BY_ID[pick[diet ?? 'nonveg']]
  if (!f) return ''
  const phrase = PHRASE[f.id]
  if (phrase) return `${phrase} covers ${Math.round(f.protein)} g`
  const amount = f.unit === 'katori' ? 'a katori of' : f.unit === 'pc' ? 'one' : `${f.unitLabel} of`
  return `${amount} ${f.name.toLowerCase()} covers ${Math.round(f.protein)} g`
}
