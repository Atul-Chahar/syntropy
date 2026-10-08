'use client'

import { Icon, PillButton } from '@syntropy/ui'
import { useMemo } from 'react'
import { ExerciseMedia } from '@/components/ExerciseMedia'
import { EX } from '@/lib/ex'
import { EQUIPMENT_ITEMS, type EquipmentGroup, GROUP_LABEL, kitAllows, sampleId } from '@/lib/plan'
import { tap } from '@/platform/haptics'

const GROUPS = Object.keys(GROUP_LABEL) as EquipmentGroup[]
const ALL = Object.values(EX)

/** How many catalogue exercises a kit makes possible (body weight always counts). */
export const exercisesFor = (kit: string[]) => {
  const set = new Set(kit)
  return ALL.filter((e) => kitAllows(e, set)).length
}

/**
 * The equipment picker: every item a gym can have, grouped, each pictured by the animation of
 * its signature exercise. Tap to toggle; each group can be switched on or off at once.
 */
export function EquipmentPicker({
  value,
  onChange,
  onDone,
}: {
  value: string[]
  onChange: (next: string[]) => void
  onDone: () => void
}) {
  const kit = useMemo(() => new Set(value), [value])
  const count = useMemo(() => exercisesFor(value), [value])

  const toggle = (id: string) => {
    tap()
    onChange(kit.has(id) ? value.filter((v) => v !== id) : [...value, id])
  }
  const setGroup = (g: EquipmentGroup, on: boolean) => {
    const ids = EQUIPMENT_ITEMS.filter((i) => i.group === g).map((i) => i.id)
    onChange(on ? [...new Set([...value, ...ids])] : value.filter((v) => !ids.includes(v)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'rgba(243,241,236,0.62)' }}>
        Tick what your gym has. Plans, swaps and the library only use exercises you can do here.
        Body-weight moves are always included.
      </p>
      {GROUPS.map((g) => {
        const items = EQUIPMENT_ITEMS.filter((i) => i.group === g)
        const all = items.every((i) => kit.has(i.id))
        return (
          <section
            key={g}
            aria-label={GROUP_LABEL[g]}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                className="sy-mono"
                style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
              >
                {GROUP_LABEL[g].toUpperCase()} · {items.filter((i) => kit.has(i.id)).length}/
                {items.length}
              </span>
              <button
                type="button"
                onClick={() => setGroup(g, !all)}
                style={{
                  minHeight: 36,
                  padding: '0 4px',
                  font: 'inherit',
                  fontSize: 12.5,
                  color: '#FFC7B0',
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                {all ? 'Clear' : 'Select all'}
              </button>
            </div>
            <div
              role="group"
              aria-label={GROUP_LABEL[g]}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}
            >
              {items.map((it) => {
                const on = kit.has(it.id)
                const sample = sampleId(it)
                return (
                  <button
                    key={it.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={it.label}
                    onClick={() => toggle(it.id)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: 6,
                      borderRadius: 20,
                      font: 'inherit',
                      textAlign: 'left',
                      color: '#F3F1EC',
                      cursor: 'pointer',
                      background: on ? 'rgba(255,107,61,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${on ? 'rgba(255,183,154,0.6)' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'background 200ms, border-color 200ms',
                    }}
                  >
                    <span
                      style={{
                        opacity: on ? 1 : 0.55,
                        filter: on ? undefined : 'grayscale(0.6)',
                        transition: 'opacity 200ms, filter 200ms',
                      }}
                    >
                      {sample ? <ExerciseMedia exId={sample} size="100%" radius={14} /> : null}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        lineHeight: 1.25,
                        minHeight: 29,
                        padding: '0 2px',
                        color: on ? '#F3F1EC' : 'rgba(243,241,236,0.7)',
                      }}
                    >
                      {it.label}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: 10,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: on ? '#FF6B3D' : 'rgba(11,15,13,0.55)',
                        border: on ? 0 : '1px solid rgba(255,255,255,0.35)',
                        color: '#0B0F0D',
                      }}
                    >
                      {on ? <Icon name="check" size={13} stroke={2.4} /> : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
      <div
        style={{
          position: 'sticky',
          bottom: 'calc(-24px - var(--sy-safe-bottom))',
          margin: '0 -20px calc(-24px - var(--sy-safe-bottom))',
          padding: '28px 20px calc(16px + var(--sy-safe-bottom))',
          background:
            'linear-gradient(180deg, rgba(16,20,18,0) 0px, rgba(16,20,18,0.98) 24px, #101412 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <span
          className="sy-mono"
          style={{ fontSize: 10.5, textAlign: 'center', color: 'rgba(243,241,236,0.6)' }}
        >
          {value.length} ITEMS · {count.toLocaleString('en-IN')} EXERCISES AVAILABLE
        </span>
        <PillButton icon="check" block onClick={onDone}>
          Done
        </PillButton>
      </div>
    </div>
  )
}
