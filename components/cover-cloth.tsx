import type { ReactNode } from 'react'

// Cover cloth — generated, not photographed. A seed (a class, lesson or sermon
// id) hashes into four deterministic choices, so a class keeps its cloth forever
// and people learn to recognise it. Pure inline SVG: no network, no dependency,
// no filters, no animation, integer coordinates, and at most ~30 nodes per plate
// so a list of them stays cheap on a budget phone.
//
// The ground set is restricted to the indigo → blue-violet → violet → plum →
// aubergine arc plus one undyed stone, and the motif ink is a lighter step of
// its own ground. Brass and sage are deliberately absent: those hues mean
// "your place" and "the room" respectively, and a cloth in either would dissolve
// both meanings.

const GROUNDS = [
  { bg: '#283A63', ink: '#4E6596' },
  { bg: '#39386B', ink: '#615F9B' },
  { bg: '#4A3568', ink: '#74589A' },
  { bg: '#573453', ink: '#845079' },
  { bg: '#45273E', ink: '#6E4460' },
  { bg: '#4A4741', ink: '#706C63' },
] as const

const MOTIF_NAMES = ['arcs', 'comb', 'chevron', 'dot grid', 'diamond', 'wave', 'star', 'cross-band'] as const

const ROTATIONS = [0, 90, 180] as const

type Motif = (ink: string, rhythm: number) => ReactNode[]

const motifs: Record<(typeof MOTIF_NAMES)[number], Motif> = {
  arcs: (ink, rhythm) => Array.from({ length: rhythm }, (_, index) => (
    <circle key={index} cx="50" cy="50" r={8 + index * (34 / rhythm)} fill="none" stroke={ink} strokeWidth="2" />
  )),
  comb: (ink, rhythm) => [
    <rect key="spine" x="0" y="66" width="100" height="3" fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => {
      const x = Math.round((100 / (rhythm + 1)) * (index + 1))
      const height = 26 + (index % 3) * 6
      return <rect key={index} x={x} y={66 - height} width="3" height={height} fill={ink} />
    }),
  ],
  chevron: (ink, rhythm) => Array.from({ length: rhythm }, (_, index) => (
    <polyline key={index} points={`0,${18 + index * 8} 50,${26 + index * 8} 100,${18 + index * 8}`} fill="none" stroke={ink} strokeWidth="2" />
  )),
  'dot grid': (ink, rhythm) => {
    const dots: ReactNode[] = []
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < rhythm; column += 1) {
        dots.push(<circle key={`${row}-${column}`} cx={Math.round((100 / (rhythm + 1)) * (column + 1))} cy={22 + row * 28} r="2.5" fill={ink} />)
      }
    }
    return dots
  },
  diamond: (ink, rhythm) => Array.from({ length: rhythm }, (_, index) => {
    const x = Math.round((100 / (rhythm + 1)) * (index + 1))
    const y = 50 + (index % 2 === 0 ? 0 : 12)
    return <polygon key={index} points={`${x},${y - 11} ${x + 11},${y} ${x},${y + 11} ${x - 11},${y}`} fill="none" stroke={ink} strokeWidth="2" />
  }),
  wave: (ink, rhythm) => Array.from({ length: rhythm }, (_, index) => (
    <path key={index} d={`M0 ${14 + index * 8} Q 25 ${6 + index * 8}, 50 ${14 + index * 8} T 100 ${14 + index * 8}`} fill="none" stroke={ink} strokeWidth="2" />
  )),
  star: (ink) => [
    <polygon
      key="star"
      points="50,14 56,38 80,38 61,53 68,77 50,62 32,77 39,53 20,38 44,38"
      fill="none"
      stroke={ink}
      strokeWidth="2"
    />,
    <circle key="ring" cx="50" cy="50" r="40" fill="none" stroke={ink} strokeWidth="1" />,
  ],
  'cross-band': (ink, rhythm) => [
    <rect key="left" x="0" y="0" width="14" height="100" fill={ink} />,
    <rect key="right" x="86" y="0" width="14" height="100" fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => (
      <rect key={index} x={26 + index * (48 / rhythm)} y="46" width="3" height="8" fill={ink} />
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

export function CoverCloth({
  seed,
  ground,
  motif,
  className,
}: {
  seed: string
  // Preview-only overrides for /dev/cloth. Production callers pass a seed only.
  ground?: number
  motif?: number
  className?: string
}) {
  const value = hash(seed)
  const groundIndex = ground ?? value % GROUNDS.length
  const motifIndex = motif ?? (value >>> 3) % MOTIF_NAMES.length
  const rhythm = 3 + ((value >>> 7) % 7)
  const rotation = ROTATIONS[(value >>> 11) % ROTATIONS.length]
  const palette = GROUNDS[groundIndex % GROUNDS.length]

  return (
    <svg
      className={`cloth${className ? ` ${className}` : ''}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="100" fill={palette.bg} />
      <g transform={`rotate(${rotation} 50 50)`}>{motifs[MOTIF_NAMES[motifIndex % MOTIF_NAMES.length]](palette.ink, rhythm)}</g>
    </svg>
  )
}

export { GROUNDS as CLOTH_GROUNDS, MOTIF_NAMES as CLOTH_MOTIFS }
