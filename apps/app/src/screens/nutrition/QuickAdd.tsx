'use client'

import { parseFoodText, parseFoodTextLocally } from '@syntropy/ai'
import {
  FOOD_BY_ID,
  FOODS,
  type Food,
  FREQUENT_IDS,
  itemFromFood,
  type MealItem,
  type MealSlot,
  SLOT_LABEL,
  searchFoods,
  slotForHour,
} from '@syntropy/nutrition'
import { BottomSheet, Icon, IconButton, PillButton, Screen, TextField } from '@syntropy/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { aiToast, gemini, withAi } from '@/lib/ai'
import { today } from '@/lib/dates'
import { success, tap } from '@/platform/haptics'
import { toast, useNutrition, useSettings } from '@/stores'

type Tab = 'frequent' | 'indian' | 'recent' | 'mine'

export function QuickAddScreen() {
  const router = useRouter()
  const q = useSearchParams()
  const slot = (q.get('slot') as MealSlot) || slotForHour(new Date().getHours())
  const date = q.get('d') ?? today()
  const meals = useNutrition((s) => s.meals)
  const recent = useNutrition((s) => s.recent)
  const custom = useNutrition((s) => s.customFoods)
  const addItems = useNutrition((s) => s.addItems)
  const models = useSettings((s) => s.models)
  const [text, setText] = useState('')
  const [tab, setTab] = useState<Tab>('frequent')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [parsed, setParsed] = useState<MealItem[]>([])
  const [busy, setBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const byId = useMemo(
    () => ({ ...FOOD_BY_ID, ...Object.fromEntries(custom.map((f) => [f.id, f])) }),
    [custom],
  )
  const list: Food[] = useMemo(() => {
    if (text.trim().length >= 2) return searchFoods(text, [...custom, ...FOODS], 20)
    if (tab === 'frequent') return FREQUENT_IDS.map((id) => byId[id]).filter(Boolean)
    if (tab === 'recent')
      return (recent.length ? recent : FREQUENT_IDS).map((id) => byId[id]).filter(Boolean)
    if (tab === 'mine') return custom
    return FOODS.filter((f) => f.cuisine === 'indian')
  }, [text, tab, recent, custom, byId])

  const existing = meals.find((m) => m.date === date && m.slot === slot)
  const set = (id: string, n: number) => {
    tap()
    setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(20, Math.round(n * 100) / 100)) }))
  }

  const chosen = Object.entries(counts).filter(([, n]) => n > 0)
  const items: MealItem[] = [
    ...chosen.map(([id, n]) => itemFromFood(byId[id], n, 'manual')),
    ...parsed,
  ]
  const kcal = items.reduce((a, i) => a + i.per.kcal * i.qty, 0)
  const portions = chosen.reduce((a, [, n]) => a + n, 0) + parsed.reduce((a, i) => a + i.qty, 0)

  const parse = async () => {
    const t = text.trim()
    if (!t) return
    setBusy(true)
    const r = await withAi(() => parseFoodText(gemini, { model: models.text, text: t }))
    let found: MealItem[] = r.ok ? r.value : []
    if (!r.ok) {
      found = parseFoodTextLocally(t)
      if (!found.length) aiToast(r.message)
    }
    setBusy(false)
    if (!found.length)
      return toast('Could not find foods in that sentence. Try “2 roti and a katori dal”.', {
        icon: 'sparkle',
      })
    // Table foods go into the steppers; anything else stays as its own row.
    const next = { ...counts }
    const rest: MealItem[] = []
    for (const it of found) {
      if (it.foodId && byId[it.foodId])
        next[it.foodId] = Math.round(((next[it.foodId] ?? 0) + it.qty) * 100) / 100
      else rest.push(it)
    }
    setCounts(next)
    setParsed((p) => [...p, ...rest])
    setText('')
    success()
  }

  const save = () => {
    if (!items.length) return
    addItems(date, slot, items, !!existing)
    success()
    toast(`Added to ${SLOT_LABEL[slot].toLowerCase()}`)
    router.back()
  }

  return (
    <Screen
      orbs={[
        { tone: 'ember', strength: 0.3, size: 540, right: -240, top: -120 },
        { tone: 'sage', strength: 0.3, size: 520, left: -260, bottom: -220 },
      ]}
    >
      <ModalHeader
        left={<IconButton icon="close" label="Close" onClick={() => router.back()} />}
        title={`Add to ${SLOT_LABEL[slot].toLowerCase()}`}
        right={<IconButton icon="camera" label="Scan instead" href={`/scan/?slot=${slot}`} />}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void parse()
        }}
        style={{ margin: 0 }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 58,
            padding: '0 8px 0 16px',
            borderRadius: 22,
            background: 'rgba(255,199,176,0.06)',
            border: '1px solid rgba(255,199,176,0.25)',
          }}
        >
          <Icon
            name="sparkle"
            size={18}
            style={{ color: '#FFC7B0', animation: busy ? 'sy-pulse 1s infinite' : undefined }}
          />
          <span className="sy-sr-only">Describe what you ate</span>
          <input
            type="text"
            enterKeyHint="done"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="“2 more roti and a katori of dahi”"
            style={{
              flexGrow: 1,
              minWidth: 0,
              height: 44,
              border: 0,
              outline: 'none',
              background: 'transparent',
              font: 'inherit',
              fontSize: 14.5,
              color: '#F3F1EC',
            }}
          />
          {text.trim() ? (
            <IconButton
              icon="arrowUp"
              label="Understand this sentence"
              size={42}
              iconSize={18}
              variant="bone"
              onClick={() => void parse()}
              disabled={busy}
            />
          ) : (
            <IconButton
              icon="mic"
              label="Speak instead"
              size={42}
              iconSize={18}
              variant="plain"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              onClick={() =>
                toast('Tap the mic on your keyboard and say what you ate.', { icon: 'mic' })
              }
            />
          )}
        </label>
      </form>
      <div
        className="hide-scroll"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}
      >
        {(
          [
            ['frequent', 'Frequent'],
            ['indian', 'Indian'],
            ['recent', 'Recent'],
            ['mine', 'My foods'],
          ] as [Tab, string][]
        ).map(([k, label]) => {
          const on = tab === k && text.trim().length < 2
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setTab(k)
                setText('')
              }}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                font: 'inherit',
                fontSize: 13,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                background: on ? '#F3F1EC' : 'transparent',
                color: on ? '#0B0F0D' : 'rgba(243,241,236,0.75)',
                fontWeight: on ? 500 : 400,
                border: on ? '1px solid #F3F1EC' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 130 }}>
        <AnimatePresence initial={false}>
          {parsed.map((it) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                alignItems: 'center',
                gap: 10,
                height: 60,
                padding: '0 8px 0 16px',
                borderRadius: 20,
                background: 'rgba(255,199,176,0.08)',
                border: '1px solid rgba(255,199,176,0.3)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 15 }}>{it.name}</span>
                <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.55)' }}>
                  {it.qty} {it.unit} · {Math.round(it.per.kcal * it.qty)} kcal · Gemini
                </span>
              </div>
              <IconButton
                icon="close"
                label={`Remove ${it.name}`}
                variant="plain"
                onClick={() => setParsed((p) => p.filter((x) => x.id !== it.id))}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {list.map((f) => {
          const n = counts[f.id] ?? 0
          return (
            <div
              key={f.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto',
                alignItems: 'center',
                gap: 10,
                height: 60,
                padding: '0 8px 0 16px',
                borderRadius: 20,
                background: n ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${n ? 'rgba(255,199,176,0.3)' : 'rgba(255,255,255,0.07)'}`,
                transition: 'background 250ms, border-color 250ms',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {f.name}
                </span>
                <span
                  className="sy-mono"
                  style={{
                    fontSize: 11,
                    color: 'rgba(243,241,236,0.55)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {f.unitLabel} · {f.kcal} kcal
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  icon="minus"
                  label={`One less ${f.name}`}
                  variant="plain"
                  onClick={() => set(f.id, n - f.step)}
                  style={{ opacity: n ? 1 : 0.35 }}
                  disabled={!n}
                />
                <span
                  className="sy-dot"
                  style={{ minWidth: 26, textAlign: 'center', fontSize: 20 }}
                >
                  {n === 0.5 ? '½' : n}
                </span>
                <IconButton
                  icon="plus"
                  label={`One more ${f.name}`}
                  variant="plain"
                  onClick={() => set(f.id, n + f.step)}
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>
          )
        })}
        {tab === 'mine' && text.trim().length < 2 ? (
          <PillButton
            variant="outline"
            icon="plus"
            height={52}
            block
            onClick={() => setCreateOpen(true)}
            style={{ borderStyle: 'dashed' }}
          >
            Create a food
          </PillButton>
        ) : null}
        {list.length === 0 && tab !== 'mine' ? (
          <p style={{ textAlign: 'center', color: 'rgba(243,241,236,0.55)', fontSize: 13 }}>
            No match in the table. Press ↑ to let Gemini read the sentence.
          </p>
        ) : null}
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: 220,
          background:
            'linear-gradient(180deg, rgba(11,15,13,0) 0%, rgba(11,15,13,0.9) 45%, #0B0F0D 100%)',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />
      <div
        className="sy-glass-dark"
        style={{
          position: 'fixed',
          left: 16,
          right: 16,
          bottom: 'calc(26px + var(--sy-safe-bottom))',
          maxWidth: 460,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 10px 10px 20px',
          borderRadius: 36,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
          <span style={{ fontSize: 13, color: 'rgba(243,241,236,0.66)' }}>
            {items.length
              ? `${items.length} ${items.length === 1 ? 'food' : 'foods'} · ${portions} ${portions === 1 ? 'portion' : 'portions'}`
              : 'Nothing selected'}
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="sy-dot" style={{ fontSize: 26, lineHeight: 1 }}>
              {Math.round(kcal).toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>kcal</span>
          </span>
        </div>
        <PillButton icon="check" height={52} fontSize={15} onClick={save} disabled={!items.length}>
          Add to {SLOT_LABEL[slot].toLowerCase()}
        </PillButton>
      </div>
      <CreateFoodSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(f) => set(f.id, 1)}
      />
    </Screen>
  )
}

function CreateFoodSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (f: Food) => void
}) {
  const addCustomFood = useNutrition((s) => s.addCustomFood)
  const [v, setV] = useState({
    name: '',
    unitLabel: '1 serving',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
  })
  const num = (s: string) => Math.max(0, Number(s) || 0)
  const ok = v.name.trim().length > 1 && num(v.kcal) > 0
  return (
    <BottomSheet open={open} onClose={onClose} title="Create a food">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextField
          label="Name"
          value={v.name}
          placeholder="Mum's rajma"
          onChange={(e) => setV({ ...v, name: e.target.value })}
        />
        <TextField
          label="One serving is"
          value={v.unitLabel}
          onChange={(e) => setV({ ...v, unitLabel: e.target.value })}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
          <TextField
            label="Calories"
            inputMode="decimal"
            suffix="kcal"
            value={v.kcal}
            onChange={(e) => setV({ ...v, kcal: e.target.value })}
          />
          <TextField
            label="Protein"
            inputMode="decimal"
            suffix="g"
            value={v.protein}
            onChange={(e) => setV({ ...v, protein: e.target.value })}
          />
          <TextField
            label="Carbs"
            inputMode="decimal"
            suffix="g"
            value={v.carbs}
            onChange={(e) => setV({ ...v, carbs: e.target.value })}
          />
          <TextField
            label="Fat"
            inputMode="decimal"
            suffix="g"
            value={v.fat}
            onChange={(e) => setV({ ...v, fat: e.target.value })}
          />
        </div>
        <PillButton
          block
          disabled={!ok}
          onClick={() => {
            const f = addCustomFood({
              name: v.name.trim(),
              cuisine: 'indian',
              category: 'snack',
              unit: 'serving',
              unitLabel: v.unitLabel || '1 serving',
              gramsPerUnit: 100,
              kcal: num(v.kcal),
              protein: num(v.protein),
              carbs: num(v.carbs),
              fat: num(v.fat),
            })
            onCreated(f)
            setV({ name: '', unitLabel: '1 serving', kcal: '', protein: '', carbs: '', fat: '' })
            onClose()
          }}
        >
          Save food
        </PillButton>
      </div>
    </BottomSheet>
  )
}
