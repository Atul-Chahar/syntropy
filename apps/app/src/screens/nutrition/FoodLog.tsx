'use client'

import { type Meal, type MealSlot, mealTotals, SLOT_LABEL } from '@syntropy/nutrition'
import { GlassCard, Icon, IconButton, PillButton, ProgressBar, Ring, Screen } from '@syntropy/ui'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/BottomBar'
import { addDays, fmt, kickerDate, today } from '@/lib/dates'
import { useToday } from '@/lib/summary'
import { tap } from '@/platform/haptics'
import { useWater } from '@/stores'

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner']

function laterTag(m: Meal): string | null {
  const later = m.items
    .filter((i) => i.addedLater)
    .map((i) => ({ i, extra: i.baseQty != null ? i.qty - i.baseQty : i.qty }))
    .filter((x) => x.extra > 0)
  if (!later.length) return null
  return `${later
    .slice(0, 2)
    .map(({ i, extra }) => `+${extra === 0.5 ? '½' : extra} ${i.name.toLowerCase().split(' ')[0]}`)
    .join(', ')} later`
}

function summaryLine(m: Meal): string {
  if (m.title && m.items.some((i) => i.source === 'photo')) return `${m.title} · scanned`
  return m.items
    .filter((i) => !i.addedLater)
    .map((i) => (i.qty !== 1 ? `${i.name} × ${i.qty === 0.5 ? '½' : i.qty}` : i.name))
    .join(', ')
}

