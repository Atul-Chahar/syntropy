/**
 * Movement slots for the plan generator: every catalogue exercise is classified into one slot
 * (squat, hinge, h-push…), with the station kit it needs, an injury filter and a ranked list of
 * candidates per slot (curated staples first, then the simplest remaining exercises).
 */
import { ALL_EXERCISES, EX, type Exercise } from '@/lib/ex'

export type Slot =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'leg-press'
  | 'quad-iso'
  | 'ham-curl'
  | 'glute'
  | 'calf'
  | 'h-push'
  | 'incline-push'
  | 'v-push'
  | 'dip'
  | 'fly'
  | 'lateral-raise'
  | 'rear-delt'
  | 'h-pull'
  | 'v-pull'
  | 'biceps'
  | 'triceps'
  | 'core-flex'
  | 'core-anti'
  | 'carry'
  | 'cardio'
  | 'other'

export type Muscle =
  | 'chest'
  | 'back'
  | 'delts'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hams'
  | 'glutes'
  | 'calves'
  | 'core'

export type SlotInfo = {
  label: string
  compound: boolean
  /** Hard-set credit per set for each muscle (1 = direct, 0.5 = meaningful indirect). */
  muscles: Partial<Record<Muscle, number>>
}

export const SLOT_INFO: Record<Slot, SlotInfo> = {
  squat: { label: 'Squat', compound: true, muscles: { quads: 1, glutes: 0.5 } },
  'leg-press': { label: 'Leg press', compound: true, muscles: { quads: 1, glutes: 0.5 } },
  lunge: { label: 'Single-leg', compound: true, muscles: { quads: 1, glutes: 1 } },
  hinge: { label: 'Hinge', compound: true, muscles: { hams: 1, glutes: 1 } },
  'quad-iso': { label: 'Quad isolation', compound: false, muscles: { quads: 1 } },
  'ham-curl': { label: 'Hamstring curl', compound: false, muscles: { hams: 1 } },
  glute: { label: 'Glutes', compound: false, muscles: { glutes: 1 } },
  calf: { label: 'Calves', compound: false, muscles: { calves: 1 } },
  'h-push': {
    label: 'Horizontal press',
    compound: true,
    muscles: { chest: 1, triceps: 0.5, delts: 0.5 },
  },
  'incline-push': {
    label: 'Incline press',
    compound: true,
    muscles: { chest: 1, delts: 0.5, triceps: 0.5 },
  },
  'v-push': { label: 'Overhead press', compound: true, muscles: { delts: 1, triceps: 0.5 } },
  dip: { label: 'Dip', compound: true, muscles: { chest: 0.5, triceps: 1 } },
  fly: { label: 'Chest fly', compound: false, muscles: { chest: 1 } },
  'lateral-raise': { label: 'Lateral raise', compound: false, muscles: { delts: 1 } },
  'rear-delt': { label: 'Rear delts', compound: false, muscles: { delts: 1, back: 0.25 } },
  'h-pull': { label: 'Row', compound: true, muscles: { back: 1, biceps: 0.5, delts: 0.25 } },
  'v-pull': { label: 'Vertical pull', compound: true, muscles: { back: 1, biceps: 0.5 } },
  biceps: { label: 'Biceps', compound: false, muscles: { biceps: 1 } },
  triceps: { label: 'Triceps', compound: false, muscles: { triceps: 1 } },
  'core-flex': { label: 'Abs', compound: false, muscles: { core: 1 } },
  'core-anti': { label: 'Core stability', compound: false, muscles: { core: 1 } },
  carry: { label: 'Carry', compound: true, muscles: { core: 0.5 } },
  cardio: { label: 'Cardio', compound: false, muscles: {} },
  other: { label: 'Other', compound: false, muscles: {} },
}

/**
 * Well-known exercises per slot, best first. Ids were looked up in the catalogue by name; the
 * comment after each id is the catalogue name. Picking walks this list before anything else.
 */
