'use client'

import { BrandMark, Icon, PillButton } from '@syntropy/ui'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { loadSeed } from '@/lib/seed'
import { AuthPage, bottomClass, floatClass } from './parts'

// The particle cloud from Welcome.dc.html: the mark drawn in ~400 dots inside a sparse nebula.
function useCloud() {
  return useMemo(() => {
    let a = 7
    const rnd = () => {
      a = (a * 16807) % 2147483647
      return a / 2147483647
    }
    const inTop = (x: number, y: number) => {
      if (y <= 34) return (x - 50) ** 2 + (y - 34) ** 2 <= 400
      if (y <= 48.4) {
        const t = (y - 34) / 14.4
        return x >= 30 + t * 9 && x <= 50 + t * 9
      }
      return false
    }
    const dots: { x: number; y: number; r: number; c: string; o: number }[] = []
    const S = 4.1
    for (let y = 13; y <= 87; y += 2.3) {
      for (let x = 29; x <= 71; x += 2.3) {
        const top = inTop(x, y)
        const bottom = !top && inTop(100 - x, 100 - y)
        if (!top && !bottom) continue
        const jx = (rnd() - 0.5) * 1.2
        const jy = (rnd() - 0.5) * 1.2
        const band = rnd()
        const c = top
          ? band < 0.35
            ? '#FFC7B0'
            : band < 0.7
              ? '#FF8A5C'
              : '#FF6B3D'
          : band < 0.5
            ? '#A9C3A0'
            : '#8FB083'
        dots.push({
          x: 195 + (x - 50 + jx) * S,
          y: 220 + (y - 50 + jy) * S * 0.93,
          r: 1.1 + rnd() * 1.3,
          c,
          o: 0.55 + rnd() * 0.45,
        })
      }
    }
    for (let i = 0; i < 150; i++) {
      const ang = rnd() * Math.PI * 2
      const rad = 120 + rnd() * 190
      dots.push({
        x: 195 + Math.cos(ang) * rad,
        y: 220 + Math.sin(ang) * rad * 0.8,
        r: 0.6 + rnd() * 0.8,
        c: rnd() < 0.5 ? '#F3F1EC' : '#A9C3A0',
        o: 0.06 + rnd() * 0.16,
      })
    }
    return dots
  }, [])
}

export function WelcomeScreen() {
  const router = useRouter()
  const dots = useCloud()
  return (
    <AuthPage
      orbs={[
        { tone: 'sage', strength: 0.5, left: -240, bottom: -160 },
        { tone: 'ember', strength: 0.45, size: 520, right: -240, bottom: -200 },
      ]}
    >
      <svg
        aria-hidden="true"
        width="100%"
        height="440"
        viewBox="0 0 390 440"
        className={floatClass}
        style={{ position: 'absolute', left: 0, top: 70, maxWidth: 480 }}
      >
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x.toFixed(1)}
            cy={d.y.toFixed(1)}
            r={d.r.toFixed(2)}
            fill={d.c}
            fillOpacity={d.o.toFixed(2)}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={26} />
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.045em' }}>syntropy</span>
        </div>
        <div
          className="sy-mono"
          style={{ fontSize: 11, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
        >
          EN
        </div>
      </div>
      <div className={bottomClass} style={{ position: 'relative', gap: 22, paddingTop: 380 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            className="sy-mono"
            style={{ fontSize: 12, letterSpacing: '0.02em', color: 'rgba(243,241,236,0.6)' }}
          >
            /ˈsin.trə.pi/ · noun
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 48,
              lineHeight: 1.02,
              fontWeight: 300,
              letterSpacing: '-0.045em',
            }}
          >
            Order, built
            <br />
            <span style={{ color: 'rgba(243,241,236,0.42)' }}>from chaos.</span>
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.5,
              color: 'rgba(243,241,236,0.72)',
              maxWidth: 300,
            }}
          >
            Training, nutrition and recovery, read as one living system.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PillButton icon="key" iconSize={20} lifted block href="/signup/">
            Create your profile
          </PillButton>
          <PillButton
            variant="glass"
            block
            onClick={() => {
              loadSeed()
              router.replace('/')
            }}
          >
            Explore with sample data
          </PillButton>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 12,
            color: 'rgba(243,241,236,0.58)',
          }}
        >
          <Icon name="lock" size={13} />
          Private by design. Your logs stay on your device.
        </div>
      </div>
    </AuthPage>
  )
}
