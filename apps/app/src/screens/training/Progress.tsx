'use client'

import { weightTrend } from '@syntropy/nutrition'
import {
  BottomSheet,
  fitDot,
  GlassCard,
  Icon,
  IconButton,
  PillButton,
  Screen,
  Segmented,
  TileStepper,
} from '@syntropy/ui'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/BottomBar'
import { addDays, fmt, shortDate, today } from '@/lib/dates'
import { useToday, windowAverages } from '@/lib/summary'
import { pickPhoto, takePhotoNative } from '@/platform/camera'
import { success } from '@/platform/haptics'
import { isNative } from '@/platform/native'
import { loadPhoto, savePhoto } from '@/platform/storage'
import { toast, useNutrition, useTraining } from '@/stores'

type Range = 'd7' | 'd30' | 'd90'
const DAYS: Record<Range, number> = { d7: 7, d30: 30, d90: 90 }
const W = 318
const H = 168

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

function Photo({ id, w, d }: { id?: string; w: number; d: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (id) void loadPhoto(id).then(setSrc)
  }, [id])
  return (
    <div
      style={{
        position: 'relative',
        height: 150,
        borderRadius: 22,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(170deg, #2A302C 0%, #151917 100%)',
      }}
    >
      {src ? (
        // biome-ignore lint/performance/noImgElement: local photo
        <img
          src={src}
          alt={`Progress photo, ${shortDate(d)}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(0px)',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            filter: 'blur(7px)',
            background:
              'radial-gradient(ellipse 34% 46% at 50% 88%, rgba(243,241,236,0.22), rgba(243,241,236,0) 70%), radial-gradient(circle at 50% 34%, rgba(243,241,236,0.2) 0 13%, rgba(243,241,236,0) 22%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(255,107,61,0.35), rgba(255,107,61,0) 70%)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          width: 26,
          height: 26,
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10,13,12,0.5)',
          color: 'rgba(243,241,236,0.8)',
        }}
      >
        <Icon name="lock" size={13} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          textShadow: '0 1px 6px rgba(0,0,0,0.6)',
        }}
      >
        <span style={{ fontSize: 13 }}>{w.toFixed(1)} kg</span>
        <span className="sy-mono" style={{ fontSize: 10, color: 'rgba(243,241,236,0.7)' }}>
          {shortDate(d).toUpperCase()}
        </span>
      </div>
    </div>
  )
}

export function ProgressScreen() {
  const S = useTraining((s) => s.S)
  const addWeighIn = useTraining((s) => s.addWeighIn)
  const meals = useNutrition((s) => s.meals)
  const t = useToday()
  const [range, setRange] = useState<Range>('d30')
  const [open, setOpen] = useState(false)
  const last = S.bodyweight[S.bodyweight.length - 1]
  const [w, setW] = useState(last?.w ?? 72)
  const [photo, setPhoto] = useState<string | null>(null)

  const chart = useMemo(() => {
    const from = addDays(today(), -DAYS[range])
    const tr = weightTrend(S.bodyweight).filter((x) => x.d >= from)
    if (tr.length < 2) return null
    const vals = tr.flatMap((x) => [x.w, x.ema])
    const lo = Math.min(...vals) - 0.3
    const hi = Math.max(...vals) + 0.3
    const t0 = new Date(`${tr[0].d}T12:00:00`).getTime()
    const t1 = new Date(`${tr[tr.length - 1].d}T12:00:00`).getTime()
    const X = (d: string) =>
      ((new Date(`${d}T12:00:00`).getTime() - t0) / Math.max(1, t1 - t0)) * (W - 12) + 6
    const Y = (v: number) => 12 + (1 - (v - lo) / (hi - lo)) * 144
    const pts = tr.map((x) => [X(x.d), Y(x.ema)] as [number, number])
    const line = smooth(pts)
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`
    const dots = tr.map((x) => ({ x: X(x.d), y: Y(x.w) }))
    const labels = [0, 1, 2, 3].map((k) => {
      const idx = Math.round((k / 3) * (tr.length - 1))
      return { x: (X(tr[idx].d) / W) * 100, t: shortDate(tr[idx].d).toUpperCase() }
    })
    const delta = tr[tr.length - 1].ema - tr[0].ema
    return {
      line,
      area,
      dots,
      labels,
      lx: pts[pts.length - 1][0],
      ly: pts[pts.length - 1][1],
      delta,
      current: tr[tr.length - 1].ema,
    }
  }, [S.bodyweight, range])

  const avg = useMemo(
    () => windowAverages(S, meals, t.body, DAYS[range]),
    [S, meals, t.body, range],
  )
  const milestones = useMemo(() => {
    const withPhoto = S.bodyweight.filter((b) => b.photoId).slice(-3)
    if (withPhoto.length) return withPhoto
    const bw = S.bodyweight
    if (bw.length < 3) return bw
    return [bw[0], bw[Math.floor(bw.length / 2)], bw[bw.length - 1]]
  }, [S.bodyweight])

  const save = async () => {
    let photoId: string | undefined
    if (photo) {
      photoId = `pp_${Date.now().toString(36)}`
      await savePhoto(photoId, photo)
    }
    addWeighIn(Math.round(w * 10) / 10, today(), photoId)
    success()
    toast('Weigh-in saved')
    setPhoto(null)
    setOpen(false)
  }

  return (
    <Screen
      tabBar
      orbs={[
        { tone: 'sage', strength: 0.4, left: -240, top: -140 },
        { tone: 'ember', strength: 0.28, right: -260, bottom: -200 },
      ]}
    >
      <Header
        kicker="WEIGHT · MOVING AVERAGE"
        title="Body"
        right={<IconButton icon="plus" label="Add weigh-in" onClick={() => setOpen(true)} />}
      />
      <Segmented
        label="Time range"
        value={range}
        onChange={setRange}
        options={[
          { value: 'd7', label: '7D' },
          { value: 'd30', label: '30D' },
          { value: 'd90', label: '90D' },
        ]}
      />
      <GlassCard
        as="section"
        aria-label="Weight trend"
        padding="18px 16px 14px"
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '0 2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="sy-dot" style={{ fontSize: 56, lineHeight: 0.9 }}>
              {(chart?.current ?? last?.w ?? 0).toFixed(1)}
            </span>
            <span style={{ fontSize: 15, color: 'rgba(243,241,236,0.62)' }}>kg</span>
          </div>
          {chart ? (
            <span
              style={{
                height: 30,
                padding: '0 12px',
                borderRadius: 15,
                display: 'flex',
                alignItems: 'center',
                fontSize: 13,
                background: 'rgba(169,195,160,0.14)',
                color: '#C9DCBF',
              }}
            >
              {chart.delta > 0 ? '+' : '−'}
              {Math.abs(chart.delta).toFixed(1)} kg · {range.slice(1).toUpperCase()}D
            </span>
          ) : null}
        </div>
        {chart ? (
          <>
            <svg
              aria-hidden="true"
              width="100%"
              viewBox={`0 0 ${W} ${H}`}
              style={{ display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="pg-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#FFC7B0" />
                  <stop offset="1" stopColor="#A9C3A0" />
                </linearGradient>
                <linearGradient id="pg-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#A9C3A0" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#A9C3A0" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[12, 60, 108, 156].map((g) => (
                <line
                  key={g}
                  x1="0"
                  x2={W}
                  y1={g}
                  y2={g}
                  stroke="rgba(243,241,236,0.08)"
                  strokeDasharray="2 5"
                />
              ))}
              <motion.path
                key={`a${range}`}
                d={chart.area}
                fill="url(#pg-area)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              />
              {chart.dots.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={range === 'd90' ? 1.6 : 2.4}
                  fill="#F3F1EC"
                  fillOpacity="0.28"
                />
              ))}
              <motion.path
                key={`l${range}`}
                d={chart.line}
                fill="none"
                stroke="url(#pg-line)"
                strokeWidth="2.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
              />
              <circle cx={chart.lx} cy={chart.ly} r="12" fill="rgba(169,195,160,0.22)" />
              <circle cx={chart.lx} cy={chart.ly} r="5" fill="#F3F1EC" />
            </svg>
            <div style={{ position: 'relative', height: 14 }}>
              {chart.labels.map((l, i) => (
                <span
                  key={l.t + i}
                  className="sy-mono"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `${l.x}%`,
                    transform: i === 3 ? 'translateX(-100%)' : i ? 'translateX(-50%)' : undefined,
                    fontSize: 10,
                    color: 'rgba(243,241,236,0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {l.t}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(243,241,236,0.6)' }}>
            Add two or more weigh-ins to see your trend. Morning, after the bathroom, works best.
          </p>
        )}
      </GlassCard>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
        {[
          ['Volume', (avg.volume / 1000).toFixed(1), 't'],
          ['Energy in', fmt(Math.round(avg.avgIn)), 'kcal'],
          ['Logged', String(avg.logged), 'days'],
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
              <span className="sy-dot" style={{ fontSize: fitDot(v, 24), lineHeight: 1 }}>
                {v}
              </span>
              <span style={{ fontSize: 10.5, color: 'rgba(243,241,236,0.55)' }}>{u}</span>
            </span>
          </GlassCard>
        ))}
      </div>
      <section
        aria-label="Milestones"
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
          <span style={{ fontSize: 15 }}>Milestones</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'rgba(243,241,236,0.55)',
            }}
          >
            <Icon name="lock" size={13} />
            On-device only
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
          {milestones.map((m) => (
            <Photo key={m.d} id={m.photoId} w={m.w} d={m.d} />
          ))}
        </div>
      </section>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Weigh-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TileStepper
            kicker="WEIGHT · KG"
            label="weight"
            value={w}
            step={0.1}
            min={30}
            max={250}
            onChange={setW}
            display={w.toFixed(1)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {isNative() ? (
              <PillButton
                variant="glass"
                icon="camera"
                height={48}
                block
                onClick={async () => setPhoto(await takePhotoNative())}
              >
                Photo
              </PillButton>
            ) : null}
            <PillButton
              variant="glass"
              icon="gallery"
              height={48}
              block
              onClick={async () => setPhoto(await pickPhoto())}
            >
              {photo ? 'Photo added' : 'Add a progress photo'}
            </PillButton>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(243,241,236,0.55)' }}>
            Photos stay on this phone and never go to Gemini.
          </p>
          <PillButton icon="check" block onClick={save}>
            Save weigh-in
          </PillButton>
        </div>
      </BottomSheet>
    </Screen>
  )
}
