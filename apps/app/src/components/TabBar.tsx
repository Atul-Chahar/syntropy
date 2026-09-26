'use client'

import { Icon, type IconName } from '@syntropy/ui'
import { motion } from 'motion/react'
import Link from 'next/link'
import { tap } from '@/platform/haptics'

export type TabKey = 'home' | 'train' | 'food' | 'stats'

const TABS: { key: TabKey | 'scan'; href: string; label: string; icon: IconName }[] = [
  { key: 'home', href: '/', label: 'Home', icon: 'home' },
  { key: 'train', href: '/plan/', label: 'Train', icon: 'dumbbell' },
  { key: 'scan', href: '/scan/', label: 'Scan a meal', icon: 'scan' },
  { key: 'food', href: '/food/', label: 'Food log', icon: 'bowl' },
  { key: 'stats', href: '/stats/', label: 'Stats', icon: 'stats' },
]

/** Floating dark-glass pill with the raised ember Scan button (every tab board). */
export function TabBar({ active }: { active: TabKey }) {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed',
        left: 20,
        right: 20,
        bottom: 'calc(26px + var(--sy-safe-bottom))',
        height: 70,
        maxWidth: 440,
        margin: '0 auto',
        borderRadius: 35,
        padding: '0 9px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40,
        background: 'rgba(14,18,16,0.58)',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 20px 40px rgba(0,0,0,0.45)',
      }}
    >
      {TABS.map((t) => {
        if (t.key === 'scan') {
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-label={t.label}
              onClick={tap}
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1A0E08',
                background:
                  'radial-gradient(circle at 32% 25%, #FFC2A3 0%, #FF7A4A 45%, #E0501F 100%)',
                boxShadow: '0 10px 28px rgba(255,107,61,0.45), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <Icon name="scan" size={24} stroke={1.8} />
            </Link>
          )
        }
        const on = t.key === active
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-label={t.label}
            aria-current={on ? 'page' : undefined}
            onClick={tap}
            style={{
              position: 'relative',
              width: 52,
              height: 52,
              borderRadius: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: on ? '#0B0F0D' : 'rgba(243,241,236,0.66)',
            }}
          >
            {on ? (
              <motion.span
                layoutId="tab-thumb"
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                style={{ position: 'absolute', inset: 0, borderRadius: 26, background: '#F3F1EC' }}
              />
            ) : null}
            <Icon
              name={t.icon}
              size={22}
              stroke={on ? 1.8 : 1.6}
              style={{ position: 'relative' }}
            />
          </Link>
        )
      })}
    </nav>
  )
}

export function tabFor(path: string): TabKey | null {
  const p = path.replace(/\/+$/, '') || '/'
  if (p === '/') return 'home'
  if (['/plan', '/library'].includes(p)) return 'train'
  if (p === '/food') return 'food'
  if (['/stats', '/recovery', '/progress'].includes(p)) return 'stats'
  return null
}
