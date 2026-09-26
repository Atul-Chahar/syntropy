import type { CSSProperties, ReactNode } from 'react'
import { useId } from 'react'
import { cx } from '../link'
import styles from './Screen.module.css'

export type OrbTone = 'sage' | 'ember' | 'peach' | 'water'

const RGB: Record<OrbTone, string> = {
  sage: '137,170,124',
  ember: '255,107,61',
  peach: '255,199,176',
  water: '156,199,224',
}

export type OrbSpec = {
  tone: OrbTone
  size?: number
  /** Alpha at the centre; the board uses .28 to .62. */
  strength?: number
  left?: number
  right?: number
  top?: number
  bottom?: number
}

/** Background glow: a radial gradient fading out at 70 %, as on every board. */
export function Orb({ tone, size = 560, strength = 0.4, ...pos }: OrbSpec) {
  const rgb = RGB[tone]
  const style: CSSProperties = {
    width: size,
    height: size,
    ...pos,
    background: `radial-gradient(circle at center, rgba(${rgb},${strength}) 0%, rgba(${rgb},${(strength / 2.8).toFixed(3)}) 38%, rgba(${rgb},0) 70%)`,
  }
  return <div aria-hidden="true" className={styles.orb} style={style} />
}

/** Film grain overlay: fractal noise at 7 % in overlay blend. */
export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  const id = useId()
  return (
    <svg aria-hidden="true" className={styles.grain} style={{ opacity }}>
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={3}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  )
}

export const DEFAULT_ORBS: OrbSpec[] = [
  { tone: 'ember', strength: 0.3, right: -200, top: 40 },
  { tone: 'sage', strength: 0.4, left: -260, bottom: -200 },
]

type ScreenProps = {
  children: ReactNode
  orbs?: OrbSpec[]
  /** Reserve room for the floating tab bar and draw the bottom fade. */
  tabBar?: boolean
  className?: string
  contentClassName?: string
  /** Extra layers fixed to the viewport (sticky bars, sheets). */
  overlay?: ReactNode
}

/** A phone screen: void ground, orbs, grain, safe-area padding and a centred column. */
export function Screen({
  children,
  orbs = DEFAULT_ORBS,
  tabBar,
  className,
  contentClassName,
  overlay,
}: ScreenProps) {
  return (
    <div className={cx(styles.screen, className)}>
      <div className={styles.backdrop}>
        {orbs.map((o, i) => (
          <Orb key={i} {...o} />
        ))}
        <Grain />
      </div>
      <main className={cx(styles.content, tabBar && styles.withTabBar, contentClassName)}>
        {children}
      </main>
      {tabBar ? <div aria-hidden="true" className={styles.fade} /> : null}
      {overlay}
    </div>
  )
}
