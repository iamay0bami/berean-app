import type { ReactNode } from 'react'

const GROUNDS = [
  { bg: 'var(--cloth-ground-1)', ink: 'var(--cloth-ink-1)' },
  { bg: 'var(--cloth-ground-2)', ink: 'var(--cloth-ink-2)' },
  { bg: 'var(--cloth-ground-3)', ink: 'var(--cloth-ink-3)' },
  { bg: 'var(--cloth-ground-4)', ink: 'var(--cloth-ink-4)' },
  { bg: 'var(--cloth-ground-5)', ink: 'var(--cloth-ink-5)' },
  { bg: 'var(--cloth-ground-6)', ink: 'var(--cloth-ink-6)' },
] as const

const MOTIF_NAMES = ['arcs', 'comb', 'chevron', 'dot grid', 'diamond', 'wave', 'scallop', 'cross-band'] as const
const ROTATIONS = [0, 90, 180] as const

export type ClothVariant = 'cover' | 'plate' | 'strip' | 'spine' | 'thumb'
export type ClothRotation = (typeof ROTATIONS)[number]
type MotifName = (typeof MOTIF_NAMES)[number]
type Motif = (ink: string, rhythm: number, weight: number) => ReactNode[]

const ALLOWED_ROTATIONS: Record<MotifName, readonly ClothRotation[]> = {
  arcs: ROTATIONS,
  comb: [0, 180],
  chevron: ROTATIONS,
  'dot grid': ROTATIONS,
  diamond: ROTATIONS,
  wave: ROTATIONS,
  scallop: ROTATIONS,
  'cross-band': [0, 180],
}

function whole(value: number) {
  return Math.round(value)
}

// Crop-defining plate marks stay inside x=18–82 so both 3:4 covers and 3:1 heroes retain them.
const plateMotifs: Record<MotifName, Motif> = {
  arcs: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => (
    <circle key={index} cx="50" cy="50" r={whole(8 + index * (34 / rhythm))} fill="none" stroke={ink} strokeWidth={weight} />
  )),
  comb: (ink, rhythm, weight) => [
    <rect key="spine" x="0" y={whole(50 - weight / 2)} width="100" height={whole(weight)} fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => {
      const x = whole((100 / (rhythm + 1)) * (index + 1))
      return <rect key={index} x={x} y="24" width={whole(weight)} height="52" fill={ink} />
    }),
  ],
  chevron: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => (
    <polyline key={index} points={`0,${18 + index * 8} 50,${26 + index * 8} 100,${18 + index * 8}`} fill="none" stroke={ink} strokeWidth={weight} />
  )),
  'dot grid': (ink, rhythm, weight) => {
    const compact = weight >= 5
    const rows = compact ? 3 : 5
    const columns = compact ? 3 : Math.min(5, Math.max(4, rhythm))
    const dots: ReactNode[] = []
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        dots.push(
          <circle
            key={`${row}-${column}`}
            cx={whole((100 / (columns + 1)) * (column + 1))}
            cy={whole((100 / (rows + 1)) * (row + 1))}
            r={compact ? 5 : 3}
            fill={ink}
          />,
        )
      }
    }
    return dots
  },
  diamond: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => {
    const x = whole((100 / (rhythm + 1)) * (index + 1))
    const y = 50 + (index % 2 === 0 ? 0 : 12)
    return <polygon key={index} points={`${x},${y - 11} ${x + 11},${y} ${x},${y + 11} ${x - 11},${y}`} fill="none" stroke={ink} strokeWidth={weight} />
  }),
  wave: (ink, rhythm, weight) => Array.from({ length: rhythm }, (_, index) => {
    const y = rhythm === 1 ? 50 : whole(20 + index * (60 / (rhythm - 1)))
    return (
      <path key={index} d={`M0 ${y} Q25 ${y - 8} 50 ${y} T100 ${y}`} fill="none" stroke={ink} strokeWidth={weight} />
    )
  }),
  scallop: (ink, rhythm, weight) => {
    const step = whole(100 / (rhythm + 1))
    const radius = Math.max(4, whole(step / 2))
    const nodes: ReactNode[] = []
    ;[22, 56, 90].forEach((y, row) => {
      const offset = row % 2 === 0 ? 0 : -radius
      for (let index = 0; index <= rhythm; index += 1) {
        const x = whole(offset + index * step)
        nodes.push(<path key={`${row}-${index}`} d={`M${x} ${y} A${radius} ${radius} 0 0 1 ${x + step} ${y}`} fill="none" stroke={ink} strokeWidth={weight} />)
      }
    })
    return nodes
  },
  'cross-band': (ink, rhythm, weight) => [
    <rect key="left" x="18" y="0" width="12" height="100" fill={ink} />,
    <rect key="right" x="70" y="0" width="12" height="100" fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => (
      <rect key={index} x={whole(26 + index * (48 / rhythm))} y="46" width={whole(weight)} height="8" fill={ink} />
    )),
  ],
}

