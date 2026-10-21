import type { ReactNode } from 'react'

// Cover cloth — generated, not photographed. A seed (a class, lesson or sermon
// id) hashes into four deterministic choices, so a class keeps its cloth forever
// and people learn to recognise it. Pure inline SVG: no network, no dependency,
// no filters, no animation, integer coordinates, and at most ~30 nodes per plate
// so a list of them stays cheap on a budget phone.
//
// Four variants share one seed, so a class's plate and its small marks agree:
//   plate  — 16:9, 4:5 and letterbox art
//   strip  — the 6px lesson band and the 3px library-row edge, in their own
//            horizontal viewBox (a 100-square plate squeezed into 3px reads as
//            noise, so the strip art is drawn for the strip)
//   spine  — the same strip art turned upright, 6px wide
//   thumb  — a 44px row thumb: the plate simplified to fewer, heavier marks
//
// The ground set runs the indigo → blue-violet → violet → plum arc and ends on
// deep teal, spanning roughly 16–42% lightness so no two plates read alike at
// 3px. Brass and sage are deliberately absent: those hues mean "your place" and
// "the room", and a cloth in either would dissolve both meanings. The motif ink
// is a lighter step of its own ground, paired by hand so nothing is mixed at
// use time.

const GROUNDS = [
  { bg: '#1B2438', ink: '#3A4C70' }, // deep indigo
  { bg: '#283A63', ink: '#4E6596' }, // indigo
  { bg: '#3A3A78', ink: '#66639F' }, // blue-violet
  { bg: '#5B4691', ink: '#8A74BE' }, // violet, the lightest
  { bg: '#6B3C5E', ink: '#96617F' }, // plum
  { bg: '#173F45', ink: '#2F6E6C' }, // deep teal
] as const

const MOTIF_NAMES = ['arcs', 'comb', 'chevron', 'dot grid', 'diamond', 'wave', 'scallop', 'cross-band'] as const

const ROTATIONS = [0, 90, 180] as const

type MotifName = (typeof MOTIF_NAMES)[number]
type Motif = (ink: string, rhythm: number, weight: number) => ReactNode[]

// Plate motifs — 100 × 100. `weight` is the stroke width: 2 on a plate, heavier
// on a 44px thumb, where a 2px line in a 100-unit box vanishes.
const plateMotifs: Record<MotifName, Motif> = {
  arcs: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => (
    <circle key={index} cx="50" cy="50" r={8 + index * (34 / rhythm)} fill="none" stroke={ink} strokeWidth={weight} />
  )),
  comb: (ink, rhythm, weight) => [
    <rect key="spine" x="0" y="66" width="100" height={weight} fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => {
      const x = Math.round((100 / (rhythm + 1)) * (index + 1))
      const height = 26 + (index % 3) * 6
      return <rect key={index} x={x} y={66 - height} width={weight} height={height} fill={ink} />
    }),
  ],
  chevron: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => (
    <polyline key={index} points={`0,${18 + index * 8} 50,${26 + index * 8} 100,${18 + index * 8}`} fill="none" stroke={ink} strokeWidth={weight} />
  )),
  'dot grid': (ink, rhythm, weight) => {
    const dots: ReactNode[] = []
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < rhythm; column += 1) {
        dots.push(
          <circle
            key={`${row}-${column}`}
            cx={Math.round((100 / (rhythm + 1)) * (column + 1))}
            cy={22 + row * 28}
            r={weight * 1.25}
            fill={ink}
          />,
        )
      }
    }
    return dots
  },
  diamond: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => {
    const x = Math.round((100 / (rhythm + 1)) * (index + 1))
    const y = 50 + (index % 2 === 0 ? 0 : 12)
    return <polygon key={index} points={`${x},${y - 11} ${x + 11},${y} ${x},${y + 11} ${x - 11},${y}`} fill="none" stroke={ink} strokeWidth={weight} />
  }),
  wave: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => (
    <path
      key={index}
      d={`M0 ${14 + index * 8} Q 25 ${6 + index * 8}, 50 ${14 + index * 8} T 100 ${14 + index * 8}`}
      fill="none"
      stroke={ink}
      strokeWidth={weight}
    />
  )),
  // Scallop replaces the old star: an even fish-scale repeat, so no plate can
  // read as a heraldic crest or a flag. Three offset rows, node count bounded by
  // rhythm (3 × (rhythm + 1) = 12–30 paths).
  scallop: (ink, rhythm, weight) => {
    const step = 100 / (rhythm + 1)
    const radius = step / 2
    const nodes: ReactNode[] = []
    ;[22, 56, 90].forEach((y, row) => {
      const offset = row % 2 === 0 ? 0 : -radius
      for (let index = 0; index <= rhythm; index += 1) {
        const x = offset + index * step
        nodes.push(
          <path
            key={`${row}-${index}`}
            d={`M${x} ${y} A${radius} ${radius} 0 0 1 ${x + step} ${y}`}
            fill="none"
            stroke={ink}
            strokeWidth={weight}
          />,
        )
      }
    })
    return nodes
  },
  'cross-band': (ink, rhythm, weight) => [
    <rect key="left" x="0" y="0" width="14" height="100" fill={ink} />,
    <rect key="right" x="86" y="0" width="14" height="100" fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => (
      <rect key={index} x={26 + index * (48 / rhythm)} y="46" width={weight} height="8" fill={ink} />
    )),
  ],
}

