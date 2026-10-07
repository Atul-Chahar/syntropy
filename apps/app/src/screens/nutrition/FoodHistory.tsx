'use client'

import { fitDot, GlassCard, IconButton, Screen, Segmented } from '@syntropy/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ModalHeader } from '@/components/BottomBar'
import { addDays, fmt, iso, parseIso, shortDate, today } from '@/lib/dates'
import { dayColor, useDayStats } from '@/lib/foodHistory'
import { mondayOf } from '@/lib/training'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Food history: monthly calendar heatmap and weekly bars of kcal against target. */
export function FoodHistoryScreen() {
  const router = useRouter()
  const [view, setView] = useState<'week' | 'month'>('month')
  const [offset, setOffset] = useState(0)
  const t = today()

  const dates = useMemo(() => {
    if (view === 'week') {
      const mon = addDays(mondayOf(t), offset * 7)
      return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
    }
    const base = parseIso(t)
    const first = new Date(base.getFullYear(), base.getMonth() + offset, 1, 12)
    const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    return Array.from({ length: n }, (_, i) =>
      iso(new Date(first.getFullYear(), first.getMonth(), i + 1, 12)),
    )
  }, [view, offset, t])

  const stats = useDayStats(dates)
  const logged = stats.filter((d) => d.meals && d.date <= t)
  const avg = (k: 'kcal' | 'protein') =>
    logged.length ? logged.reduce((a, d) => a + d[k], 0) / logged.length : 0
  const onTarget = logged.filter((d) => Math.abs(d.kcal / d.target - 1) <= 0.1).length
  const first = parseIso(dates[0])
  const title =
    view === 'month'
      ? `${MONTHS[first.getMonth()]} ${first.getFullYear()}`
      : `${shortDate(dates[0])} – ${shortDate(dates[6])}`
  const lead = view === 'month' ? (first.getDay() + 6) % 7 : 0
  const max = Math.max(...stats.map((d) => Math.max(d.kcal, d.target)), 1)
  const open = (d: string) => router.push(d === t ? '/food/' : `/food/?d=${d}`)

  return (
    <Screen
      orbs={[
        { tone: 'sage', strength: 0.34, left: -240, top: -120 },
        { tone: 'ember', strength: 0.28, right: -260, bottom: -200 },
      ]}
    >
      <ModalHeader
        left={<IconButton icon="chevronLeft" label="Back" onClick={() => router.back()} />}
        title="Food history"
        sub="CALORIES VS TARGET"
      />
      <Segmented
        label="View"
        fill
        value={view}
        onChange={(v) => {
          setView(v)
          setOffset(0)
        }}
        options={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="chevronLeft" label="Earlier" onClick={() => setOffset(offset - 1)} />
        <span style={{ fontSize: 17, fontWeight: 400, letterSpacing: '-0.02em' }}>{title}</span>
        <IconButton
          icon="chevronRight"
          label="Later"
          onClick={() => setOffset(offset + 1)}
          disabled={offset >= 0}
          style={{ opacity: offset >= 0 ? 0.35 : 1 }}
        />
      </div>

      <GlassCard padding={14} radius={28}>
        {view === 'month' ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0,1fr))',
                gap: 6,
                marginBottom: 6,
              }}
            >
              {WD.map((w, i) => (
                <span
                  key={i}
                  className="sy-mono"
                  style={{ textAlign: 'center', fontSize: 10, color: 'rgba(243,241,236,0.45)' }}
                >
                  {w}
                </span>
              ))}
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 6 }}
            >
              {Array.from({ length: lead }, (_, i) => (
                <span key={`l${i}`} />
              ))}
              {stats.map((d) => {
                const c = dayColor(d)
                const future = d.date > t
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={future}
                    onClick={() => open(d.date)}
                    aria-label={`${shortDate(d.date)}: ${d.meals ? `${Math.round(d.kcal)} kcal of ${d.target}` : 'nothing logged'}`}
                    style={{
                      aspectRatio: '1 / 1.15',
                      borderRadius: 12,
                      border:
                        d.date === t ? '1.5px solid #FFC7B0' : '1px solid rgba(255,255,255,0.06)',
                      background: future ? 'transparent' : c.bg,
                      color: c.fg,
                      font: 'inherit',
                      cursor: future ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      padding: 0,
                      opacity: future ? 0.3 : 1,
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>
                      {parseIso(d.date).getDate()}
                    </span>
                    {d.meals ? (
                      <span className="sy-mono" style={{ fontSize: 8.5, opacity: 0.85 }}>
                        {(d.kcal / 1000).toFixed(1)}k
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div
            style={{
              position: 'relative',
              height: 200,
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0,1fr))',
              gap: 10,
              alignItems: 'end',
              paddingTop: 18,
            }}
          >
            {stats.map((d, i) => {
              const c = dayColor(d)
              const h = (d.kcal / max) * 160
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => open(d.date)}
                  disabled={d.date > t}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    border: 0,
                    background: 'transparent',
                    color: '#F3F1EC',
                    font: 'inherit',
                    cursor: 'pointer',
                    padding: 0,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span
                    className="sy-mono"
                    style={{ fontSize: 9.5, color: 'rgba(243,241,236,0.6)' }}
                  >
                    {d.meals ? fmt(Math.round(d.kcal)) : ''}
                  </span>
                  <span
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 160,
                      display: 'flex',
                      alignItems: 'flex-end',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: -4,
                        right: -4,
                        bottom: (d.target / max) * 160,
                        borderTop: '1px dashed rgba(243,241,236,0.35)',
                      }}
                    />
                    <span
                      style={{
                        width: '100%',
                        height: Math.max(d.meals ? 4 : 2, h),
                        borderRadius: 8,
                        background: d.meals ? c.bg : 'rgba(255,255,255,0.06)',
                        transition: 'height 500ms var(--sy-ease)',
                      }}
                    />
                  </span>
                  <span
                    className="sy-mono"
                    style={{
                      fontSize: 10.5,
                      color: d.date === t ? '#FFC7B0' : 'rgba(243,241,236,0.55)',
                    }}
                  >
                    {WD[i]}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            marginTop: 14,
            fontSize: 11.5,
            color: 'rgba(243,241,236,0.65)',
          }}
        >
          {[
            ['rgba(169,195,160,0.6)', 'On target ±10%'],
            ['rgba(255,199,176,0.45)', 'Under'],
            ['rgba(255,107,61,0.6)', 'Over'],
            ['rgba(255,255,255,0.06)', 'Not logged'],
          ].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
              {l}
            </span>
          ))}
          {view === 'week' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, borderTop: '1px dashed rgba(243,241,236,0.5)' }} />
              Target
            </span>
          ) : null}
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
        {[
          ['Avg intake', fmt(Math.round(avg('kcal'))), 'kcal'],
          ['Avg protein', String(Math.round(avg('protein'))), 'g'],
          ['On target', `${onTarget}/${logged.length}`, 'days'],
        ].map(([k, v, u]) => (
          <GlassCard
            key={k}
            radius={22}
            padding="12px 12px 14px"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <span style={{ fontSize: 11.5, color: 'rgba(243,241,236,0.6)' }}>{k}</span>
            <span
              style={{
                display: 'flex',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                columnGap: 3,
                containerType: 'inline-size',
              }}
            >
              <span className="sy-dot" style={{ fontSize: fitDot(v, 22), lineHeight: 1 }}>
                {v}
              </span>
              <span style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.55)' }}>{u}</span>
            </span>
          </GlassCard>
        ))}
      </div>

      <section
        aria-label="Days"
        style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}
      >
        {[...logged].reverse().map((d) => (
          <Link
            key={d.date}
            href={d.date === t ? '/food/' : `/food/?d=${d.date}`}
            className="sy-glass"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              alignItems: 'center',
              gap: 10,
              minHeight: 58,
              padding: '8px 16px',
              borderRadius: 20,
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14.5 }}>{d.date === t ? 'Today' : shortDate(d.date)}</span>
              <span className="sy-mono" style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.5)' }}>
                P {Math.round(d.protein)} · C {Math.round(d.carbs)} · F {Math.round(d.fat)} ·{' '}
                {d.meals} meals
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 300 }}>{fmt(Math.round(d.kcal))}</span>
              <span style={{ fontSize: 11, color: 'rgba(243,241,236,0.5)' }}>
                / {fmt(d.target)}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </Screen>
  )
}
