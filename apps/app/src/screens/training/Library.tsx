'use client'

import { registerCustom } from '@syntropy/core/exercises'
import {
  BODY_MUSCLES,
  BottomSheet,
  GlassCard,
  Icon,
  PillButton,
  Screen,
  Segmented,
  TextField,
} from '@syntropy/ui'
import { useMemo, useState } from 'react'
import { Header } from '@/components/BottomBar'
import { ExerciseMedia } from '@/components/ExerciseMedia'
import { ALL_EXERCISES, type Exercise } from '@/lib/ex'
import { primaryMusclesOf } from '@/lib/summary'
import { muscleName } from '@/lib/training'
import { toast, useTraining } from '@/stores'

const GROUPS: [string, string[]][] = [
  ['All', []],
  ['Back', ['back']],
  ['Chest', ['chest']],
  ['Legs', ['upper legs', 'lower legs']],
  ['Shoulders', ['shoulders']],
  ['Arms', ['upper arms', 'lower arms']],
  ['Core', ['waist']],
]
const EQUIP: [string, string | null][] = [
  ['Any equipment', null],
  ['Bodyweight', 'body weight'],
  ['Barbell', 'barbell'],
  ['Dumbbell', 'dumbbell'],
  ['Cable', 'cable'],
  ['Machine', 'leverage machine'],
  ['Band', 'band'],
]
const cap = (s: string) => s.replace(/(^|\s|-)\S/g, (c) => c.toUpperCase())

function Thumb({ ex }: { ex: Exercise }) {
  return <ExerciseMedia exId={ex.id} size={56} />
}

