import { CATALOGUE, EXIDX } from '@syntropy/core/exercises'

/** One catalogue exercise (OpenGym dataset fields). */
export interface Exercise {
  id: string
  n: string
  bp: string
  eq: string
  tg: string
  mg?: string[]
  sm?: string[]
  st?: string[]
  primaries?: string[]
  secondaries?: string[]
  custom?: boolean
}

export const EX = EXIDX as Record<string, Exercise>
export const ALL_EXERCISES = CATALOGUE as Exercise[]

const cap = (s: string) =>
  s.replace(/(^|[\s(\-/])(\p{Ll})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase())

// Catalogue names carry production tags such as "(male)" or "v. 2" that mean nothing to a user.
const clean = (n: string) =>
  n
    .replace(/\s*\((male|female|side pov|back pov|front pov)\)/gi, '')
    .replace(/\s+v\.\s?\d+$/i, '')
    .trim()
export const exTitle = (id: string) => cap(clean(EX[id]?.n ?? 'Exercise'))