const stripMotifs: Record<MotifName, Motif> = {
  arcs: (ink, rhythm) => {
    const step = whole(100 / (rhythm + 1))
    return Array.from({ length: rhythm + 1 }, (_, index) => {
      const x = whole(index * step)
      return <path key={index} d={`M${x} 8 L${x + whole(step / 2)} 1 L${x + step} 8 Z`} fill={ink} />
    })
  },
  comb: (ink, rhythm) => {
    const step = whole(100 / (rhythm + 1))
    return Array.from({ length: rhythm + 1 }, (_, index) => (
      <rect key={index} x={whole(index * step + step / 4)} y={index % 2 === 0 ? 0 : 3} width={Math.max(2, whole(step / 2))} height="8" fill={ink} />
    ))
  },
  chevron: (ink, rhythm) => {
    const points = Array.from({ length: rhythm + 1 }, (_, index) => `${whole(index * (100 / rhythm))},${index % 2 === 0 ? 7 : 1}`)
    return [<polygon key="line" points={`0,8 ${points.join(' ')} 100,8`} fill={ink} />]
  },
  'dot grid': (ink, rhythm) => Array.from({ length: rhythm + 1 }, (_, index) => (
    <circle key={index} cx={whole((index + 0.5) * (100 / (rhythm + 1)))} cy="4" r="2" fill={ink} />
  )),
  diamond: (ink, rhythm) => {
    const step = whole(100 / (rhythm + 1))
    const half = Math.max(2, whole(step / 2))
    return Array.from({ length: rhythm + 1 }, (_, index) => {
      const x = whole(index * step + half)
      return <polygon key={index} points={`${x},1 ${x + whole(half * 0.8)},4 ${x},7 ${x - whole(half * 0.8)},4`} fill={ink} />
    })
  },
  wave: (ink, rhythm) => {
    const step = 100 / rhythm
    return Array.from({ length: rhythm * 2 }, (_, index) => (
      <rect key={index} x={whole(index * step / 2)} y={index % 2 === 0 ? 1 : 5} width={Math.max(2, whole(step / 3))} height="2" fill={ink} />
    ))
  },
  scallop: (ink, rhythm) => {
    const step = whole(100 / (rhythm + 1))
    const radius = Math.max(3, whole(step / 2))
    return Array.from({ length: rhythm + 1 }, (_, index) => {
      const x = whole(index * step)
      return <path key={index} d={`M${x} 8 A${radius} ${radius} 0 0 1 ${x + step} 8 Z`} fill={ink} />
    })
  },
  'cross-band': (ink, rhythm) => [
    <rect key="left" x="0" y="0" width="12" height="8" fill={ink} />,
    <rect key="right" x="88" y="0" width="12" height="8" fill={ink} />,
    ...Array.from({ length: rhythm }, (_, index) => (
      <rect key={index} x={whole(22 + index * (56 / rhythm))} y="3" width="6" height="2" fill={ink} />
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

function normalizedIndex(value: number, length: number) {
  return ((value % length) + length) % length
}

function getDrawRhythm(name: MotifName, variant: ClothVariant, rhythm: number) {
  if (variant === 'spine') return Math.max(3, rhythm - 2)
  if (variant === 'thumb') return Math.min(rhythm, 4)
  if (name === 'scallop') return Math.min(rhythm, 8)
  return rhythm
}

export function getCoverClothSpec({
  seed,
  ground,
  motif,
  rotation,
  rhythm,
  variant = 'plate',
}: {
  seed: string
  ground?: number
  motif?: number
  rotation?: ClothRotation
  rhythm?: number
  variant?: ClothVariant
}) {
  const value = hash(seed)
  const groundIndex = normalizedIndex(ground ?? value % GROUNDS.length, GROUNDS.length)
  const motifIndex = normalizedIndex(motif ?? (value >>> 3) % MOTIF_NAMES.length, MOTIF_NAMES.length)
  const name = MOTIF_NAMES[motifIndex]
  const requestedRhythm = Math.min(9, Math.max(3, whole(rhythm ?? 3 + ((value >>> 7) % 7))))
  const allowedRotations = ALLOWED_ROTATIONS[name]
  const selectedRotation = rotation !== undefined && allowedRotations.includes(rotation)
    ? rotation
    : allowedRotations[(value >>> 11) % allowedRotations.length]

  return {
    groundIndex,
    motifIndex,
    name,
    rotation: selectedRotation,
    rhythm: getDrawRhythm(name, variant, requestedRhythm),
    allowedRotations,
    palette: GROUNDS[groundIndex],
  }
}

export function getCoverClothNodeCount(name: MotifName, rhythm: number, variant: ClothVariant) {
  let marks: number
  if (variant === 'strip' || variant === 'spine') {
    if (name === 'chevron') marks = 1
    else if (name === 'cross-band') marks = rhythm + 2
    else if (name === 'wave') marks = rhythm * 2
    else marks = rhythm + 1
  } else if (name === 'comb') marks = rhythm + 1
  else if (name === 'dot grid') marks = variant === 'thumb' ? 9 : 5 * Math.min(5, Math.max(4, rhythm))
  else if (name === 'scallop') marks = 3 * (rhythm + 1)
  else if (name === 'cross-band') marks = rhythm + 2
  else marks = rhythm
  return marks + 3
}

export function CoverCloth({
  seed,
  ground,
  motif,
  rotation,
  rhythm,
  variant = 'plate',
  className,
  preview = false,
}: {
  seed: string
  ground?: number
  motif?: number
  rotation?: ClothRotation
  rhythm?: number
  variant?: ClothVariant
  className?: string
  preview?: boolean
}) {
  const spec = getCoverClothSpec({ seed, ground, motif, rotation, rhythm, variant })
  const isStrip = variant === 'strip'
  const isSpine = variant === 'spine'
  const viewBox = isSpine ? '0 0 8 100' : isStrip ? '0 0 100 8' : '0 0 100 100'
  const preserve = isStrip || isSpine ? 'none' : 'xMidYMid slice'
  const weight = variant === 'thumb' ? 5 : 2
  const content = isStrip || isSpine
    ? stripMotifs[spec.name](spec.palette.ink, spec.rhythm, 2)
    : plateMotifs[spec.name](spec.palette.ink, spec.rhythm, weight)
  const nodeCount = content.length + 3

  return (
    <svg
      className={`cloth${className ? ` ${className}` : ''}`}
      viewBox={viewBox}
      preserveAspectRatio={preserve}
      aria-hidden="true"
      focusable="false"
      {...(preview ? {
        'data-ground': spec.groundIndex,
        'data-motif': spec.name,
        'data-rhythm': spec.rhythm,
        'data-rotation': spec.rotation,
        'data-node-count': nodeCount,
      } : {})}
    >
      <rect width={isSpine ? 8 : 100} height={isStrip ? 8 : 100} fill={spec.palette.bg} />
      <g transform={isSpine ? 'translate(8 0) rotate(90)' : isStrip ? undefined : `rotate(${spec.rotation} 50 50)`}>
        {content}
      </g>
    </svg>
  )
}

export { ALLOWED_ROTATIONS as CLOTH_ROTATIONS, GROUNDS as CLOTH_GROUNDS, MOTIF_NAMES as CLOTH_MOTIFS }