export const STAPLES: Record<Exclude<Slot, 'other'>, string[]> = {
  squat: [
    '0043', // barbell full squat
    '0743', // sled hack squat
    '0042', // barbell front squat
    '1760', // dumbbell goblet squat
    '0770', // smith squat
    '0534', // kettlebell goblet squat
    '0413', // dumbbell squat
    '0852', // weighted squat
    '1004', // band squat
    '1685', // squat to overhead reach (air squat)
  ],
  'leg-press': [
    '0739', // sled 45° leg press
    '0760', // smith leg press
    '2287', // lever alternate leg press
  ],
  lunge: [
    '0410', // dumbbell single leg split squat (Bulgarian)
    '0336', // dumbbell lunge
    '0381', // dumbbell rear lunge
    '0431', // dumbbell step-up
    '0078', // barbell rear lunge
    '0054', // barbell lunge
    '0768', // smith single leg split squat
    '2368', // split squats
    '1460', // walking lunge
    '1001', // band single leg split squat
    '1759', // single leg squat (pistol)
  ],
  hinge: [
    '0085', // barbell romanian deadlift
    '0032', // barbell deadlift
    '0811', // trap bar deadlift
    '1459', // dumbbell romanian deadlift
    '0549', // kettlebell swing
    '0432', // dumbbell stiff leg deadlift
    '0044', // barbell good morning
    '0196', // cable pull through (with rope)
    '1757', // dumbbell single leg deadlift
    '1009', // band stiff leg deadlift
    '0991', // band pull through
    '0573', // lever back extension
  ],
  'quad-iso': [
    '0585', // lever leg extension
    '3007', // resistance band leg extension
    '1489', // sissy squat
  ],
  'ham-curl': [
    '0586', // lever lying leg curl
    '0599', // lever seated leg curl
    '0582', // lever kneeling leg curl
    '0339', // dumbbell lying femoral (dumbbell leg curl)
    '3193', // glute-ham raise
    '0496', // inverse leg curl (bench support), a Nordic curl
  ],
  glute: [
    '1409', // barbell glute bridge
    '3562', // barbell glute bridge two legs on bench (hip thrust)
    '2286', // lever hip extension v. 2
    '0228', // cable standing hip extension
    '0597', // lever seated hip abduction
    '3523', // glute bridge two legs on bench (bodyweight hip thrust)
    '3236', // resistance band hip thrusts on knees
    '3013', // low glute bridge on floor
    '3561', // glute bridge march
  ],
  calf: [
    '0605', // lever standing calf raise
    '1372', // barbell standing calf raise
    '0594', // lever seated calf raise
    '0738', // sled 45° calf press
    '0773', // smith standing leg calf raise
    '0417', // dumbbell standing calf raise
    '0727', // single leg calf raise (on a dumbbell)
    '1373', // bodyweight standing calf raise
    '1490', // standing calf raise (on a staircase)
    '1369', // band two legs calf raise
  ],
  'h-push': [
    '0025', // barbell bench press
    '0289', // dumbbell bench press
    '0576', // lever chest press
    '0748', // smith bench press
    '2144', // cable seated chest press
    '0662', // push-up
    '1298', // kettlebell one arm floor press
    '3124', // resistance band seated chest press
    '1254', // band bench press
    '1311', // wide hand push up
    '0493', // incline push-up
  ],
  'incline-push': [
    '0047', // barbell incline bench press
    '0314', // dumbbell incline bench press
    '1299', // lever incline chest press
    '0757', // smith incline bench press
    '0169', // cable incline bench press
    '3545', // dumbbell incline alternate press
    '0279', // decline push-up
  ],
  'v-push': [
    '0405', // dumbbell seated shoulder press
    '0426', // dumbbell standing overhead press
    '1456', // barbell standing close grip military press
    '0091', // barbell seated overhead press
    '0603', // lever shoulder press
    '0766', // smith shoulder press
    '0219', // cable shoulder press
    '2137', // dumbbell arnold press
    '0553', // kettlebell two arm military press
    '0997', // band shoulder press
    '3122', // resistance band seated shoulder press
    '3662', // pike-to-cobra push-up (pike push-up)
    '0471', // handstand push-up
  ],
  dip: [
    '0251', // chest dip
    '0814', // triceps dip
    '1451', // lever seated dip
    '0009', // assisted chest dip (kneeling)
  ],
  fly: [
    '0596', // lever seated fly (pec deck)
    '0227', // cable standing fly
    '0188', // cable middle fly
    '0308', // dumbbell fly
    '0319', // dumbbell incline fly
    '0179', // cable low fly
    '1270', // cable upper chest crossovers
  ],
  'lateral-raise': [
    '0334', // dumbbell lateral raise
    '0178', // cable lateral raise
    '0584', // lever lateral raise
    '0192', // cable one arm lateral raise
    '0396', // dumbbell seated lateral raise
    '0977', // band front lateral raise
  ],
  'rear-delt': [
    '0203', // cable rear delt row (with rope), a face pull
    '0602', // lever seated reverse fly
    '0378', // dumbbell rear fly
    '0154', // cable cross-over revers fly
    '0993', // band reverse fly
    '1022', // band standing rear delt row
    '0380', // dumbbell rear lateral raise
  ],
  'h-pull': [
    '0027', // barbell bent over row
    '0861', // cable seated row
    '0292', // dumbbell one arm bent-over row
    '1350', // lever seated row
    '0327', // dumbbell incline row (chest supported)
    '0606', // lever t bar row
    '1323', // cable rope seated row
    '0293', // dumbbell bent over row
    '3017', // barbell pendlay row
    '0541', // kettlebell one arm row
    '1359', // smith bent over row
    '0499', // inverted row
    '2300', // inverted row bent knees
    '0988', // band one arm standing low row
    '3144', // resistance band seated straight back row
    '3165', // bodyweight standing row (with towel)
  ],
  'v-pull': [
    '2330', // cable lat pulldown full range of motion
    '0652', // pull-up
    '1326', // chin-up
    '0579', // lever front pulldown
    '0818', // twin handle parallel grip lat pulldown
    '0198', // cable pulldown
    '0651', // pull up (neutral grip)
    '0017', // assisted pull-up
    '0970', // band assisted pull-up
    '0974', // band close-grip pulldown
    '1013', // band underhand pulldown
  ],
  biceps: [
    '0031', // barbell curl
    '0294', // dumbbell biceps curl
    '0313', // dumbbell hammer curl
    '0447', // ez barbell curl
    '0868', // cable curl
    '0318', // dumbbell incline curl
    '0372', // dumbbell preacher curl
    '0592', // lever preacher curl
    '0165', // cable hammer curl (with rope)
    '0968', // band alternating biceps curl
    '3123', // resistance band seated biceps curl
  ],
  triceps: [
    '0241', // cable triceps pushdown (v-bar)
    '0194', // cable overhead triceps extension (rope attachment)
    '0200', // cable pushdown (with rope attachment)
    '0060', // barbell lying triceps extension skull crusher
    '0430', // dumbbell standing triceps extension (overhead)
    '0351', // dumbbell lying triceps extension
    '0607', // lever triceps extension
    '0333', // dumbbell kickback
    '0030', // barbell close-grip bench press
    '0283', // diamond push-up
    '0259', // close-grip push-up
    '0998', // band side triceps extension
    '0129', // bench dip (knees bent)
  ],
  'core-flex': [
    '0175', // cable kneeling crunch
    '0472', // hanging leg raise
    '1452', // lever seated crunch
    '2963', // captains chair straight leg raise
    '0872', // reverse crunch
    '0832', // weighted crunch
    '0274', // crunch floor
    '1005', // band standing crunch
    '0277', // decline crunch
  ],
  'core-anti': [
    '0857', // wheel rollerout
    '2135', // weighted front plank
    '0084', // barbell rollerout
    '0276', // dead bug
    '0979', // band horizontal pallof press
    '0705', // side bridge v. 2 (side plank)
  ],
  carry: [
    '2133', // farmers walk
  ],
  cardio: [
    '3666', // walking on incline treadmill
    '0798', // stationary bike walk
    '2138', // stationary bike run v. 3
    '2141', // walk elliptical cross trainer
    '2311', // walking on stepmill
    '2331', // cycle cross trainer
    '0685', // run
    '2612', // jump rope
    '0128', // battling ropes
    '0630', // mountain climber
    '1160', // burpee
  ],
}

