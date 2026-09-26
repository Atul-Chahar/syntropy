'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../icons/Icon'
import styles from './Stepper.module.css'

type StepperProps = {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  /** Text shown for the value; defaults to the number. */
  display?: string
  label: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round = (v: number) => Math.round(v * 1000) / 1000

function useStep({ value, onChange, min = 0, max = 99, step = 1 }: StepperProps) {
  return {
    dec: () => onChange(round(clamp(value - step, min, max))),
    inc: () => onChange(round(clamp(value + step, min, max))),
    atMin: value <= min,
    atMax: value >= max,
  }
}

function Value({ text, className }: { text: string; className: string }) {
  return (
    <span className={className} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          style={{ display: 'inline-block' }}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Meal review stepper: a pill track with 40 px buttons and a mono value ("2 pc"). */
export function PillStepper(props: StepperProps) {
  const s = useStep(props)
  return (
    <div className={styles.pill} role="group" aria-label={props.label}>
      <button
        type="button"
        className={styles.pillBtn}
        onClick={s.dec}
        disabled={s.atMin}
        aria-label={`Less ${props.label}`}
      >
        <Icon name="minus" size={16} />
      </button>
      <Value text={props.display ?? String(props.value)} className={styles.pillValue} />
      <button
        type="button"
        className={styles.pillBtn}
        onClick={s.inc}
        disabled={s.atMax}
        aria-label={`More ${props.label}`}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

/** Quick add stepper: 44 px buttons around a Doto count; minus fades at zero. */
export function RowStepper(props: StepperProps) {
  const s = useStep(props)
  return (
    <div className={styles.row} role="group" aria-label={props.label}>
      <button
        type="button"
        className={styles.rowBtn}
        onClick={s.dec}
        disabled={s.atMin}
        aria-label={`Remove one ${props.label}`}
      >
        <Icon name="minus" size={18} />
      </button>
      <Value text={props.display ?? String(props.value)} className={`sy-dot ${styles.rowValue}`} />
      <button
        type="button"
        className={styles.rowBtn}
        onClick={s.inc}
        disabled={s.atMax}
        aria-label={`Add one ${props.label}`}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}

/** Exercise log tile: kicker, outline minus, Doto value, filled plus. */
export function TileStepper(props: StepperProps & { kicker: string }) {
  const s = useStep(props)
  return (
    <div className={styles.tile} role="group" aria-label={props.label}>
      <span className="sy-kicker" style={{ color: 'var(--sy-text-55)' }}>
        {props.kicker}
      </span>
      <div className={styles.tileRow}>
        <button
          type="button"
          className={styles.tileMinus}
          onClick={s.dec}
          disabled={s.atMin}
          aria-label={`Decrease ${props.label}`}
        >
          <Icon name="minus" size={18} />
        </button>
        <Value
          text={props.display ?? String(props.value)}
          className={`sy-dot ${styles.tileValue}`}
        />
        <button
          type="button"
          className={styles.tilePlus}
          onClick={s.inc}
          disabled={s.atMax}
          aria-label={`Increase ${props.label}`}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
    </div>
  )
}
