'use client'

import {
  FOOD_BY_ID,
  formatQty,
  itemFromFood,
  itemMacros,
  type Meal,
  type MealItem,
  type MealSlot,
  macroSplit,
  mealTotals,
  SLOT_LABEL,
} from '@syntropy/nutrition'
import {
  BottomSheet,
  GlassCard,
  Icon,
  IconButton,
  PillButton,
  PillStepper,
  Screen,
} from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { BottomBar, ModalHeader } from '@/components/BottomBar'
import { MealThumb } from '@/components/ThaliArt'
import { fmt, hhmm, today } from '@/lib/dates'
import { success, tap } from '@/platform/haptics'
import { deletePhoto, loadPhoto } from '@/platform/storage'
import { toast, useNutrition } from '@/stores'

const DOTS = [
  '#E2B06A',
  '#F2BE55',
  '#F3F1EC',
  '#8DAF5C',
  '#CFE3F2',
  '#FFC7B0',
  '#A9C3A0',
  '#FF8A5C',
  '#9CC7E0',
]
const QUICK: [string, number, string][] = [
  ['roti', 1, '1 roti'],
  ['dahi', 1, '1 katori dahi'],
  ['rice', 0.5, '½ rice'],
]
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner', 'extra']

/**
 * Meal.dc.html. Two modes: reviewing a fresh scan (the draft; nothing saved until "Log to …")
 * and editing a logged meal (?id=). "Ate more later?" adds to the same meal and tags it.
 */