/** Goal / experience preferences that move some staples to the front. */
export const STRENGTH_FIRST: Partial<Record<Slot, string[]>> = {
  hinge: ['0032', '0811'],
  'v-push': ['1456', '0091'],
  squat: ['0043', '0042'],
  'h-pull': ['0027', '3017'],
}
export const NEW_FIRST: Partial<Record<Slot, string[]>> = {
  squat: ['1760', '0534'],
  hinge: ['1459', '0085'],
  'v-pull': ['2330', '0017', '0970'],
  'core-flex': ['0175', '0872'],
  'core-anti': ['0276', '2135'],
}

/** Catalogue rows that must never be picked (mislabelled or duplicate demos). */
const BAD_IDS = new Set(['0696', '0697', '1766', '0577', '1416', '1417'])

/** Names that are stretches, demos, drills or circus variants — never a programmed lift. */
const ODD =
  /stretch|\bpose\b|yoga|massage|\bpov\b|arm blaster|exercise ball|stability ball|bosu|throw|\bjump|plyo|clap|\bhops?\b|explosive|kipping|speed|depth|wipers|isometric|around (the )?world|iron cross|skier|bradford|guillotine|zercher|jefferson|frankenstein|cuban|with leg raised|stork|balance|with bicep|bicep curl lunge|bowling|twist|rotation|rotational|catch|slam|chest pass|chest push|release|squat row|curl to|curl squat|and press|to shoulder press|squatting curl|spell caster|swing 360|potty|planche|maltese|\bflag\b|skin the cat|front lever|back lever|elevator|stalder|body-up|impossible|suspended|towel(?!\))|sledge|tire|windmill|figure 8|bent press|pirate|seesaw|thruster|clean|snatch|jerk|turkish|gripper|squeeze|finger curl|wrist circles|hug|march sit|monster walk|kick/

