import type { CSSProperties } from 'react'
import { cx } from '../link'
import styles from './CoachOrb.module.css'

type CoachOrbProps = {
  size?: number
  state?: 'idle' | 'thinking'
  glow?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * The coach avatar from Coach.dc.html and Chat.dc.html: five drifting colour blobs, a conic
 * swirl, a glass highlight and two capsule eyes that blink and glance around. Geometry is
 * specified at 200 px and scaled.
 */
export function CoachOrb({
  size = 200,
  state = 'idle',
  glow = true,
  className,
  style,
}: CoachOrbProps) {
  const k = size / 200
  const px = (v: number) => `${(v * k).toFixed(1)}px`
  const blur = { filter: `blur(${px(10)})` }
  return (
    <div
      aria-hidden="true"
      className={cx(styles.orb, state === 'thinking' && styles.thinking, className)}
      style={{ width: size, height: size, ...style }}
    >
      {glow ? (
        <span
          className={styles.glow}
          style={{ left: px(-60), top: px(-60), width: px(320), height: px(320) }}
        />
      ) : null}
      <div className={styles.ball}>
        <span className={cx(styles.b, styles.b1)} style={blur} />
        <span className={cx(styles.b, styles.b2)} style={blur} />
        <span className={cx(styles.b, styles.b3)} style={blur} />
        <span className={cx(styles.b, styles.b4)} style={blur} />
        <span className={cx(styles.b, styles.b5)} style={blur} />
        <span className={styles.swirl} style={{ filter: `blur(${px(14)})` }} />
        <span
          className={styles.shine}
          style={{
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 ${px(-20)} ${px(40)} rgba(0,0,0,0.32), inset 0 ${px(8)} ${px(20)} rgba(255,255,255,0.22)`,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: px(70),
            top: px(71),
            width: px(60),
            height: px(38),
            display: 'block',
          }}
        >
          <span className={styles.look} style={{ gap: px(26), width: px(60), height: px(38) }}>
            {[0, 1].map((i) => (
              <span
                key={i}
                className={styles.eye}
                style={{
                  width: px(17),
                  height: px(38),
                  borderRadius: px(17),
                  boxShadow: `0 0 ${px(12)} rgba(255,240,230,0.9)`,
                }}
              />
            ))}
          </span>
        </span>
      </div>
    </div>
  )
}

/** Three bouncing peach dots for the "thinking" bubble. */
export function TypingDots() {
  return (
    <span className={styles.dots} role="status" aria-label="Coach is thinking">
      <span className={styles.tdot} />
      <span className={styles.tdot} />
      <span className={styles.tdot} />
    </span>
  )
}

/** Faded-border surfaces from Chat.dc.html. */
export const fadedBorder: CSSProperties = {
  border: '1px solid transparent',
  background:
    'linear-gradient(rgba(22,27,24,.78),rgba(22,27,24,.78)) padding-box,linear-gradient(155deg,rgba(255,255,255,.38) 0%,rgba(255,255,255,.06) 38%,rgba(255,255,255,0) 62%,rgba(255,199,176,.22) 100%) border-box',
  backdropFilter: 'blur(22px) saturate(140%)',
  WebkitBackdropFilter: 'blur(22px) saturate(140%)',
}

export const fadedBorderUser: CSSProperties = {
  border: '1px solid transparent',
  background:
    'linear-gradient(rgba(58,44,38,.72),rgba(58,44,38,.72)) padding-box,linear-gradient(200deg,rgba(255,199,176,.55) 0%,rgba(255,199,176,.08) 40%,rgba(255,255,255,0) 70%) border-box',
}