// Strip motifs — 100 × 8. Drawn for the size they are read at: filled shapes
// rather than hairlines, because a 1px stroke in an 8-unit-tall box disappears
// once the strip is 3px on screen.
const stripMotifs: Record<MotifName, Motif> = {
  arcs: (ink, rhythm) => {
    const step = 100 / (rhythm + 1)
    return Array.from({ length: rhythm + 1 }, (_, index) => {
      const x = index * step
      return <path key={index} d={`M${x} 8 L${x + step / 2} 1 L${x + step} 8 Z`} fill={ink} />
    })
  },
  comb: (ink, rhythm) => {
    const step = 100 / (rhythm + 1)
    return Array.from({ length: rhythm + 1 }, (_, index) => (
      <rect key={index} x={index * step + step * 0.25} y={index % 2 === 0 ? 0 : 3} width={step * 0.5} height={8} fill={ink} />
    ))
  },
  chevron: (ink, rhythm) => {
    const step = 100 / rhythm
    const points: string[] = []
    for (let index = 0; index <= rhythm; index += 1) {
      points.push(`${index * step},${index % 2 === 0 ? 7 : 1}`)
    }
    return [
      <polyline key="line" points={points.join(' ')} fill="none" stroke={ink} strokeWidth="2.6" />,
    ]
  },
  'dot grid': (ink, rhythm) => {
    const step = 100 / (rhythm + 1)
    return Array.from({ length: rhythm + 1 }, (_, index) => (
      <circle key={index} cx={index * step + step / 2} cy="4" r="1.9" fill={ink} />
    ))
  },
  diamond: (ink, rhythm) => {
    const step = 100 / (rhythm + 1)
    const half = step / 2
    return Array.from({ length: rhythm + 1 }, (_, index) => {
      const x = index * step + half
      return <polygon key={index} points={`${x},0.5 ${x + half * 0.8},4 ${x},7.5 ${x - half * 0.8},4`} fill={ink} />
    })
  },
  wave: (ink, rhythm) => {
    const step = 100 / rhythm
    return Array.from({ length: rhythm * 2 }, (_, index) => (
      <rect key={index} x={index * step * 0.5} y={index % 2 === 0 ? 1.4 : 4.6} width={step * 0.34} height={2} fill={ink} />
    ))
  },
  scallop: (ink, rhythm) => {
    const step = 100 / (rhythm + 1)
    const radius = step / 2
    return Array.from({ length: rhythm + 1 }, (_, index) => {
      const x = index * step
      return <path key={index} d={`M${x} 8 A${radius} ${radius} 0 0 1 ${x + step} 8 Z`} fill={ink} />
    })
  },
  'cross-band': (ink, rhythm) => [
    <rect key="left" x="0" y="0" width="12" height="8" fill={ink} />,
    <rect key="right" x="88" y="0" width="12" height="8" fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => (
      <rect key={index} x={22 + index * (56 / rhythm)} y="3" width="6" height="2" fill={ink} />
    )),
  ],
}

function hash(seed: string) {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

export type ClothVariant = 'plate' | 'strip' | 'spine' | 'thumb'

export function CoverCloth({
  seed,
  ground,
  motif,
  variant = 'plate',
  className,
}: {
  seed: string
  // Preview-only overrides for /dev/cloth. Production callers pass a seed only.
  ground?: number
  motif?: number
  variant?: ClothVariant
  className?: string
}) {
  const value = hash(seed)
  const groundIndex = ground ?? value % GROUNDS.length
  const motifIndex = motif ?? (value >>> 3) % MOTIF_NAMES.length
  const rhythm = 3 + ((value >>> 7) % 7)
  const rotation = ROTATIONS[(value >>> 11) % ROTATIONS.length]
  const palette = GROUNDS[groundIndex % GROUNDS.length]
  const name = MOTIF_NAMES[motifIndex % MOTIF_NAMES.length]

  const isStrip = variant === 'strip'
  const isSpine = variant === 'spine'
  const viewBox = isSpine ? '0 0 8 100' : isStrip ? '0 0 100 8' : '0 0 100 100'
  // The strips stretch to their exact box (a 200 × 3 edge has no ratio to keep);
  // plates and thumbs crop from the square.
  const preserve = isStrip || isSpine ? 'none' : 'xMidYMid slice'

  let content: ReactNode[]
  if (isStrip || isSpine) {
    // A spine reads along its length, so it carries fewer, longer marks.
    const stripRhythm = isSpine ? Math.max(3, rhythm - 2) : rhythm
    content = stripMotifs[name](palette.ink, stripRhythm, 2.4)
  } else {
    const thumb = variant === 'thumb'
    content = plateMotifs[name](palette.ink, thumb ? Math.min(rhythm, 4) : rhythm, thumb ? 5 : 2)
  }

  return (
    <svg
      className={`cloth${className ? ` ${className}` : ''}`}
      viewBox={viewBox}
      preserveAspectRatio={preserve}
      aria-hidden="true"
      focusable="false"
    >
      <rect width={isSpine ? 8 : 100} height={isStrip ? 8 : 100} fill={palette.bg} />
      <g transform={isSpine ? 'translate(8 0) rotate(90)' : isStrip ? undefined : `rotate(${rotation} 50 50)`}>
        {content}
      </g>
    </svg>
  )
}

export { GROUNDS as CLOTH_GROUNDS, MOTIF_NAMES as CLOTH_MOTIFS }
