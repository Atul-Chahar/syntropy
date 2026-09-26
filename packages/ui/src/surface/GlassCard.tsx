import type { CSSProperties, ReactNode } from 'react'
import { cx, UiLink } from '../link'
import styles from './GlassCard.module.css'

type GlassCardProps = {
  children: ReactNode
  variant?: 'glass' | 'dark'
  radius?: number
  padding?: CSSProperties['padding']
  className?: string
  style?: CSSProperties
  as?: 'div' | 'section' | 'article' | 'li'
  href?: string
  onClick?: () => void
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** Frosted glass surface. Renders a link with `href`, a button with `onClick`. */
export function GlassCard({
  children,
  variant = 'glass',
  radius = 32,
  padding,
  className,
  style,
  as: Tag = 'div',
  href,
  onClick,
  ...aria
}: GlassCardProps) {
  const cls = cx(styles.card, styles[variant], (href || onClick) && styles.interactive, className)
  const st: CSSProperties = { borderRadius: radius, padding, ...style }
  if (href) {
    return (
      <UiLink href={href} className={cls} style={st} aria-label={aria['aria-label']}>
        {children}
      </UiLink>
    )
  }
  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        style={{ ...st, textAlign: 'left', width: '100%', font: 'inherit' }}
        onClick={onClick}
        {...aria}
      >
        {children}
      </button>
    )
  }
  return (
    <Tag className={cls} style={st} {...aria}>
      {children}
    </Tag>
  )
}
