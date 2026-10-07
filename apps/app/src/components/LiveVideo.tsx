'use client'

import { type CSSProperties, type Ref, useState } from 'react'

// A transparent 1x1 GIF. Without a poster, Android's WebView paints its own grey
// "play" placeholder until the camera's first frame arrives.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Live camera preview. Stays invisible until the first frame is playing, then fades in,
 * with a calm "starting camera" note underneath so there is never a grey box or a flash.
 */
export function LiveVideo({
  ref,
  visible = true,
  mirror = false,
  label = 'Camera preview',
  style,
}: {
  ref: Ref<HTMLVideoElement>
  /** False hides the preview (a still photo or result is showing). */
  visible?: boolean
  mirror?: boolean
  label?: string
  style?: CSSProperties
}) {
  const [ready, setReady] = useState(false)
  return (
    <>
      {visible && !ready ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            className="sy-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: '0.12em',
              color: 'rgba(243,241,236,0.5)',
              animation: 'sy-pulse 1.6s ease-in-out infinite',
            }}
          >
            STARTING CAMERA
          </span>
        </div>
      ) : null}
      <video
        ref={ref}
        poster={BLANK}
        playsInline
        muted
        autoPlay
        disablePictureInPicture
        controls={false}
        aria-label={label}
        onPlaying={(e) => setReady(e.currentTarget.videoWidth > 0)}
        onLoadedData={(e) => e.currentTarget.videoWidth > 0 && setReady(true)}
        onEmptied={() => setReady(false)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          background: 'transparent',
          transform: mirror ? 'scaleX(-1)' : undefined,
          opacity: visible && ready ? 1 : 0,
          transition: 'opacity 320ms var(--sy-ease)',
          ...style,
        }}
      />
    </>
  )
}
