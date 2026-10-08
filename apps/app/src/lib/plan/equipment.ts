/**
 * The equipment picker's catalogue: what a gym can have, grouped, each with the exercise whose
 * animation pictures it. Free weights use the catalogue's own `eq` values as ids; machines,
 * cable stations and cardio machines get specific ids ('m:', 'c:', 'k:') because the catalogue
 * only says "leverage machine" or "cable". `machineTag()` maps each of those exercises to the
 * station it needs, by name.
 */
import { EX, type Exercise } from '@/lib/ex'

export type EquipmentGroup = 'free' | 'stations' | 'machines' | 'cables' | 'cardio' | 'small'

export const GROUP_LABEL: Record<EquipmentGroup, string> = {
  free: 'Free weights',
  stations: 'Benches, racks and bars',
  machines: 'Machines',
  cables: 'Cable stations',
  cardio: 'Cardio machines',
  small: 'Small gear',
}

export type EquipmentItem = {
  id: string
  label: string
  group: EquipmentGroup
  /** Exercise whose animation is the picture for this item (looked up by name). */
  sample: string
}

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'barbell', label: 'Barbell + plates', group: 'free', sample: 'barbell bench press' },
  { id: 'dumbbell', label: 'Dumbbells', group: 'free', sample: 'dumbbell biceps curl' },
  { id: 'kettlebell', label: 'Kettlebells', group: 'free', sample: 'kettlebell swing' },
  { id: 'ez barbell', label: 'EZ curl bar', group: 'free', sample: 'ez barbell curl' },
  { id: 'trap bar', label: 'Trap / hex bar', group: 'free', sample: 'trap bar deadlift' },
  { id: 'weighted', label: 'Weight vest / belt', group: 'free', sample: 'weighted pull-up' },

  {
    id: 'bench',
    label: 'Adjustable bench',
    group: 'stations',
    sample: 'dumbbell incline bench press',
  },
  { id: 'rack', label: 'Squat / power rack', group: 'stations', sample: 'barbell full squat' },
  { id: 'pull-up bar', label: 'Pull-up bar', group: 'stations', sample: 'pull-up' },
  { id: 'dip station', label: 'Dip bars', group: 'stations', sample: 'chest dip' },
  { id: 'box', label: 'Plyo box / step', group: 'stations', sample: 'dumbbell step-up' },
  { id: 'smith machine', label: 'Smith machine', group: 'stations', sample: 'smith squat' },

  { id: 'm:leg-press', label: 'Leg press', group: 'machines', sample: 'sled 45° leg press' },
  { id: 'm:hack-squat', label: 'Hack squat', group: 'machines', sample: 'sled hack squat' },
  {
    id: 'm:leg-extension',
    label: 'Leg extension',
    group: 'machines',
    sample: 'lever leg extension',
  },
  { id: 'm:leg-curl', label: 'Leg curl', group: 'machines', sample: 'lever lying leg curl' },
  {
    id: 'm:calf',
    label: 'Calf raise machine',
    group: 'machines',
    sample: 'lever standing calf raise',
  },
  {
    id: 'm:hip',
    label: 'Hip abductor / adductor',
    group: 'machines',
    sample: 'lever seated hip abduction',
  },
  { id: 'm:chest-press', label: 'Chest press', group: 'machines', sample: 'lever chest press' },
  {
    id: 'm:pec-deck',
    label: 'Pec deck / rear delt',
    group: 'machines',
    sample: 'lever seated fly',
  },
  { id: 'm:shoulder', label: 'Shoulder press', group: 'machines', sample: 'lever shoulder press' },
  {
    id: 'm:lat-pulldown',
    label: 'Lat pulldown',
    group: 'machines',
    sample: 'cable lat pulldown full range of motion',
  },
  { id: 'm:row', label: 'Seated row machine', group: 'machines', sample: 'lever seated row' },
  { id: 'm:t-bar', label: 'T-bar row', group: 'machines', sample: 'lever t bar row' },
  {
    id: 'm:assisted',
    label: 'Assisted pull-up / dip',
    group: 'machines',
    sample: 'assisted pull-up',
  },
  {
    id: 'm:back-extension',
    label: 'Back extension',
    group: 'machines',
    sample: 'lever back extension',
  },
  {
    id: 'm:arms',
    label: 'Arm curl / triceps machine',
    group: 'machines',
    sample: 'lever preacher curl',
  },
  { id: 'm:abs', label: 'Ab crunch machine', group: 'machines', sample: 'lever seated crunch' },
  {
    id: 'm:other',
    label: 'Other plate-loaded machines',
    group: 'machines',
    sample: 'lever deadlift',
  },

  {
    id: 'c:adjustable',
    label: 'Adjustable cable pulley',
    group: 'cables',
    sample: 'cable triceps pushdown (v-bar)',
  },
  { id: 'c:crossover', label: 'Cable crossover', group: 'cables', sample: 'cable middle fly' },
  { id: 'c:row', label: 'Seated cable row', group: 'cables', sample: 'cable seated row' },

  {
    id: 'k:treadmill',
    label: 'Treadmill',
    group: 'cardio',
    sample: 'walking on incline treadmill',
  },
  { id: 'k:bike', label: 'Exercise bike', group: 'cardio', sample: 'stationary bike walk' },
  {
    id: 'k:elliptical',
    label: 'Elliptical',
    group: 'cardio',
    sample: 'walk elliptical cross trainer',
  },
  { id: 'k:stairs', label: 'Stair climber', group: 'cardio', sample: 'walking on stepmill' },
  { id: 'k:skierg', label: 'Ski erg', group: 'cardio', sample: 'ski ergometer' },
  { id: 'k:arm-bike', label: 'Arm bike', group: 'cardio', sample: 'hands bike' },

  { id: 'band', label: 'Resistance bands', group: 'small', sample: 'band squat' },
  {
    id: 'medicine ball',
    label: 'Medicine ball',
    group: 'small',
    sample: 'medicine ball chest pass',
  },
  {
    id: 'stability ball',
    label: 'Stability ball',
    group: 'small',
    sample: 'crunch (on stability ball)',
  },
  { id: 'bosu ball', label: 'Bosu ball', group: 'small', sample: 'squat on bosu ball' },
  { id: 'wheel roller', label: 'Ab wheel', group: 'small', sample: 'wheel rollerout' },
  { id: 'roller', label: 'Foam roller', group: 'small', sample: 'roller back stretch' },
  { id: 'rope', label: 'Jump / battle rope', group: 'small', sample: 'battling ropes' },
  { id: 'tire', label: 'Tyre + sledgehammer', group: 'small', sample: 'tire flip' },
]

