/**
 * Equipment presets, the editable equipment checklist, injuries and focus muscles for the
 * on-device plan generator. Equipment lists hold catalogue `eq` values plus a few station tags
 * the catalogue has no column for (a bench, a pull-up bar, a dip station, a box, cardio machines).
 */

/** Station tags: kit the catalogue's `eq` column cannot express. */
export const STATION_TAGS = [
  'bench',
  'pull-up bar',
  'dip station',
  'box',
  'cardio machine',
] as const

export type EquipmentOption = {
  /** The eq value(s) and/or station tags this checkbox toggles. */
  value: string | string[]
  label: string
  group?: string
}

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: ['barbell', 'olympic barbell'], label: 'Barbell', group: 'Free weights' },
  { value: 'dumbbell', label: 'Dumbbells', group: 'Free weights' },
  { value: 'kettlebell', label: 'Kettlebells', group: 'Free weights' },
  { value: 'ez barbell', label: 'EZ bar', group: 'Free weights' },
  { value: 'trap bar', label: 'Trap bar', group: 'Free weights' },
  { value: 'weighted', label: 'Weight plates / vest', group: 'Free weights' },
  { value: 'bench', label: 'Bench', group: 'Stations' },
  { value: 'pull-up bar', label: 'Pull-up bar', group: 'Stations' },
  { value: 'dip station', label: 'Dip station', group: 'Stations' },
  { value: 'box', label: 'Box/step', group: 'Stations' },
  { value: 'cable', label: 'Cable machine', group: 'Machines' },
  { value: ['leverage machine', 'sled machine', 'assisted'], label: 'Machines', group: 'Machines' },
  { value: 'smith machine', label: 'Smith machine', group: 'Machines' },
  {
    value: [
      'cardio machine',
      'stationary bike',
      'elliptical machine',
      'stepmill machine',
      'skierg machine',
      'upper body ergometer',
    ],
    label: 'Cardio machines',
    group: 'Machines',
  },
  { value: ['band', 'resistance band'], label: 'Resistance bands', group: 'Small kit' },
  { value: 'medicine ball', label: 'Medicine ball', group: 'Small kit' },
  { value: 'stability ball', label: 'Stability ball', group: 'Small kit' },
  { value: 'wheel roller', label: 'Ab wheel', group: 'Small kit' },
  { value: 'rope', label: 'Jump rope / battle rope', group: 'Small kit' },
]

const valuesOf = (o: EquipmentOption) => (Array.isArray(o.value) ? o.value : [o.value])

/** Every eq value and station tag the checklist can toggle. */
export const ALL_EQUIPMENT: string[] = [
  'body weight',
  ...EQUIPMENT_OPTIONS.flatMap(valuesOf),
  'bosu ball',
  'tire',
  'hammer',
]

/** The checklist options that are fully switched on by an equipment list. */
export function optionsChecked(equipment: string[]): EquipmentOption[] {
  const have = new Set(equipment)
  return EQUIPMENT_OPTIONS.filter((o) => valuesOf(o).every((v) => have.has(v)))
}

/** Switch one checklist option on or off in an equipment list (returns a new list). */
export function toggleOption(equipment: string[], option: EquipmentOption, on: boolean): string[] {
  const vals = valuesOf(option)
  const rest = equipment.filter((v) => !vals.includes(v))
  return on ? [...rest, ...vals] : rest
}

export type GymPreset = { id: string; label: string; sub: string; equipment: string[] }

const BANDS = ['band', 'resistance band']
const CARDIO = valuesOf(
  EQUIPMENT_OPTIONS.find((o) => o.label === 'Cardio machines') ?? { value: [], label: '' },
)

