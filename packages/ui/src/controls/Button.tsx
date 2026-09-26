import type { CSSProperties, ReactNode } from 'react'
import { Icon, type IconName } from '../icons/Icon'
import { cx, UiLink } from '../link'
import styles from './Button.module.css'

type Variant = 'primary' | 'glass' | 'outline' | 'peach' | 'ember' | 'ghost'

type PillButtonProps = {
  children: ReactNode
  variant?: Variant
  /** Height in px. Boards use 58 (primary CTA), 54, 52, 44, 40. */
  height?: number
  fontSize?: number
  icon?: IconName
  iconSize?: number
  iconAfter?: boolean
  block?: boolean
  lifted?: boolean
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  style?: CSSProperties
  'aria-label'?: string
  'aria-pressed'?: boolean
}

export function PillButton({
  children,
  variant = 'primary',
  height = 58,
  fontSize,
  icon,
  iconSize = 18,
  iconAfter,
  block,
  lifted,
  href,
  onClick,
  type = 'button',
  disabled,
  className,
  style,
  ...aria
}: PillButtonProps) {
  const cls = cx(
    styles.pill,
    styles[variant],
    block && styles.block,
    lifted && styles.lifted,
    className,
  )
  const fs = fontSize ?? (height >= 54 ? 16 : height >= 44 ? 14 : 13.5)
  const st: CSSProperties = { height, fontSize: fs, ...style }
  const ic = icon ? <Icon name={icon} size={iconSize} stroke={1.9} /> : null
  const body = (
    <>
      {!iconAfter && ic}
      {children}
      {iconAfter && ic}
    </>
  )
  if (href && !disabled) {
    return (
      <UiLink href={href} className={cls} style={st} aria-label={aria['aria-label']}>
        {body}
      </UiLink>
    )
  }
  return (
    <button
      type={type}
      className={cls}
      style={st}
      onClick={onClick}
      disabled={disabled}
      aria-label={aria['aria-label']}
      aria-pressed={aria['aria-pressed']}
    >
      {body}
    </button>
  )
}

type IconButtonProps = {
  icon: IconName
  label: string
  size?: number
  iconSize?: number
  stroke?: number
  variant?: 'glass' | 'outline' | 'dark' | 'plain' | 'bone'
  href?: string
  onClick?: () => void
  className?: string
  style?: CSSProperties
  disabled?: boolean
  pressed?: boolean
}

const ICON_BG: Record<NonNullable<IconButtonProps['variant']>, CSSProperties> = {
  glass: {
    background: 'rgba(255,255,255,0.045)',
    border: '1px solid rgba(255,255,255,0.085)',
    backdropFilter: 'blur(22px) saturate(140%)',
    WebkitBackdropFilter: 'blur(22px) saturate(140%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 24px 48px -24px rgba(0,0,0,0.6)',
  },
  dark: {
    background: 'rgba(14,18,16,0.58)',
    border: '1px solid rgba(255,255,255,0.09)',
    backdropFilter: 'blur(24px) saturate(150%)',
    WebkitBackdropFilter: 'blur(24px) saturate(150%)',
  },
  outline: { background: 'transparent', border: '1px solid rgba(255,255,255,0.12)' },
  plain: { background: 'transparent', border: 0 },
  bone: { background: '#F3F1EC', color: '#0B0F0D', border: 0 },
}

/** 44 px circular icon button (the boards' back, close, options and header buttons). */
export function IconButton({
  icon,
  label,
  size = 44,
  iconSize = 20,
  stroke = 1.6,
  variant = 'glass',
  href,
  onClick,
  className,
  style,
  disabled,
  pressed,
}: IconButtonProps) {
  const st: CSSProperties = { width: size, height: size, ...ICON_BG[variant], ...style }
  const ic = <Icon name={icon} size={iconSize} stroke={stroke} />
  if (href) {
    return (
      <UiLink href={href} aria-label={label} className={cx(styles.icon, className)} style={st}>
        {ic}
      </UiLink>
    )
  }
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      className={cx(styles.icon, className)}
      style={st}
      onClick={onClick}
      disabled={disabled}
    >
      {ic}
    </button>
  )
}
