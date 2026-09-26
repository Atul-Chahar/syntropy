export const DAY_MS = 86400000

/** Local calendar date as YYYY-MM-DD. */
export function iso(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const today = () => iso()
export const parseIso = (s: string) => new Date(`${s}T12:00:00`)
export const addDays = (s: string, n: number) => {
  const d = parseIso(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const daysBetween = (a: string, b: string) =>
  Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / DAY_MS)

const WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const MON_T = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "THU · 24 SEP" */
export function kickerDate(s: string = today()): string {
  const d = parseIso(s)
  return `${WD[d.getDay()]} · ${d.getDate()} ${MON[d.getMonth()]}`
}

/** "24 Sep" */
export const shortDate = (s: string) => {
  const d = parseIso(s)
  return `${d.getDate()} ${MON_T[d.getMonth()]}`
}

export const monthShort = (s: string) => MON_T[parseIso(s).getMonth()]

export function greeting(h = new Date().getHours()): string {
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export const hhmm = (d: Date = new Date()) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** "today", "yesterday", "3 days ago" */
export function relDay(s: string, now: string = today()): string {
  const n = daysBetween(s, now)
  if (n <= 0) return 'today'
  if (n === 1) return 'yesterday'
  if (n < 14) return `${n} days ago`
  return shortDate(s)
}

export const fmt = (n: number, d = 0) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })
