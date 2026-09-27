import { BrandMark, Icon } from '@syntropy/ui'

const glass: React.CSSProperties = {
  background: 'rgba(18,22,20,0.82)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 26,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
}
const bar = (v: number, c: string) => (
  <span
    style={{
      display: 'block',
      height: 5,
      borderRadius: 3,
      background: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}
  >
    <span style={{ display: 'block', height: 5, width: `${v}%`, borderRadius: 3, background: c }} />
  </span>
)

/** Android home screen with the four Syntropy widgets (mirrors the native RemoteViews layouts). */
export function WidgetsPhone({ scale = 0.8 }: { scale?: number }) {
  const w = 414 * scale
  return (
    <div
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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 54 * scale,
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse 90% 60% at 100% 0%, rgba(255,107,61,0.55), rgba(255,107,61,0) 70%), radial-gradient(ellipse 80% 60% at 0% 100%, rgba(137,170,124,0.55), rgba(137,170,124,0) 70%), #0E1311',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            width: 390,
            height: 844,
            position: 'absolute',
            left: 0,
            top: 0,
            padding: '64px 18px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              fontSize: 64,
              fontWeight: 200,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            9:41
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: 14,
              color: 'rgba(243,241,236,0.7)',
              marginBottom: 14,
            }}
          >
            Thursday, 24 September
          </div>
          <div style={{ ...glass, display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
            <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
              <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
                <circle
                  cx="52"
                  cy="52"
                  r="44"
                  fill="none"
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth="8"
                />
                <circle
                  cx="52"
                  cy="52"
                  r="44"
                  fill="none"
                  stroke="#FFC7B0"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44 * 0.96} 999`}
                  transform="rotate(-90 52 52)"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="sy-dot" style={{ fontSize: 26 }}>
                  80
                </span>
                <span style={{ fontSize: 10, color: 'rgba(243,241,236,0.6)' }}>kcal left</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span
                className="sy-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: 'rgba(243,241,236,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <BrandMark size={12} /> TODAY
              </span>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>Protein</span>
                <span className="sy-mono" style={{ color: 'rgba(243,241,236,0.6)' }}>
                  115 / 150 g
                </span>
              </span>
              {bar(77, '#A9C3A0')}
              <span
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                <span>Water</span>
                <span className="sy-mono" style={{ color: 'rgba(243,241,236,0.6)' }}>
                  2.25 / 3.5 L
                </span>
              </span>
              {bar(64, '#9CC7E0')}
              <span style={{ fontSize: 11, color: '#FFB79A', marginTop: 4 }}>Today · Pull Day</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div
              style={{
                borderRadius: 26,
                padding: 14,
                height: 160,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                background:
                  'radial-gradient(circle at 30% 20%, #FFC2A3 0%, #FF7A4A 50%, #E0501F 100%)',
                color: '#1A0E08',
              }}
            >
              <Icon name="scan" size={30} stroke={1.8} />
              <span style={{ fontSize: 17, fontWeight: 700, marginTop: 10 }}>Scan plate</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>Thali, tiffin, anything</span>
            </div>
            <div
              style={{
                ...glass,
                padding: 14,
                height: 160,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                className="sy-mono"
                style={{ fontSize: 10, letterSpacing: '0.08em', color: 'rgba(243,241,236,0.55)' }}
              >
                WATER
              </span>
              <span className="sy-dot" style={{ fontSize: 30, color: '#D3E7F3', marginTop: 6 }}>
                2.25
              </span>
              <span style={{ fontSize: 11, color: 'rgba(243,241,236,0.6)' }}>of 3.5 L</span>
              <span
                style={{
                  marginTop: 'auto',
                  height: 36,
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(156,199,224,0.2)',
                  border: '1px solid rgba(156,199,224,0.4)',
                  color: '#D3E7F3',
                  fontSize: 13,
                }}
              >
                + 250 ml
              </span>
            </div>
          </div>
          <div style={{ ...glass, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span
                className="sy-mono"
                style={{ fontSize: 10, letterSpacing: '0.08em', color: 'rgba(243,241,236,0.55)' }}
              >
                QUICK ADD
              </span>
              <span style={{ fontSize: 11, color: '#FFB79A' }}>Pull · resume</span>
            </span>
            <span style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                ['Roti', 105],
                ['Dahi', 95],
                ['Chai', 80],
                ['Dal', 170],
              ].map(([n, k]) => (
                <span
                  key={n}
                  style={{
                    height: 52,
                    borderRadius: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: '#FFD6C4',
                    background: 'rgba(255,199,176,0.08)',
                    border: '1px solid rgba(255,199,176,0.28)',
                  }}
                >
                  + {n}
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{k}</span>
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