export const ITEM_BY_ID = Object.fromEntries(EQUIPMENT_ITEMS.map((i) => [i.id, i]))

const BY_NAME = new Map(Object.values(EX).map((e) => [e.n, e.id]))
/** The catalogue id of an item's picture exercise (null if the name is not in the catalogue). */
export const sampleId = (item: EquipmentItem) => BY_NAME.get(item.sample) ?? null

/** Catalogue `eq` values that are other names for an item. */
const ALIAS: Record<string, string> = {
  'olympic barbell': 'barbell',
  'resistance band': 'band',
  hammer: 'tire',
}

const MACHINE_EQ = new Set(['leverage machine', 'sled machine', 'cable'])
const CARDIO_EQ: Record<string, string> = {
  'stationary bike': 'k:bike',
  'elliptical machine': 'k:elliptical',
  'stepmill machine': 'k:stairs',
  'skierg machine': 'k:skierg',
  'upper body ergometer': 'k:arm-bike',
}

/** The specific machine, cable station or cardio machine an exercise needs (null for others). */
export function machineTag(ex: Exercise): string | null {
  if (CARDIO_EQ[ex.eq]) return CARDIO_EQ[ex.eq]
  if (!MACHINE_EQ.has(ex.eq)) return null
  const n = ex.n.toLowerCase()
  if (ex.eq === 'cable') {
    if (/pull-?down/.test(n) && !/straight arm/.test(n)) return 'm:lat-pulldown'
    if (
      /seated .*row|low seated row|floor seated|squat row|seated row|crossover seated row/.test(n)
    )
      return 'c:row'
    if (/cross-?over|\bfly\b|crossovers/.test(n)) return 'c:crossover'
    return 'c:adjustable'
  }
  if (/treadmill/.test(n)) return 'k:treadmill'
  if (/bike|cycle/.test(n)) return 'k:bike'
  if (/leg press|sled 45|horizontal one leg press|lying squat|leg wide press/.test(n))
    return 'm:leg-press'
  if (/hack/.test(n)) return 'm:hack-squat'
  if (/leg extension/.test(n)) return 'm:leg-extension'
  if (/leg curl/.test(n)) return 'm:leg-curl'
  if (/calf/.test(n)) return 'm:calf'
  if (/hip (abduction|adduction)/.test(n)) return 'm:hip'
  if (/back extension|hyperextension|hip extension/.test(n)) return 'm:back-extension'
  if (/chest press/.test(n)) return 'm:chest-press'
  if (/\bfly\b/.test(n)) return 'm:pec-deck'
  if (/shoulder press|military press|lateral raise/.test(n)) return 'm:shoulder'
  if (/pull-?down/.test(n)) return 'm:lat-pulldown'
  if (/t[- ]?bar/.test(n)) return 'm:t-bar'
  if (/assisted|\bdip\b/.test(n)) return 'm:assisted'
  if (/\brow\b/.test(n)) return 'm:row'
  if (/curl|triceps extension|pullover/.test(n)) return 'm:arms'
  if (/crunch|leg raise|twist/.test(n)) return 'm:abs'
  return 'm:other'
}