const BAD_EQ = new Set(['roller', 'tire', 'hammer', 'bosu ball', 'stability ball'])

const ADVANCED =
  /pistol|one arm (chin|pull)|one hand pull|archer|handstand|muscle.?up|inverse leg curl|glute-ham|l-sit|v-sit|one arm dip|single arm push|ring dips|weighted (pull|chin|muscle)|hanging straight|hanging pike|standing ab rollerout|standing wheel/

const lower = (e: Exercise) => e.n.toLowerCase()

/** Classify one catalogue exercise into a movement slot by name, target, body part and kit. */
export function classify(ex: Exercise): Slot {
  const n = lower(ex)
  const tg = ex.tg
  if (BAD_IDS.has(ex.id) || BAD_EQ.has(ex.eq)) return 'other'
  if (ex.bp === 'cardio')
    return /\bjump|scissor|star jump|astride|push to run/.test(n) ? 'other' : 'cardio'
  if (/stretch|\bpose\b|yoga|\bpov\b/.test(n)) return 'other'
  if (/farmer|carry/.test(n)) return 'carry'
  if (ODD.test(n)) return 'other'
  if (ex.bp === 'neck' || tg === 'forearms' || /shrug|wrist/.test(n)) return 'other'

  // Lower body
  if (tg === 'calves' || /calf/.test(n)) return 'calf'
  if (/leg curl|lying femoral|glute-ham|hamstring curl|nordic/.test(n)) return 'ham-curl'
  if (/leg extension|sissy/.test(n)) return 'quad-iso'
  if (/leg press|hack squat|lying squat/.test(n)) return 'leg-press'
  if (/lunge|split squat|step-?up|pistol|single leg squat|one leg squat|curtsey|cossack/.test(n))
    return 'lunge'
  if (
    /deadlift|good morning|kettlebell swing|pull through|rack pull|hyperextension|back extension/.test(
      n,
    )
  )
    return tg === 'abs' ? 'other' : 'hinge'
  if (/squat/.test(n) && !/row|curl|press/.test(n)) return 'squat'
  if (
    ex.bp === 'upper legs' &&
    /glute bridge|hip thrust|hip extension|hip lift|reverse hyper|hip abduction/.test(n)
  )
    return 'glute'

  // Upper body
  if (/reverse fly|revers fly|rear delt|rear lateral|face pull/.test(n)) return 'rear-delt'
  if (tg === 'pectorals' && /\bfly|flyes|cross-?over|pec deck/.test(n)) return 'fly'
  if (/\bdips?\b/.test(n) && !/bench dip|benches|scapula|bench leg|floor/.test(n)) return 'dip'
  if (tg === 'pectorals' && /decline push-?up/.test(n)) return 'incline-push'
  if (tg === 'pectorals' && /incline/.test(n) && /press/.test(n)) return 'incline-push'
  if (tg === 'pectorals' && /pullover/.test(n)) return 'other'
  if (tg === 'pectorals' && /press|push-?up|push up/.test(n)) return 'h-push'
  if (/handstand push|pike push|pike-to-cobra/.test(n)) return 'v-push'
  if (tg === 'delts' && /press|military/.test(n) && !/floor/.test(n)) return 'v-push'
  if (
    tg === 'delts' &&
    /lateral raise|side lying one hand raise|full can/.test(n) &&
    !/front/.test(n)
  )
    return 'lateral-raise'
  if (
    /pulldown|pull-?ups?\b|pull up|chin-?ups?\b|\bchin\b/.test(n) &&
    !/straight arm|pushdown/.test(n)
  )
    return ['lats', 'upper back', 'biceps'].includes(tg) ? 'v-pull' : 'other'
  if (/\brow\b/.test(n) && ['upper back', 'lats'].includes(tg) && !/upright/.test(n))
    return 'h-pull'
  if (tg === 'biceps' && /curl/.test(n)) return 'biceps'
  if (
    tg === 'triceps' &&
    /extension|pushdown|kickback|skull|french press|tate press|close-?grip|diamond|bench dip/.test(
      n,
    )
  )
    return 'triceps'

  // Core
  if (ex.bp === 'waist') {
    if (/plank|side bridge|dead bug|rollerout|rollout|pallof|bird dog|hollow/.test(n))
      return 'core-anti'
    if (/crunch|leg raise|knee raise|sit-?up|v-up|leg-hip raise|hip raise|jackknife/.test(n))
      return 'core-flex'
  }
  return 'other'
}

