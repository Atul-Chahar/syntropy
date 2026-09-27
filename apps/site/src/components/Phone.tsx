/* eslint-disable @next/next/no-img-element */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** A phone frame (Landing.dc.html: 414 x 868, radius 66) around a real app screenshot. */
export function Phone({
  src,
  alt,
  scale = 0.8,
  className,
}: {
  src: string
  alt: string
  scale?: number
  className?: string
}) {
  const w = 414 * scale
  return (
    <div
      className={className}
      style={{
        width: w,
        height: 868 * scale,
        padding: 12 * scale,
        borderRadius: 66 * scale,
        background: 'linear-gradient(160deg, #3A3E3C, #121413 60%, #0A0B0B)',
        boxShadow:
          '0 60px 120px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px #2A2D2B',
        flexShrink: 0,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: static export */}
      <img
        src={`${BASE}/screens/${src}.png`}
        alt={alt}
        width={390}
        height={844}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 54 * scale,
          display: 'block',
          objectFit: 'cover',
          objectPosition: 'top',
        }}
      />
    </div>
  )
}
