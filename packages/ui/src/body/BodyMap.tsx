import type { CSSProperties } from 'react'

export type MuscleState =
  | 'ready'
  | 'recovering'
  | 'fatigued'
  | 'detrained'
  | 'neutral'
  | 'primary'
  | 'secondary'
export type MuscleStates = Partial<Record<string, MuscleState>>

type Shape =
  | { k: 'rect'; x: number; y: number; w: number; h: number; rx: number }
  | { k: 'path'; d: string }
  | { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number }

type Part = { muscle: string | null; shapes: Shape[] }

const r = (x: number, y: number, w: number, h: number, rx: number): Shape => ({
  k: 'rect',
  x,
  y,
  w,
  h,
  rx,
})

// Capsule geometry copied from Recovery.dc.html (viewBox 20 0 120 326). Muscle slugs are
// OpenGym's (packages/core/src/muscles.js). null = drawn but never coloured.
const HEAD: Part[] = [
  {
    muscle: null,
    shapes: [{ k: 'ellipse', cx: 80, cy: 22, rx: 13, ry: 16 }, r(73, 38, 14, 10, 4)],
  },
]
const LIMB_ENDS: Part[] = [
  {
    muscle: null,
    shapes: [
      r(24, 162, 13, 13, 6.5),
      r(123, 162, 13, 13, 6.5),
      r(56, 312, 18, 10, 5),
      r(86, 312, 18, 10, 5),
    ],
  },
]

const FRONT: Part[] = [
  ...HEAD,
  { muscle: 'deltoids', shapes: [r(36, 52, 22, 22, 11), r(102, 52, 22, 22, 11)] },
  { muscle: 'chest', shapes: [r(57, 54, 22, 28, 9), r(81, 54, 22, 28, 9)] },
  { muscle: 'biceps', shapes: [r(32, 78, 14, 36, 7), r(114, 78, 14, 36, 7)] },
  { muscle: 'forearm', shapes: [r(27, 118, 13, 42, 6.5), r(120, 118, 13, 42, 6.5)] },
  {
    muscle: 'abs',
    shapes: [
      r(66, 86, 13, 13, 4),
      r(81, 86, 13, 13, 4),
      r(66, 101, 13, 13, 4),
      r(81, 101, 13, 13, 4),
      r(66, 116, 13, 13, 4),
      r(81, 116, 13, 13, 4),
    ],
  },
  { muscle: 'obliques', shapes: [r(53, 88, 10, 42, 5), r(97, 88, 10, 42, 5)] },
  { muscle: 'hip-flexors', shapes: [{ k: 'path', d: 'M58 134 L102 134 L96 156 L64 156 Z' }] },
  { muscle: 'quadriceps', shapes: [r(54, 158, 23, 72, 11.5), r(83, 158, 23, 72, 11.5)] },
  { muscle: null, shapes: [r(58, 234, 16, 14, 7), r(86, 234, 16, 14, 7)] },
  { muscle: 'calves', shapes: [r(56, 252, 17, 58, 8.5), r(87, 252, 17, 58, 8.5)] },
  ...LIMB_ENDS,
]

const BACK: Part[] = [
  ...HEAD,
  {
    muscle: 'trapezius',
    shapes: [{ k: 'path', d: 'M80 44 L106 60 L98 74 L80 70 L62 74 L54 60 Z' }],
  },
  { muscle: 'deltoids', shapes: [r(36, 54, 22, 20, 10), r(102, 54, 22, 20, 10)] },
  {
    muscle: 'upper-back',
    shapes: [
      { k: 'path', d: 'M60 76 L78 76 L78 118 L66 124 C60 110 56 94 60 76 Z' },
      { k: 'path', d: 'M100 76 L82 76 L82 118 L94 124 C100 110 104 94 100 76 Z' },
    ],
  },
  { muscle: 'triceps', shapes: [r(32, 78, 14, 36, 7), r(114, 78, 14, 36, 7)] },
  { muscle: 'forearm', shapes: [r(27, 118, 13, 42, 6.5), r(120, 118, 13, 42, 6.5)] },
  { muscle: 'lower-back', shapes: [r(68, 122, 10, 20, 5), r(82, 122, 10, 20, 5)] },
  { muscle: 'gluteal', shapes: [r(55, 144, 24, 26, 12), r(81, 144, 24, 26, 12)] },
  { muscle: 'hamstring', shapes: [r(55, 174, 22, 58, 11), r(83, 174, 22, 58, 11)] },
  { muscle: null, shapes: [r(58, 236, 16, 12, 6), r(86, 236, 16, 12, 6)] },
  { muscle: 'calves', shapes: [r(55, 250, 19, 50, 9.5), r(86, 250, 19, 50, 9.5)] },
  ...LIMB_ENDS,
]

const NEUTRAL = {
  fill: 'rgba(243,241,236,0.07)',
  stroke: 'rgba(243,241,236,0.12)',
  strokeWidth: 0.8,
}

function paint(state: MuscleState | undefined): {
  fill: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  style?: CSSProperties
} {
  switch (state) {
    case 'ready':
      return { fill: '#A9C3A0', fillOpacity: 0.9 }
    case 'recovering':
    case 'secondary':
      return { fill: '#FFC7B0', fillOpacity: 0.9 }
    case 'fatigued':
    case 'primary':
      return {
        fill: '#FF6B3D',
        fillOpacity: 1,
        style: { filter: 'drop-shadow(0 0 5px rgba(255,107,61,0.7))' },
      }
    case 'detrained':
      return {
        fill: 'none',
        stroke: 'rgba(243,241,236,0.4)',
        strokeWidth: 1,
        strokeDasharray: '2 2.5',
      }
    default:
      return NEUTRAL
  }
}

function ShapeEl({ s, p }: { s: Shape; p: ReturnType<typeof paint> }) {
  if (s.k === 'rect') return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} {...p} />
  if (s.k === 'ellipse') return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...p} />
  return <path d={s.d} {...p} />
}

type BodyMapProps = {
  side: 'front' | 'back'
  states: MuscleStates
  width?: number
  /** Flat thumbnails (Library) drop the fatigue glow. */
  glow?: boolean
}

/** Front or back capsule body map, coloured by muscle state. */
export function BodyMap({ side, states, width = 140, glow = true }: BodyMapProps) {
  const parts = side === 'front' ? FRONT : BACK
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={(width * 300) / 140}
      viewBox="20 0 120 326"
      style={{ display: 'block' }}
    >
      {parts.map((part, i) =>
        part.shapes.map((s, j) => {
          const p = part.muscle ? paint(states[part.muscle]) : NEUTRAL
          const noGlow = !glow && 'style' in p ? { ...p, style: undefined } : p
          return <ShapeEl key={`${i}-${j}`} s={s} p={noGlow} />
        }),
      )}
    </svg>
  )
}

export const BODY_MUSCLES = {
  front: FRONT.map((p) => p.muscle).filter(Boolean) as string[],
  back: BACK.map((p) => p.muscle).filter(Boolean) as string[],
}
