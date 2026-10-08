'use client'

import { type CSSProperties, useEffect, useState } from 'react'
import { loadPhoto } from '@/platform/storage'
import { initials, useProfile } from '@/stores/profile'

/** Centre-crops an image to a square JPEG data URL of at most `size` px, for the avatar. */
export async function squareImage(src: string, size = 384): Promise<string> {
  const img = new Image()
  img.src = src
  await img.decode()
  const side = Math.min(img.width, img.height)
  const out = Math.min(size, side)
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  canvas
    .getContext('2d')
    ?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/** Round profile picture, falling back to the user's initials. */
export function Avatar({ size, style }: { size: number; style?: CSSProperties }) {
  const name = useProfile((s) => s.name)
  const avatarId = useProfile((s) => s.avatarId)
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    if (!avatarId) setSrc(null)
    else loadPhoto(avatarId).then((d) => live && setSrc(d))
    return () => {
      live = false
    }
  }, [avatarId])

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'linear-gradient(145deg, #2A332E, #171C19)',
        fontSize: Math.round(size * 0.32),
        fontWeight: 500,
        ...style,
      }}
    >
      {src ? (
        // biome-ignore lint/performance/noImgElement: static export, local data URL
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials(name)
      )}
    </span>
  )
}