const STAPLE_SLOT = new Map<string, Slot>()
for (const [slot, ids] of Object.entries(STAPLES)) {
  for (const id of ids) STAPLE_SLOT.set(id, slot as Slot)
}

const slotCache = new Map<string, Slot>()

/** The slot of an exercise id (staples first, then the classifier). */
export function slotOf(idOrEx: string | Exercise): Slot {
  const ex = typeof idOrEx === 'string' ? EX[idOrEx] : idOrEx
  if (!ex) return 'other'
  const staple = STAPLE_SLOT.get(ex.id)
  if (staple) return staple
  let s = slotCache.get(ex.id)
  if (!s) {
    s = classify(ex)
    slotCache.set(ex.id, s)
  }
  return s
}

/** Station tags an exercise needs, inferred from its name. 'low bar' = a bar at hip height. */
export function needs(idOrEx: string | Exercise): string[] {
  const ex = typeof idOrEx === 'string' ? EX[idOrEx] : idOrEx
  if (!ex) return []
  const n = lower(ex)
  const out: string[] = []
  const machine = ['leverage machine', 'sled machine', 'assisted'].includes(ex.eq)
  const freeWeight = [
    'barbell',
    'dumbbell',
    'ez barbell',
    'kettlebell',
    'olympic barbell',
  ].includes(ex.eq)
  if (
    !machine &&
    (/\bbench\b|incline|decline|preacher|\bflat\b/.test(n) ||
      (freeWeight && /lying/.test(n) && !/floor/.test(n))) &&
    !/(incline|decline) push-?up|bench dip|leg raise|bench squat/.test(n)
  )
    out.push('bench')
  if (
    !machine &&
    ex.eq !== 'cable' &&
    /pull-?ups?\b|pull up|chin-?ups?\b|\bchin\b|hanging|muscle.?up|scapular pull|rope climb|with straps/.test(
      n,
    )
  )
    out.push('pull-up bar')
  if (
    !machine &&
    (/\bdips?\b|parallel bars|captains chair|dip cage/.test(n) || ex.id === '2963') &&
    !/bench dip|benches|bench leg|dips floor|scapula/.test(n)
  )
    out.push('dip station')
  if (/\bbox\b|step-?up|stepbox/.test(n)) out.push('box')
  if (/inverted row/.test(n) && !/with straps/.test(n)) out.push('low bar')
  if (ex.bp === 'cardio' && ex.eq === 'leverage machine') out.push('cardio machine')
  return out
}

