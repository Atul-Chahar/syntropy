'use client'

import {
  BottomSheet,
  GlassCard,
  IconButton,
  PillButton,
  RowStepper,
  Screen,
  TextField,
} from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { BottomBar, ModalHeader } from '@/components/BottomBar'
import { ALL_EXERCISES, exTitle } from '@/lib/ex'
import { success } from '@/platform/haptics'
import { toast, useTraining } from '@/stores'
import type { Routine, RoutineEx } from '@/stores/training'

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

/** Routine builder (DESIGN_GAPS #4) with an exercise picker (#5). */
export function RoutineScreen() {
  const router = useRouter()
  const id = useSearchParams().get('id')
  const S = useTraining((s) => s.S)
  const save = useTraining((s) => s.saveRoutine)
  const remove = useTraining((s) => s.deleteRoutine)
  const existing = S.routines.find((r) => r.id === id)
  const [r, setR] = useState<Routine>(
    () => existing ?? { id: uid(), name: '', emoji: 'barbell', ex: [] },
  )
  const [pick, setPick] = useState(false)
  const [q, setQ] = useState('')

  const patch = (i: number, p: Partial<RoutineEx>) =>
    setR({ ...r, ex: r.ex.map((e, j) => (j === i ? { ...e, ...p } : e)) })
  const move = (i: number, d: -1 | 1) => {
    const ex = [...r.ex]
    const j = i + d
    if (j < 0 || j >= ex.length) return
    ;[ex[i], ex[j]] = [ex[j], ex[i]]
    setR({ ...r, ex })
  }
  const results =
    q.trim().length > 1
      ? ALL_EXERCISES.filter((e) => e.n.toLowerCase().includes(q.toLowerCase())).slice(0, 40)
      : ALL_EXERCISES.slice(0, 0)

  return (
    <Screen>
      <ModalHeader
        left={<IconButton icon="close" label="Close" onClick={() => router.back()} />}
        title={existing ? 'Edit routine' : 'New routine'}
      />
      <TextField
        label="Name"
        placeholder="Push, Legs, Upper A…"
        value={r.name}
        onChange={(e) => setR({ ...r, name: e.target.value })}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence initial={false}>
          {r.ex.map((e, i) => (
            <motion.div
              key={`${e.id}-${i}`}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <GlassCard
                radius={22}
                padding="12px 12px 12px 16px"
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="sy-mono"
                    style={{ fontSize: 11, color: 'rgba(243,241,236,0.45)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 15,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {exTitle(e.id)}
                  </span>
                  <IconButton
                    icon="chevronLeft"
                    label="Move up"
                    size={36}
                    iconSize={16}
                    variant="plain"
                    onClick={() => move(i, -1)}
                    style={{ transform: 'rotate(90deg)' }}
                  />
                  <IconButton
                    icon="chevronLeft"
                    label="Move down"
                    size={36}
                    iconSize={16}
                    variant="plain"
                    onClick={() => move(i, 1)}
                    style={{ transform: 'rotate(-90deg)' }}
                  />
                  <IconButton
                    icon="trash"
                    label="Remove"
                    size={36}
                    iconSize={16}
                    variant="plain"
                    onClick={() => setR({ ...r, ex: r.ex.filter((_, j) => j !== i) })}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    className="sy-mono"
                    style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}
                  >
                    SETS
                  </span>
                  <RowStepper
                    label="sets"
                    value={e.sets}
                    min={1}
                    max={10}
                    onChange={(v) => patch(i, { sets: v })}
                  />
                  <span
                    className="sy-mono"
                    style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}
                  >
                    REPS
                  </span>
                  <RowStepper
                    label="reps"
                    value={e.reps}
                    min={1}
                    max={30}
                    onChange={(v) => patch(i, { reps: v })}
                  />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
        <PillButton
          variant="outline"
          icon="plus"
          height={52}
          block
          onClick={() => setPick(true)}
          style={{ borderStyle: 'dashed', borderColor: 'rgba(243,241,236,0.3)' }}
        >
          Add exercise
        </PillButton>
      </div>
      {existing ? (
        <PillButton
          variant="ghost"
          icon="trash"
          height={44}
          onClick={() => {
            remove(existing.id)
            toast('Routine deleted')
            router.back()
          }}
          style={{ alignSelf: 'center', color: 'rgba(243,241,236,0.6)' }}
        >
          Delete routine
        </PillButton>
      ) : null}
      <div style={{ height: 96 }} />
      <BottomBar>
        <PillButton
          icon="check"
          block
          disabled={!r.name.trim() || !r.ex.length}
          onClick={() => {
            save({ ...r, name: r.name.trim() })
            success()
            toast('Routine saved')
            router.back()
          }}
        >
          Save routine
        </PillButton>
      </BottomBar>
      <BottomSheet open={pick} onClose={() => setPick(false)} title="Add exercise">
        <TextField
          label="Search 1,324 exercises"
          placeholder="Bench, squat, curl…"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 12,
            maxHeight: '50dvh',
            overflowY: 'auto',
          }}
        >
          {results.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setR({ ...r, ex: [...r.ex, { id: e.id, sets: 3, reps: 10, weight: 0 }] })
                setPick(false)
                setQ('')
              }}
              style={{
                textAlign: 'left',
                minHeight: 52,
                padding: '8px 14px',
                borderRadius: 16,
                font: 'inherit',
                color: '#F3F1EC',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div style={{ fontSize: 14.5, textTransform: 'capitalize' }}>{e.n}</div>
              <div
                className="sy-mono"
                style={{
                  fontSize: 10.5,
                  color: 'rgba(243,241,236,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                {e.tg} · {e.eq}
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>
    </Screen>
  )
}