export const GYM_PRESETS: GymPreset[] = [
  {
    id: 'large',
    label: 'Big commercial gym',
    sub: 'Everything: racks, machines, cables, dumbbells',
    equipment: [...ALL_EQUIPMENT],
  },
  {
    id: 'local',
    label: 'Local gym',
    sub: 'Racks, dumbbells, cables and the usual machines',
    equipment: [
      'body weight',
      'barbell',
      'olympic barbell',
      'dumbbell',
      'kettlebell',
      'ez barbell',
      'weighted',
      'cable',
      'leverage machine',
      'sled machine',
      'assisted',
      'smith machine',
      ...CARDIO,
      ...BANDS,
      'medicine ball',
      'stability ball',
      'rope',
      'bench',
      'pull-up bar',
      'dip station',
      'box',
    ],
  },
  {
    id: 'basic',
    label: 'Basic gym',
    sub: 'Barbell, dumbbells, a bench, one cable and a few machines',
    equipment: [
      'body weight',
      'barbell',
      'dumbbell',
      'ez barbell',
      'weighted',
      'cable',
      'leverage machine',
      'sled machine',
      'cardio machine',
      'stationary bike',
      'bench',
      'pull-up bar',
      'dip station',
    ],
  },
  {
    id: 'garage',
    label: 'Home rack / garage',
    sub: 'Barbell and rack, bench, pull-up bar, a few dumbbells',
    equipment: [
      'body weight',
      'barbell',
      'olympic barbell',
      'dumbbell',
      'kettlebell',
      'weighted',
      ...BANDS,
      'bench',
      'pull-up bar',
      'dip station',
      'box',
    ],
  },
  {
    id: 'home',
    label: 'Home dumbbells + bands',
    sub: 'Adjustable dumbbells, resistance bands and a bench',
    equipment: ['body weight', 'dumbbell', ...BANDS, 'bench'],
  },
  {
    id: 'bodyweight',
    label: 'Bodyweight / calisthenics',
    sub: 'Body weight, bands, a pull-up bar and dip bars',
    equipment: ['body weight', ...BANDS, 'pull-up bar', 'dip station'],
  },
  {
    id: 'travel',
    label: 'Travel / hotel',
    sub: 'Light dumbbells and a band',
    equipment: ['body weight', 'dumbbell', ...BANDS],
  },
]

export type InjuryId = 'shoulder' | 'knee' | 'lower-back' | 'wrist' | 'elbow' | 'neck'

export const INJURIES: { id: InjuryId; label: string; note: string }[] = [
  {
    id: 'shoulder',
    label: 'Shoulder',
    note: 'Shoulder: no overhead pressing, dips, upright rows or behind-the-neck work; dumbbells are preferred over the barbell for pressing.',
  },
  {
    id: 'knee',
    label: 'Knee',
    note: 'Knee: no lunges, split squats, jumps, pistols or sissy squats. Squat only to a pain-free depth.',
  },
  {
    id: 'lower-back',
    label: 'Lower back',
    note: 'Lower back: no deadlifts, good mornings, swings or bent-over barbell rows; rows are chest- or seat-supported.',
  },
  {
    id: 'wrist',
    label: 'Wrist',
    note: 'Wrist: no front squats or wrist curls; push-ups only when nothing else fits (use push-up handles or fists).',
  },
  {
    id: 'elbow',
    label: 'Elbow',
    note: 'Elbow: no skull crushers or heavy close-grip pressing; triceps work uses cables or bands.',
  },
  { id: 'neck', label: 'Neck', note: 'Neck: no neck work, shrugs or behind-the-neck movements.' },
]

export type FocusId = 'chest' | 'back' | 'shoulders' | 'arms' | 'glutes' | 'legs' | 'core'

export const FOCUS_MUSCLES: { id: FocusId; label: string; targets: string[] }[] = [
  { id: 'chest', label: 'Chest', targets: ['pectorals'] },
  { id: 'back', label: 'Back', targets: ['lats', 'upper back', 'traps'] },
  { id: 'shoulders', label: 'Shoulders', targets: ['delts'] },
  { id: 'arms', label: 'Arms', targets: ['biceps', 'triceps', 'forearms'] },
  { id: 'glutes', label: 'Glutes', targets: ['glutes', 'abductors'] },
  {
    id: 'legs',
    label: 'Legs',
    targets: ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  },
  { id: 'core', label: 'Core', targets: ['abs', 'spine', 'serratus anterior'] },
]