/** Equipment every user has, and per-exercise overrides (a plank needs no plate). */
const EQ_OVERRIDE: Record<string, string> = { '2135': 'body weight', '0852': 'dumbbell' }

const INJURY_RULES: Record<string, RegExp> = {
  shoulder:
    /overhead press|military|shoulder press|push press|arnold|\bdips?\b|upright row|behind (the )?(neck|head)|handstand|pike|kipping|muscle.?up|overhead carry/,
  knee: /lunge|split squat|step-?up|pistol|sissy|jump|plyo|hop|skater|burpee|one leg squat|single leg squat|cossack|curtsey|(^|\s)run( \(|$)|short stride run|high knee/,
  'lower-back':
    /deadlift|good morning|kettlebell swing|rack pull|barbell (bent over|pendlay|reverse grip bent over|one arm bent over) row|pendlay|t bar row|weighted hyperextension|jefferson|zercher|burpee/,
  wrist: /front squat|front chest squat|wrist curl|wrist roller|clean|snatch|planche|handstand/,
  elbow:
    /skull|lying (close-?grip )?triceps extension|lying extension|close-?grip (bench )?press|jm bench|french press|tate press|close grip press/,
  neck: /neck|shrug|behind head/,
}

/** Allowed, but only after everything else in the slot (the "prefer alternatives" cases). */
const INJURY_SOFT: Record<string, RegExp> = {
  shoulder: /barbell (incline )?bench press|barbell decline|wide/,
  knee: /full squat|front squat|leg extension|hack squat/,
  'lower-back':
    /barbell full squat|barbell .*squat|bent over row|one arm bent-over row|hyperextension/,
  wrist: /push-?up|push up/,
  elbow: /barbell curl|close-grip|diamond|\bdips?\b/,
  neck: /overhead|pull-?up|chin-?up/,
}

const allows = (equipment: Set<string>, tag: string) =>
  tag === 'low bar'
    ? ['pull-up bar', 'barbell', 'smith machine', 'dip station'].some((t) => equipment.has(t))
    : equipment.has(tag)

/** Can this exercise be done with this kit and these injuries? */
export function available(
  idOrEx: string | Exercise,
  equipment: string[] | Set<string>,
  injuries: string[] = [],
): boolean {
  const ex = typeof idOrEx === 'string' ? EX[idOrEx] : idOrEx
  if (!ex) return false
  const kit = equipment instanceof Set ? equipment : new Set(equipment)
  const eq = EQ_OVERRIDE[ex.id] ?? ex.eq
  if (eq !== 'body weight' && !kit.has(eq)) return false
  if (!needs(ex).every((t) => allows(kit, t))) return false
  const n = lower(ex)
  for (const inj of injuries) {
    const rule = INJURY_RULES[inj]
    if (rule?.test(n)) return false
    if (inj === 'neck' && ex.bp === 'neck') return false
  }
  return true
}

/** True when an injury makes this exercise a last resort rather than a first pick. */
export function discouraged(idOrEx: string | Exercise, injuries: string[] = []): boolean {
  const ex = typeof idOrEx === 'string' ? EX[idOrEx] : idOrEx
  if (!ex) return false
  const n = lower(ex)
  return injuries.some((inj) => INJURY_SOFT[inj]?.test(n))
}

export const isAdvanced = (idOrEx: string | Exercise) => {
  const ex = typeof idOrEx === 'string' ? EX[idOrEx] : idOrEx
  return !!ex && ADVANCED.test(lower(ex))
}

const EQ_RANK: Record<string, number> = {
  barbell: 0,
  dumbbell: 0,
  'body weight': 0,
  cable: 1,
  'leverage machine': 1,
  'sled machine': 1,
  'smith machine': 2,
  kettlebell: 2,
  'ez barbell': 2,
  band: 2,
  'resistance band': 2,
}

/** Lower is simpler: fewer words, no "v. 2" or bracketed demo variants, common kit first. */
export function simplicity(ex: Exercise): number {
  const n = lower(ex)
  let s = n.split(/\s+/).length
  if (/\(/.test(n)) s += 2
  if (/v\. ?\d/.test(n)) s += 3
  if (/one arm|single|alternat|reverse|wide|close|narrow/.test(n)) s += 1
  return s + (EQ_RANK[ex.eq] ?? 3)
}

/** Every catalogue exercise grouped by slot (built once). */
let bySlot: Map<Slot, Exercise[]> | null = null
export function exercisesInSlot(slot: Slot): Exercise[] {
  if (!bySlot) {
    bySlot = new Map()
    for (const ex of ALL_EXERCISES) {
      const s = slotOf(ex)
      const list = bySlot.get(s) ?? []
      list.push(ex)
      bySlot.set(s, list)
    }
  }
  return bySlot.get(slot) ?? []
}

export type PickContext = {
  equipment: string[]
  injuries: string[]
  experience: 'new' | 'some' | 'experienced'
  goal: 'muscle' | 'strength' | 'fatloss' | 'general'
}

const rankCache = new Map<string, string[]>()

/**
 * Ordered candidate ids for a slot: available staples (goal/experience preferences first),
 * then the remaining available exercises in the slot by simplicity. Injury-discouraged
 * exercises sink to the end; advanced skills are left out unless the lifter is experienced.
 */
export function candidates(slot: Slot, ctx: PickContext): string[] {
  const key = [
    slot,
    ctx.goal,
    ctx.experience,
    [...ctx.equipment].sort().join(','),
    [...ctx.injuries].sort().join(','),
  ].join('|')
  const hit = rankCache.get(key)
  if (hit) return hit
  const kit = new Set(ctx.equipment)
  const ok = (id: string) => {
    const ex = EX[id]
    if (!ex || !available(ex, kit, ctx.injuries)) return false
    if (ctx.experience !== 'experienced' && isAdvanced(ex)) return false
    return true
  }
  const staples = slot === 'other' ? [] : STAPLES[slot]
  const prefer =
    ctx.goal === 'strength' ? STRENGTH_FIRST[slot] : ctx.experience === 'new' ? NEW_FIRST[slot] : []
  const ordered = [...new Set([...(prefer ?? []), ...staples])].filter(ok)
  const rest = exercisesInSlot(slot)
    .filter((ex) => !ordered.includes(ex.id) && ok(ex.id))
    .sort((a, b) => simplicity(a) - simplicity(b) || a.id.localeCompare(b.id))
    .map((ex) => ex.id)
  const all = [...ordered, ...rest]
  const out = [
    ...all.filter((id) => !discouraged(id, ctx.injuries)),
    ...all.filter((id) => discouraged(id, ctx.injuries)),
  ]
  rankCache.set(key, out)
  return out
}

/** How many leading candidates are curated staples (variation stays within these). */
export function stapleCount(slot: Slot, list: string[]): number {
  if (slot === 'other') return 0
  const set = new Set(STAPLES[slot])
  let i = 0
  while (i < list.length && set.has(list[i])) i++
  return i
}