export function MealReviewScreen() {
  const router = useRouter()
  const id = useSearchParams().get('id')
  const store = useNutrition()
  const logged = id ? store.meals.find((m) => m.id === id) : undefined
  const draft = store.draft
  const editing = !!logged

  const [items, setItems] = useState<MealItem[]>(() =>
    logged ? logged.items : (draft?.items ?? []),
  )
  const [slot, setSlot] = useState<MealSlot>(logged?.slot ?? draft?.slot ?? 'lunch')
  const [slotOpen, setSlotOpen] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const photoId = logged?.photoId ?? draft?.photoId
  const title = logged?.title ?? draft?.title ?? SLOT_LABEL[slot]

  useEffect(() => {
    if (photoId) void loadPhoto(photoId).then(setPhoto)
  }, [photoId])

  const tot = mealTotals({ items })
  const split = macroSplit(tot)
  const confs = items.map((i) => i.confidence).filter((c): c is number => c != null)
  const avg = confs.length
    ? Math.round((confs.reduce((a, b) => a + b, 0) / confs.length) * 100)
    : null
  const kicker = `${SLOT_LABEL[slot].toUpperCase()}${title && title !== SLOT_LABEL[slot] ? ` ${title.toUpperCase()}` : ''} · ${logged?.time ?? hhmm()}${items.some((i) => i.source === 'photo') ? ' · GEMINI' : ''}`

  const setQty = (itemId: string, qty: number) => {
    setItems((xs) =>
      xs
        .map((x) => (x.id === itemId ? { ...x, qty } : x))
        .filter((x) => x.qty > 0 || x.source === 'photo'),
    )
  }
  const addLater = (foodId: string, qty: number) => {
    tap()
    setItems((xs) => {
      const hit = xs.find((x) => x.foodId === foodId)
      if (hit) return xs.map((x) => (x === hit ? { ...x, qty: x.qty + qty, addedLater: true } : x))
      return [...xs, itemFromFood(FOOD_BY_ID[foodId], qty, 'manual', { addedLater: true })]
    })
  }

  const save = () => {
    const kept = items.filter((i) => i.qty > 0)
    if (!kept.length) return
    if (editing && logged) {
      store.updateMeal(logged.id, { items: kept, slot })
      toast('Meal updated')
    } else {
      const existing =
        slot !== 'extra' && store.meals.find((m) => m.date === today() && m.slot === slot)
      if (existing) store.addItems(today(), slot, kept, true)
      else store.saveMeal({ slot, items: kept, title: draft?.title, photoId: draft?.photoId })
      store.setDraft(null)
      toast(`Logged to ${SLOT_LABEL[slot].toLowerCase()}`)
    }
    success()
    router.replace('/food/')
  }

  const remove = () => {
    if (!logged) return
    store.removeMeal(logged.id)
    if (logged.photoId) void deletePhoto(logged.photoId)
    toast('Meal deleted', { icon: 'trash' })
    router.replace('/food/')
  }

  const addedLabel = (it: MealItem) => {
    const extra = it.baseQty != null ? it.qty - it.baseQty : it.addedLater ? it.qty : 0
    return extra > 0 ? `+${extra === 0.5 ? '½' : extra} added` : null
  }

  const dots = useMemo(() => new Map(items.map((it, i) => [it.id, DOTS[i % DOTS.length]])), [items])

  if (!editing && !draft) {
    return (
      <Screen>
        <ModalHeader
          left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
          title="Review meal"
        />
        <GlassCard padding={20}>
          <p style={{ margin: 0, color: 'rgba(243,241,236,0.7)' }}>
            Nothing to review. Scan a plate first.
          </p>
        </GlassCard>
        <PillButton href="/scan/" icon="scan">
          Scan a plate
        </PillButton>
      </Screen>
    )
  }

  return (
    <Screen
      orbs={[
        { tone: 'sage', strength: 0.3, size: 520, left: -220, top: -120 },
        { tone: 'ember', strength: 0.34, right: -260, bottom: -240 },
      ]}
    >
      <ModalHeader
        left={
          <IconButton
            icon="chevronLeft"
            label={editing ? 'Back' : 'Back to scanner'}
            onClick={() => router.back()}
          />
        }
        title={editing ? 'Meal' : 'Review meal'}
        right={
          <button
            type="button"
            aria-label={`Meal slot: ${SLOT_LABEL[slot]}`}
            onClick={() => setSlotOpen(true)}
            className="sy-glass"
            style={{
              height: 44,
              padding: '0 12px 0 16px',
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              font: 'inherit',
              color: '#F3F1EC',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {SLOT_LABEL[slot]}
            <Icon name="chevronDown" size={16} />
          </button>
        }
      />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <MealThumb src={photo} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1, minWidth: 0 }}>
          <div
            className="sy-mono"
            style={{
              fontSize: 10.5,
              color: 'rgba(243,241,236,0.58)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {kicker}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="sy-dot" style={{ fontSize: 50, lineHeight: 0.95 }}>
              {fmt(Math.round(tot.kcal))}
            </span>
            <span style={{ fontSize: 14, color: 'rgba(243,241,236,0.62)' }}>kcal</span>
          </div>
          <div className="sy-mono" style={{ fontSize: 11.5, color: 'rgba(243,241,236,0.72)' }}>
            P {Math.round(tot.protein)} g · C {Math.round(tot.carbs)} g · F {Math.round(tot.fat)} g
          </div>
        </div>
      </div>
      <div aria-hidden="true" style={{ display: 'flex', gap: 4, height: 8 }}>
        {[
          [split.protein, '#A9C3A0'],
          [split.carbs, '#FFC7B0'],
          [split.fat, '#FF8A5C'],
        ].map(([w, c]) => (
          <motion.div
            key={c as string}
            animate={{ width: `calc(${((w as number) * 100).toFixed(1)}% - 3px)` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ height: 8, borderRadius: 4, background: c as string }}
          />
        ))}
      </div>

      <GlassCard as="section" aria-label="Detected items" radius={28} padding="2px 14px 2px 16px">
        <AnimatePresence initial={false}>
          {items.map((it) => {
            const tag = addedLabel(it)
            const kcal = Math.round(itemMacros(it).kcal)
            const step = FOOD_BY_ID[it.foodId ?? '']?.step ?? (it.unit === 'katori' ? 0.5 : 1)
            return (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 58 }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  alignItems: 'center',
                  gap: 10,
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: dots.get(it.id),
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {it.name}
                    </span>
                    {tag ? (
                      <span
                        style={{
                          height: 20,
                          padding: '0 7px',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 10.5,
                          background: 'rgba(255,199,176,0.14)',
                          color: '#FFD6C4',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tag}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className="sy-mono"
                    style={{ fontSize: 11, color: 'rgba(243,241,236,0.58)', paddingLeft: 16 }}
                  >
                    {kcal} kcal
                    {it.confidence != null ? ` · ${Math.round(it.confidence * 100)}% match` : ''}
                  </span>
                </div>
                <PillStepper
                  label={it.name}
                  value={it.qty}
                  step={step}
                  min={0}
                  max={20}
                  onChange={(v) => setQty(it.id, v)}
                  display={formatQty(it.qty, it.unit)}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 40,
            fontSize: 11.5,
            color: 'rgba(243,241,236,0.55)',
          }}
        >
          <span>Portions in pieces, bowls, cups and katoris (150 g)</span>
          {avg != null ? <span className="sy-mono">AVG {avg}%</span> : null}
        </div>
      </GlassCard>

      <section
        aria-label="Add more to this meal"
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: '0 4px',
          }}
        >
          <span style={{ fontSize: 15 }}>Ate more later?</span>
          <Link href={`/meal/add/?slot=${slot}`} style={{ fontSize: 13, color: '#FFC7B0' }}>
            Search foods
          </Link>
        </div>
        <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {QUICK.map(([fid, q, label]) => (
            <button
              key={fid}
              type="button"
              onClick={() => addLater(fid, q)}
              style={{
                height: 44,
                padding: '0 14px',
                borderRadius: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13.5,
                font: 'inherit',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                background: 'rgba(255,199,176,0.08)',
                border: '1px solid rgba(255,199,176,0.28)',
                color: '#FFD6C4',
              }}
            >
              <Icon name="plus" size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>
      {editing ? (
        <PillButton
          variant="ghost"
          icon="trash"
          height={44}
          onClick={remove}
          style={{ alignSelf: 'center', color: 'rgba(243,241,236,0.6)' }}
        >
          Delete this meal
        </PillButton>
      ) : null}
      <div style={{ height: 96 }} />

      <BottomBar gap={10}>
        {editing ? null : (
          <PillButton variant="glass" fontSize={15} href="/scan/" style={{ padding: '0 22px' }}>
            Retake
          </PillButton>
        )}
        <PillButton icon="check" block onClick={save} disabled={!items.some((i) => i.qty > 0)}>
          {editing ? 'Save meal' : `Log to ${SLOT_LABEL[slot].toLowerCase()}`}
        </PillButton>
      </BottomBar>

      <BottomSheet open={slotOpen} onClose={() => setSlotOpen(false)} title="Which meal?">
        <div style={{ display: 'grid', gap: 8 }}>
          {SLOTS.map((s) => (
            <PillButton
              key={s}
              variant={s === slot ? 'primary' : 'glass'}
              height={52}
              block
              onClick={() => {
                setSlot(s)
                setSlotOpen(false)
              }}
            >
              {SLOT_LABEL[s]}
            </PillButton>
          ))}
        </div>
      </BottomSheet>
    </Screen>
  )
}

export type { Meal }
