import type { ReactNode } from 'react'

/** Fixed bottom action area with the void fade behind it (Goal, Meal, QuickAdd). */
export function BottomBar({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        padding: `28px 20px calc(30px + var(--sy-safe-bottom))`,
        background:
          'linear-gradient(180deg, rgba(11,15,13,0) 0%, rgba(11,15,13,0.9) 40%, rgba(11,15,13,0.98) 100%)',
      }}
    >
      <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', gap }}>{children}</div>
    </div>
  )
}

/** Screen header: kicker, title, right slot (the tab-screen header on every board). */
export function Header({
  kicker,
  title,
  right,
  titleSize = 30,
  align = 'flex-end',
}: {
  kicker: ReactNode
  title: ReactNode
  right?: ReactNode
  titleSize?: number
  align?: 'flex-end' | 'center'
}) {
  return (
    <header
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: align, gap: 12 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div
          className="sy-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'rgba(243,241,236,0.55)',
            textTransform: 'uppercase',
          }}
        >
          {kicker}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: titleSize,
            fontWeight: 300,
            letterSpacing: '-0.045em',
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
      </div>
      {right ? <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{right}</div> : null}
    </header>
  )
}

/** Centred modal header: 44 px round button, 17 px title, right control. */
export function ModalHeader({
  left,
  title,
  sub,
  right,
}: {
  left: ReactNode
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
}) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '44px minmax(0,1fr) 44px',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {left}
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </span>
        {sub ? (
          <span
            className="sy-mono"
            style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(243,241,236,0.55)' }}
          >
            {sub}
          </span>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {right ?? <span style={{ width: 44 }} />}
      </div>
    </header>
  )
}
