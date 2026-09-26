'use client'

import { motion } from 'motion/react'
import { useId } from 'react'
import { Icon, type IconName } from '../icons/Icon'
import { cx } from '../link'
import styles from './Segmented.module.css'

export type SegOption<T extends string> = { value: T; label: string; icon?: IconName }

type SegmentedProps<T extends string> = {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  /** Pill height: 40 (default), 44 (RPE), 30 (compact ranges). */
  height?: number
  fontSize?: number
  padding?: number
  fill?: boolean
  className?: string
  disabled?: boolean
}

/** Separate pills, the selected one filled bone (Home range, Goal pace, RPE). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  height = 40,
  fontSize,
  padding,
  fill,
  className,
  disabled,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(styles.pills, fill && styles.fill, className)}
      style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={styles.pill}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          style={{
            height,
            fontSize: fontSize ?? (height <= 32 ? 12 : 14),
            padding: `0 ${padding ?? (height <= 32 ? 12 : 18)}px`,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Dark-glass track with a sliding bone thumb (Scan mode, FormGuide switches). */
export function TrackSegmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Omit<SegmentedProps<T>, 'height' | 'fill'>) {
  const id = useId()
  return (
    <div role="group" aria-label={label} className={cx(styles.track, className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            className={styles.trackItem}
            onClick={() => onChange(o.value)}
          >
            {on ? (
              <motion.span
                layoutId={`${id}-thumb`}
                className={styles.trackThumb}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            ) : null}
            <span className={styles.trackLabel}>
              {o.icon ? <Icon name={o.icon} size={15} /> : null}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Stats-style tabs with a soft moving highlight. */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: Omit<SegmentedProps<T>, 'height' | 'fill'>) {
  const id = useId()
  return (
    <div role="tablist" aria-label={label} className={cx(styles.tabs, className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            className={styles.tab}
            onClick={() => onChange(o.value)}
          >
            {on ? (
              <motion.span
                layoutId={`${id}-tab`}
                className={styles.tabThumb}
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              />
            ) : null}
            <span style={{ position: 'relative' }}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