export function FoodLogScreen() {
  const router = useRouter()
  const date = useSearchParams().get('d') ?? today()
  const t = useToday(date)
  const add = useWater((s) => s.add)
  const removeLast = useWater((s) => s.removeLast)
  const glassMl = useWater((s) => s.glassMl)
  const left = t.dt.kcal - t.eaten.kcal
  const glasses = Math.round(t.water / 250)
  const target = Math.max(8, Math.round(t.dt.waterMl / 250))
  const isToday = date === today()
  const go = (d: string) => router.replace(d === today() ? '/food/' : `/food/?d=${d}`)

  return (
    <Screen
      tabBar
      orbs={[
        { tone: 'ember', strength: 0.32, right: -240, top: -120 },
        { tone: 'sage', strength: 0.36, size: 540, left: -260, bottom: -200 },
      ]}
    >
      <Header
        kicker={`${kickerDate(date)} · ${t.training ? 'TRAINING DAY' : 'REST DAY'}`}
        title="Food"
        right={
          <PillButton
            variant="glass"
            height={44}
            icon="target"
            iconSize={16}
            fontSize={13.5}
            href="/goal/"
            style={{ padding: '0 16px' }}
          >
            Targets
          </PillButton>
        }
      />

      <GlassCard
        as="section"
        aria-label="Calories today"
        padding={18}
        style={{ display: 'flex', gap: 18, alignItems: 'center' }}
      >
        <Ring
          size={128}
          stroke={9}
          value={t.eaten.kcal / Math.max(1, t.dt.kcal)}
          color="#FFC7B0"
          glow
          label={`${Math.round(left)} kcal left`}
        >
          <span className="sy-dot" style={{ fontSize: 36, lineHeight: 1 }}>
            {fmt(Math.abs(Math.round(left)))}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(243,241,236,0.62)', marginTop: 3 }}>
            {left >= 0 ? 'kcal left' : 'kcal over'}
          </span>
        </Ring>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 11, flexGrow: 1, minWidth: 0 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'rgba(243,241,236,0.62)',
            }}
          >
            <span>
              Eaten{' '}
              <span style={{ color: '#F3F1EC', fontSize: 14 }}>
                {fmt(Math.round(t.eaten.kcal))}
              </span>
            </span>
            <Link href="/goal/">
              Target <span style={{ color: '#F3F1EC', fontSize: 14 }}>{fmt(t.dt.kcal)}</span>
            </Link>
          </div>
          {[
            ['Protein', t.eaten.protein, t.dt.protein, '#A9C3A0'],
            ['Carbs', t.eaten.carbs, t.dt.carbs, '#FFC7B0'],
            ['Fat', t.eaten.fat, t.dt.fat, '#FF8A5C'],
          ].map(([n, v, g, c]) => (
            <div key={n as string} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'rgba(243,241,236,0.72)' }}>{n}</span>
                <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.6)' }}>
                  {Math.round(v as number)}/{g} g
                </span>
              </div>
              <ProgressBar value={(v as number) / (g as number)} color={c as string} height={5} />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard
        as="section"
        aria-label="Water"
        radius={28}
        padding="16px 16px 14px"
        style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -30,
            bottom: -70,
            width: 220,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(156,199,224,0.22), rgba(156,199,224,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
            <Icon name="drop" size={17} style={{ color: '#9CC7E0' }} />
            Water
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="sy-dot" style={{ fontSize: 24, lineHeight: 1 }}>
              {(t.water / 1000).toFixed(2)}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(243,241,236,0.6)' }}>
              / {(t.dt.waterMl / 1000).toFixed(1)} L
            </span>
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${target}, minmax(0,1fr))`,
            gap: 4,
          }}
        >
          {Array.from({ length: target }, (_, i) => {
            const on = i < glasses
            return (
              <motion.span
                key={i}
                animate={{ scaleY: on ? 1 : 0.92 }}
                style={{
                  height: 26,
                  borderRadius: '6px 6px 9px 9px',
                  background: on
                    ? 'linear-gradient(180deg, rgba(156,199,224,0.55), #9CC7E0)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${on ? 'rgba(156,199,224,0.8)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'background 300ms',
                }}
              />
            )
          })}
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
          <IconButton
            icon="minus"
            label="Remove one glass"
            variant="outline"
            onClick={() => {
              tap()
              removeLast(date)
            }}
            disabled={!t.water}
          />
          <button
            type="button"
            onClick={() => {
              tap()
              add(glassMl, date)
            }}
            style={{
              flexGrow: 1,
              height: 44,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 14,
              font: 'inherit',
              cursor: 'pointer',
              border: '1px solid rgba(156,199,224,0.4)',
              background: 'rgba(156,199,224,0.12)',
              color: '#D3E7F3',
            }}
          >
            <Icon name="plus" size={16} />
            {glassMl} ml glass
          </button>
        </div>
      </GlassCard>

      <section aria-label="Meals" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SLOTS.map((slot) => {
          const m = t.meals.find((x) => x.slot === slot)
          const tot = m ? mealTotals(m) : null
          const tag = m ? laterTag(m) : null
          return (
            <div
              key={slot}
              className="sy-glass"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto 44px',
                alignItems: 'center',
                gap: 8,
                minHeight: 62,
                padding: '8px 6px 8px 16px',
                borderRadius: 22,
              }}
            >
              <Link
                href={m ? `/meal/?id=${m.id}` : `/meal/add/?slot=${slot}&d=${date}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 15 }}>{SLOT_LABEL[slot]}</span>
                  {m ? (
                    <span
                      className="sy-mono"
                      style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}
                    >
                      {m.time}
                    </span>
                  ) : null}
                  {tag ? (
                    <span
                      style={{
                        height: 20,
                        padding: '0 7px',
                        borderRadius: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: 10.5,
                        background: 'rgba(255,199,176,0.14)',
                        color: '#FFD6C4',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {tag}
                    </span>
                  ) : null}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'rgba(243,241,236,0.6)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m ? summaryLine(m) : 'Nothing logged yet'}
                </span>
              </Link>
              {tot ? (
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 2,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 300, letterSpacing: '-0.02em' }}>
                    {fmt(Math.round(tot.kcal))}
                  </span>
                  <span
                    className="sy-mono"
                    style={{ fontSize: 9.5, color: 'rgba(243,241,236,0.5)' }}
                  >
                    P {Math.round(tot.protein)} · C {Math.round(tot.carbs)} · F{' '}
                    {Math.round(tot.fat)}
                  </span>
                </span>
              ) : (
                <span />
              )}
              <IconButton
                icon="plus"
                label={`Add food to ${slot}`}
                href={`/meal/add/?slot=${slot}&d=${date}`}
                variant="plain"
                style={{ background: 'rgba(255,255,255,0.07)' }}
                iconSize={18}
              />
            </div>
          )
        })}
      </section>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <PillButton
          variant="ghost"
          height={44}
          fontSize={13}
          icon="chevronLeft"
          onClick={() => go(addDays(date, -1))}
        >
          Previous day
        </PillButton>
        {isToday ? null : (
          <PillButton
            variant="ghost"
            height={44}
            fontSize={13}
            icon="chevronRight"
            iconAfter
            onClick={() => go(addDays(date, 1))}
          >
            Next day
          </PillButton>
        )}
      </div>
      {t.meals.length === 0 ? (
        <p
          style={{
            margin: '4px 6px 0',
            fontSize: 13,
            color: 'rgba(243,241,236,0.55)',
            textAlign: 'center',
          }}
        >
          Tap the ember button to scan a plate, or + to add by name.
        </p>
      ) : null}
    </Screen>
  )
}
