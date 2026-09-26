import { useMemo } from 'react'

// The dot-matrix version of the mark (Identity.dc.html "Particle", used for loading states).
// Points on a 4-unit grid inside the two mark halves, ember-soft on top and sage below.
function inTop(x: number, y: number) {
  // Top half: semicircle of radius 20 centred (50,34) above y=34, plus the parallelogram tail.
  if (y <= 34) return (x - 50) ** 2 + (y - 34) ** 2 <= 400
  if (y <= 48.4) {
    const t = (y - 34) / 14.4
    const left = 50 - t * 11
    const right = 50 + t * 9
    return (
      x >= left - 0.1 &&
      x <= right + 0.1 &&
      x >= 30 &&
      x <= 70 &&
      (x - 50) ** 2 + (y - 34) ** 2 <= 440
    )
  }
  return false
}

export function ParticleMark({
  size = 120,
  animated = true,
}: {
  size?: number
  animated?: boolean
}) {
  const dots = useMemo(() => {
    const out: { x: number; y: number; top: boolean }[] = []
    for (let y = 14; y <= 86; y += 4) {
      for (let x = 30; x <= 70; x += 4) {
        if (inTop(x, y)) out.push({ x, y, top: true })
        else if (inTop(100 - x, 100 - y)) out.push({ x, y, top: false })
      }
    }
    return out
  }, [])
  return (
    <svg aria-hidden="true" width={(size * 44) / 76} height={size} viewBox="28 12 44 76">
      {dots.map((d, i) => (
        <circle
          key={`${d.x}-${d.y}`}
          cx={d.x}
          cy={d.y}
          r={1.4}
          fill={d.top ? '#FF8A5C' : '#A9C3A0'}
          style={
            animated
              ? { animation: `sy-pulse 2.4s ease-in-out ${(i % 11) * 0.12}s infinite` }
              : undefined
          }
        />
      ))}
    </svg>
  )
}
