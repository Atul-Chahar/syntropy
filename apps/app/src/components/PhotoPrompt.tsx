'use client'

import { Icon, IconButton } from '@syntropy/ui'
import Link from 'next/link'
import { addDays, today } from '@/lib/dates'
import { PHOTO_RULES, photoDue, useProgressPhotos } from '@/lib/photos'
import { usePhotos } from '@/stores'

/**
 * Asks for a day-one photo, then a check-in photo every four weeks.
 * `rules` adds the how-to lines (the Body screen); "Not now" hides it for a week.
 */
export function PhotoPrompt({ rules = false }: { rules?: boolean }) {
  const photos = useProgressPhotos()
  const snoozedUntil = usePhotos((s) => s.snoozedUntil)
  const snooze = usePhotos((s) => s.snooze)
  const due = photoDue(photos, snoozedUntil)
  if (!due) return null
  const first = due.kind === 'first'

  return (
    <div
      className="sy-glass"
      style={{
        position: 'relative',
        borderRadius: 22,
        borderColor: 'rgba(255,199,176,0.3)',
        padding: '10px 4px 10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link
          href="/progress/photo/?pose=front"
          style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--sy-fab)',
              color: 'var(--sy-fab-ink)',
              flexShrink: 0,
            }}
          >
            <Icon name="camera" size={18} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>
              {first ? 'Take your day-one photo' : 'Time for a check-in photo'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--sy-text-66)' }}>
              {first
                ? 'Your starting point to compare against. No flex.'
                : `Day ${due.day}. Same pose as day one, no flex.`}
            </span>
          </span>
        </Link>
        <IconButton
          icon="close"
          label="Not now"
          iconSize={16}
          variant="plain"
          onClick={() => snooze(addDays(today(), 7))}
          style={{ color: 'var(--sy-text-55)', flexShrink: 0 }}
        />
      </div>
      {rules ? (
        <ul
          style={{
            listStyle: 'none',
            margin: '0 6px 2px 48px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          {PHOTO_RULES.map((r) => (
            <li
              key={r}
              style={{ display: 'flex', gap: 7, fontSize: 12.5, color: 'var(--sy-text-66)' }}
            >
              <Icon
                name="check"
                size={13}
                style={{ color: 'var(--sy-sage)', flexShrink: 0, marginTop: 2 }}
              />
              {r}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