/** Old-style equipment lists (before the picker) say 'leverage machine' or 'cable' instead. */
export const isLegacyKit = (kit: Set<string>) =>
  !kit.has('rack') && ![...kit].some((k) => /^[mck]:/.test(k))

const RACK = /squat|bench press|military press|overhead press|good morning|push press|shrug|lunge/

/**
 * The equipment ids an exercise needs from the picker (stations come from `needs()` separately).
 * Body-weight and partner/towel ("assisted") moves need nothing.
 */
export function kitFor(ex: Exercise): string[] {
  const eq = ALIAS[ex.eq] ?? ex.eq
  if (eq === 'body weight' || eq === 'assisted') return []
  const tag = machineTag(ex)
  if (tag) return [tag]
  if (eq === 'smith machine') return ['smith machine']
  const out = [eq]
  // Heavy barbell squats, presses and lunges start from a rack.
  if (eq === 'barbell' && RACK.test(ex.n.toLowerCase()) && !/floor|landmine/.test(ex.n))
    out.push('rack')
  return out
}

/** True when a kit (picker ids, or an old-style list) covers what this exercise needs. */
export function kitAllows(ex: Exercise, kit: Set<string>): boolean {
  const need = kitFor(ex)
  if (!need.length) return true
  if (isLegacyKit(kit)) {
    // Old lists hold catalogue eq values; a rack was implied by having a barbell.
    const eq = ALIAS[ex.eq] ?? ex.eq
    return kit.has(ex.eq) || kit.has(eq) || need.every((n) => kit.has(n))
  }
  return need.every((n) => kit.has(n) || (n === 'barbell' && kit.has('olympic barbell')))
}

/** Catalogue eq values a picker kit unlocks (OpenGym's equipment profile works on these). */
export function catalogueEq(kit: string[]): string[] {
  const set = new Set(kit)
  const out = new Set(['body weight', 'assisted'])
  for (const ex of Object.values(EX)) if (kitAllows(ex, set)) out.add(ex.eq)
  return [...out]
}

export const ALL_ITEM_IDS = EQUIPMENT_ITEMS.map((i) => i.id)
