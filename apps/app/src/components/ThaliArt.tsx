import type { CSSProperties } from 'react'

// The CSS-only steel thali from Scan.dc.html and Meal.dc.html (310 x 310), used as a stand-in
// when there is no photo: two rotis, rice, dal, palak paneer and dahi.
const rotiDots: [number, number, number][] = [
  [28, 30, 9],
  [60, 22, 7],
  [44, 58, 10],
  [74, 60, 6],
  [22, 66, 7],
  [66, 84, 8],
]
const grains: [number, number][] = [
  [20, 18],
  [44, 12],
  [60, 26],
  [32, 34],
  [70, 16],
  [52, 40],
  [14, 30],
]
const paneer: [number, number][] = [
  [18, 20],
  [38, 14],
  [28, 38],
  [48, 34],
  [14, 44],
]
const abs = (s: CSSProperties): CSSProperties => ({ position: 'absolute', ...s })
const katori = (
  left: number,
  top: number,
  size: number,
  inner: string,
  children?: React.ReactNode,
) => (
  <div
    style={abs({
      left,
      top,
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #F4F6F7 0%, #C3C8CC 45%, #8C9296 100%)',
      boxShadow: '0 8px 14px rgba(0,0,0,0.35)',
    })}
  >
    <div
      style={abs({ left: 6, top: 6, right: 6, bottom: 6, borderRadius: '50%', background: inner })}
    >
      {children}
    </div>
  </div>
)

export function ThaliArt({ scale = 1, blur = 1.5 }: { scale?: number; blur?: number }) {
  const roti = (left: number, top: number, bg: string, rot = 0) => (
    <div
      style={abs({
        left,
        top,
        width: 110,
        height: 110,
        borderRadius: '50%',
        background: bg,
        transform: `rotate(${rot}deg)`,
      })}
    >
      {rotiDots.map(([l, t, s]) => (
        <div
          key={`${l}-${t}`}
          style={abs({
            left: l,
            top: t,
            width: s,
            height: s,
            borderRadius: '50%',
            background: 'rgba(120,70,25,0.55)',
          })}
        />
      ))}
    </div>
  )
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: 310,
        height: 310,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      }}
    >
      <div
        style={abs({
          left: 0,
          top: 0,
          width: 310,
          height: 310,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 40% 32%, #F2F4F5 0%, #C9CED2 40%, #9EA4A8 62%, #D7DBDE 72%, #7E8488 100%)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        })}
      />
      <div style={abs({ left: 0, top: 0, width: 310, height: 310, filter: `blur(${blur}px)` })}>
        {roti(
          40,
          145,
          'radial-gradient(circle at 40% 35%, #E9C07E 0%, #D39B52 55%, #A96F2C 100%)',
          -12,
        )}
        {roti(52, 130, 'radial-gradient(circle at 40% 35%, #EDC88A 0%, #D8A35C 55%, #B07733 100%)')}
        <div
          style={abs({
            left: 150,
            top: 188,
            width: 96,
            height: 62,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 38%, #FFFFFF 0%, #F1EBDD 50%, #D6CDB9 100%)',
          })}
        >
          {grains.map(([l, t]) => (
            <div
              key={`${l}-${t}`}
              style={abs({
                left: l,
                top: t,
                width: 3,
                height: 2,
                borderRadius: 1,
                background: '#6B4A22',
              })}
            />
          ))}
        </div>
        {katori(
          51,
          44,
          88,
          'radial-gradient(circle at 40% 35%, #F2BE55 0%, #DE9A2C 55%, #B8741A 100%)',
        )}
        {katori(
          151,
          34,
          88,
          'radial-gradient(circle at 40% 35%, #7E9A3C 0%, #5A7628 55%, #3E561A 100%)',
          paneer.map(([l, t]) => (
            <div
              key={`${l}-${t}`}
              style={abs({
                left: l,
                top: t,
                width: 11,
                height: 11,
                borderRadius: 3,
                background: '#F6F1E4',
              })}
            />
          )),
        )}
        {katori(
          212,
          120,
          76,
          'radial-gradient(circle at 40% 35%, #FFFFFF 0%, #F4F1E8 60%, #DCD6C8 100%)',
        )}
      </div>
    </div>
  )
}

/** 84 px rounded thumbnail: the meal photo, or the thali art. */
export function MealThumb({ src, size = 84 }: { src?: string | null; size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: 24,
        overflow: 'hidden',
        flexShrink: 0,
        background: '#2A221B',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {src ? (
        // biome-ignore lint/performance/noImgElement: static export, local data URL
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', left: -14 * (size / 84), top: -14 * (size / 84) }}>
          <ThaliArt scale={0.36 * (size / 84)} />
        </div>
      )}
    </div>
  )
}
