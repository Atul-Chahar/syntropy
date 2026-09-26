import { useId } from 'react'

type BrandMarkProps = {
  /** Rendered height in px. Width follows the 44:76 mark ratio. */
  size?: number
  className?: string
}

/** The Syntropy mark: two identical halves, ember on top (training), sage below (nutrition). */
export function BrandMark({ size = 30, className }: BrandMarkProps) {
  const id = useId()
  const top = `${id}-top`
  const bottom = `${id}-bottom`
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={(size * 44) / 76}
      height={size}
      viewBox="28 12 44 76"
    >
      <defs>
        <linearGradient id={top} x1="0" y1="14" x2="0" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFC2A3" />
          <stop offset="1" stopColor="#FF6B3D" />
        </linearGradient>
        <linearGradient id={bottom} x1="0" y1="50" x2="0" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C9DCBF" />
          <stop offset="1" stopColor="#7E9F74" />
        </linearGradient>
      </defs>
      <path d="M30 34A20 20 0 0 1 70 34L50 34L59 48.4L39 48.4Z" fill={`url(#${top})`} />
      <path d="M70 66A20 20 0 0 1 30 66L50 66L41 51.6L61 51.6Z" fill={`url(#${bottom})`} />
    </svg>
  )
}