export function LibraryScreen() {
  const S = useTraining((s) => s.S)
  const update = useTraining((s) => s.update)
  const saveRoutine = useTraining((s) => s.saveRoutine)
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('All')
  const [eq, setEq] = useState<string | null>(null)
  const [muscle, setMuscle] = useState<string | null>(null)
  const [limit, setLimit] = useState(40)
  const [adding, setAdding] = useState<Exercise | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [muscleOpen, setMuscleOpen] = useState(false)
  const custom = S.customEx as Exercise[]

  const list = useMemo(() => {
    const parts = GROUPS.find(([g]) => g === group)?.[1] ?? []
    const qq = q.trim().toLowerCase()
    const mine = new Set([
      ...S.routines.flatMap((r) => r.ex.map((e) => e.id)),
      ...S.workouts.slice(-30).flatMap((w) => w.entries.map((e) => e.id)),
    ])
    const ordered = [
      ...custom,
      ...ALL_EXERCISES.filter((e) => mine.has(e.id)),
      ...ALL_EXERCISES.filter((e) => !mine.has(e.id)),
    ]
    return ordered.filter(
      (e) =>
        (!parts.length || parts.includes(e.bp)) &&
        (!eq || e.eq === eq) &&
        (!muscle || primaryMusclesOf(e.id).includes(muscle)) &&
        (!qq || e.n.toLowerCase().includes(qq) || e.tg.toLowerCase().includes(qq)),
    )
  }, [q, group, eq, muscle, custom, S.routines, S.workouts])

  return (
    <Screen
      tabBar
      orbs={[
        { tone: 'ember', strength: 0.3, right: -240, top: -120 },
        { tone: 'sage', strength: 0.34, size: 540, left: -260, bottom: -200 },
      ]}
    >
      <Header
        kicker={`${list.length.toLocaleString('en-IN')} EXERCISES · ANIMATIONS: EXERCISEDB`}
        title="Library"
        right={
          <PillButton
            variant="glass"
            height={44}
            icon="pulse"
            iconSize={16}
            fontSize={13}
            onClick={() => setMuscleOpen(true)}
            style={{ padding: '0 14px' }}
          >
            {muscle ? muscleName(muscle) : 'By muscle'}
          </PillButton>
        }
      />
      <label
        className="sy-glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 50,
          padding: '0 16px',
          borderRadius: 25,
        }}
      >
        <Icon name="search" size={18} style={{ color: 'rgba(243,241,236,0.6)' }} />
        <span className="sy-sr-only">Search exercises</span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setLimit(40)
          }}
          placeholder="Search 1,324 exercises"
          style={{
            flexGrow: 1,
            height: 44,
            border: 0,
            outline: 'none',
            background: 'transparent',
            font: 'inherit',
            fontSize: 15,
            color: '#F3F1EC',
          }}
        />
      </label>
      <div style={{ margin: '0 -20px', padding: '0 20px' }}>
        <Segmented
          label="Muscle group"
          value={group}
          onChange={(g) => {
            setGroup(g)
            setLimit(40)
          }}
          fontSize={13.5}
          padding={16}
          options={GROUPS.map(([g]) => ({ value: g, label: g }))}
        />
      </div>
      <div
        className="hide-scroll"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}
      >
        {EQUIP.map(([label, v]) => {
          const on = eq === v
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => setEq(v)}
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                font: 'inherit',
                fontSize: 12.5,
                flexShrink: 0,
                cursor: 'pointer',
                background: on ? 'rgba(169,195,160,0.16)' : 'transparent',
                color: on ? '#C9DCBF' : 'rgba(243,241,236,0.72)',
                border: `1px solid ${on ? 'rgba(169,195,160,0.35)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        style={{
          display: 'grid',
          gridTemplateColumns: '56px minmax(0,1fr) auto',
          alignItems: 'center',
          gap: 12,
          padding: 8,
          borderRadius: 22,
          font: 'inherit',
          color: '#F3F1EC',
          cursor: 'pointer',
          textAlign: 'left',
          background: 'transparent',
          border: '1px dashed rgba(243,241,236,0.25)',
        }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <Icon name="plus" size={22} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 15 }}>Create your own exercise</span>
          <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.58)' }}>
            Name it, tag muscles, no demo needed
          </span>
        </span>
        <Icon
          name="chevronRight"
          size={18}
          style={{ color: 'rgba(243,241,236,0.6)', marginRight: 8 }}
        />
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.slice(0, limit).map((e) => {
          const prim = primaryMusclesOf(e.id).slice(0, 2).map(muscleName)
          return (
            <GlassCard
              key={e.id}
              radius={22}
              padding={8}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px minmax(0,1fr) auto',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Thumb ex={e} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 15,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cap(e.n)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'rgba(243,241,236,0.58)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {[...(prim.length ? prim : [cap(e.tg)]), cap(e.eq)].join(' · ')}
                </span>
              </div>
              <button
                type="button"
                aria-label={`Add ${e.n} to plan`}
                onClick={() => setAdding(e)}
                style={{
                  height: 40,
                  padding: '0 14px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  font: 'inherit',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: '#C9DCBF',
                  background: 'rgba(169,195,160,0.1)',
                  border: '1px solid rgba(169,195,160,0.25)',
                }}
              >
                <Icon name="plus" size={14} />
                Plan
              </button>
            </GlassCard>
          )
        })}
        {list.length > limit ? (
          <PillButton variant="glass" height={48} onClick={() => setLimit(limit + 60)}>
            Show more
          </PillButton>
        ) : null}
        {!list.length ? (
          <p style={{ textAlign: 'center', color: 'rgba(243,241,236,0.55)', fontSize: 13.5 }}>
            No exercise matches. Try another word or create your own.
          </p>
        ) : null}
      </div>

      <BottomSheet
        open={!!adding}
        onClose={() => setAdding(null)}
        title={`Add ${adding ? cap(adding.n) : ''} to…`}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {S.routines.map((r) => (
            <PillButton
              key={r.id}
              variant="glass"
              height={52}
              block
              onClick={() => {
                if (!adding) return
                saveRoutine({
                  ...r,
                  ex: [...r.ex, { id: adding.id, sets: 3, reps: 10, weight: 0 }],
                })
                toast(`Added to ${r.name}`)
                setAdding(null)
              }}
            >
              {r.name}
            </PillButton>
          ))}
          <PillButton variant="outline" icon="plus" height={52} block href="/routine/">
            New routine
          </PillButton>
        </div>
      </BottomSheet>

      <BottomSheet open={muscleOpen} onClose={() => setMuscleOpen(false)} title="Filter by muscle">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <PillButton
            variant={muscle ? 'glass' : 'primary'}
            height={40}
            fontSize={13}
            onClick={() => {
              setMuscle(null)
              setMuscleOpen(false)
            }}
          >
            All muscles
          </PillButton>
          {[...new Set([...BODY_MUSCLES.front, ...BODY_MUSCLES.back])].map((m) => (
            <PillButton
              key={m}
              variant={muscle === m ? 'primary' : 'glass'}
              height={40}
              fontSize={13}
              onClick={() => {
                setMuscle(m)
                setMuscleOpen(false)
              }}
            >
              {muscleName(m)}
            </PillButton>
          ))}
        </div>
      </BottomSheet>

      <CreateExercise
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(ex) => {
          update((s) => {
            s.customEx = [...(s.customEx as Exercise[]), ex]
          })
          registerCustom([...custom, ex])
          toast(`${ex.n} added to your library`)
        }}
      />
    </Screen>
  )
}

function CreateExercise({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (e: Exercise) => void
}) {
  const [name, setName] = useState('')
  const [bp, setBp] = useState('back')
  const [eq, setEq] = useState('body weight')
  return (
    <BottomSheet open={open} onClose={onClose} title="Create an exercise">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextField
          label="Name"
          placeholder="Ring rows"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <span className="sy-mono" style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}>
          BODY PART
        </span>
        <Segmented
          label="Body part"
          height={36}
          fontSize={13}
          value={bp}
          onChange={setBp}
          options={[
            { value: 'back', label: 'Back' },
            { value: 'chest', label: 'Chest' },
            { value: 'upper legs', label: 'Legs' },
            { value: 'shoulders', label: 'Shoulders' },
            { value: 'upper arms', label: 'Arms' },
            { value: 'waist', label: 'Core' },
          ]}
        />
        <span className="sy-mono" style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}>
          EQUIPMENT
        </span>
        <Segmented
          label="Equipment"
          height={36}
          fontSize={13}
          value={eq}
          onChange={setEq}
          options={EQUIP.slice(1).map(([l, v]) => ({ value: v as string, label: l }))}
        />
        <PillButton
          block
          disabled={name.trim().length < 2}
          onClick={() => {
            const target =
              {
                back: 'lats',
                chest: 'pectorals',
                'upper legs': 'quads',
                shoulders: 'delts',
                'upper arms': 'biceps',
                waist: 'abs',
              }[bp] ?? 'abs'
            onSave({
              id: `c_${Date.now().toString(36)}`,
              n: name.trim().toLowerCase(),
              bp,
              eq,
              tg: target,
              custom: true,
              st: [],
            })
            setName('')
            onClose()
          }}
        >
          Save exercise
        </PillButton>
      </div>
    </BottomSheet>
  )
}
