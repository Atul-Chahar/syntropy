import type { CSSProperties, ReactNode } from 'react'

// Every 24 x 24 icon used on the Syntropy boards, copied path for path from design/screens.
const PATHS = {
  sparkle: (
    <path d="M12 3c.7 5 3.9 8.3 9 9-5.1.7-8.3 3.9-9 9-.7-5.1-3.9-8.3-9-9 5.1-.7 8.3-4 9-9z" />
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  scan: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />
      <path d="M14 3.5V8h4M9 12h6M9 15.5h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10h16M9 3.5v4M15 3.5v4" />
    </>
  ),
  waveform: <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />,
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </>
  ),
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5v4h4" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18" cy="12" r="1.2" />
    </>
  ),
  loop: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" />,
  play: <path d="M8 5.5v13l10-6.5z" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  drop: <path d="M12 3.5s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" />,
  home: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="3.25" />
    </>
  ),
  dumbbell: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />,
  bowl: (
    <>
      <path d="M4 11.5h16a8 8 0 0 1-16 0z" />
      <path d="M9 3.5c-1 1.5 1 2.5 0 4.5M13.5 3.5c-1 1.5 1 2.5 0 4.5" />
    </>
  ),
  stats: <path d="M6 20V11M12 20V4M18 20v-7" />,
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  arrowUpRight: <path d="M7 17L17 7M8 7h9v9" />,
  flame: (
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.6.2 1.6 1 2.6 2.3 2.9C11 8.6 11 6 12 3z" />
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z" />
      <path d="M5 19l7-7" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 9.5V13l2.5 1.5M10 3h4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2" />
    </>
  ),
  pulse: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M7 17c1-2 1.4-4 1.4-6a3.6 3.6 0 0 1 7.2 0c0 2.6-.4 4.8-1.3 7" />
      <path d="M12 11c0 3-.6 5.6-1.8 8" />
      <path d="M4.5 13.5c.4-1 .5-1.8.5-3a7 7 0 0 1 13.8-1.6" />
      <path d="M19.2 12c0 2.4-.3 4.3-.9 6" />
      <path d="M6.5 5.2A8.8 8.8 0 0 1 17.5 5" />
    </>
  ),
  list: <path d="M4 6h16M4 12h16M4 18h10" />,
  camera: (
    <>
      <path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  flash: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />,
  gallery: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M20.5 16l-5-5-8 8" />
    </>
  ),
  pencil: <path d="M4 20h4L19 9l-4-4L4 16v4z" />,
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2" />
    </>
  ),
  // Added for pages the boards do not cover, drawn in the same 1.6 stroke style.
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7M10 11v5M14 11v5" />,
  share: <path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />,
  download: <path d="M12 4v11M8 11l4 4 4-4M5 19h14" />,
  scale: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M9 10a3 3 0 0 1 6 0M12 10l1.4-1.8" />
    </>
  ),
  trophy: (
    <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7" />
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

type IconProps = {
  name: IconName
  size?: number
  stroke?: number
  className?: string
  style?: CSSProperties
  title?: string
}

export function Icon({ name, size = 20, stroke = 1.6, className, style, title }: IconProps) {
  const filled = name === 'pause'
  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  )
}

export const ICON_NAMES = Object.keys(PATHS) as IconName[]
