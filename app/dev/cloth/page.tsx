import type { CSSProperties, ReactNode } from 'react'
import { Noto_Serif, Source_Serif_4 } from 'next/font/google'
import { notFound } from 'next/navigation'
import {
  CLOTH_GROUNDS,
  CLOTH_MOTIFS,
  CLOTH_ROTATIONS,
  CoverCloth,
  getCoverClothNodeCount,
  getCoverClothSpec,
  type ClothRotation,
  type ClothVariant,
} from '@/components/cover-cloth'
import { Header } from '@/components/shared'
import { getClassLeaders, getClothPreviewData, getCurrentRole, getViewer } from '@/lib/mock-data'

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-source-serif',
  display: 'swap',
})

const notoSerif = Noto_Serif({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-noto-serif',
  display: 'swap',
})

const THEMES = ['light', 'dark'] as const
const COVER_SIZES = [
  { id: 'mobile-min', label: '320px shelf · 126×168', width: 126, height: 168 },
  { id: 'mobile', label: '360px shelf · 144×192', width: 144, height: 192 },
  { id: 'tablet', label: '768px+ shelf · 168×224', width: 168, height: 224 },
] as const
const HERO_SIZES = [
  { id: 'narrow', label: '320px viewport · 280×93', width: 280, height: 93 },
  { id: 'mobile', label: '360px viewport · 320×107', width: 320, height: 107 },
] as const
const YORUBA_NFC = 'Ń ń Ḿ ḿ Ǹ ǹ Ẹ́ Ọ̀ ẹ̄ Àmín Ọ̀rọ̀ Ẹ̀mí ìgbàgbọ́'.normalize('NFC')
const YORUBA_NFD_DIAGNOSTIC = 'ń'
const YORUBA_CLUSTERS = ['Ń', 'ń', 'Ḿ', 'ḿ', 'Ǹ', 'ǹ', 'Ẹ́', 'Ọ̀', 'ẹ̄'] as const
const KNOWN_SPLIT_SUBSET_FALLBACK = 'ṣ́'
const TYPE_SIZES = [
  { label: '14px', className: 'cloth-type-sample--14' },
  { label: '16px', className: 'cloth-type-sample--16' },
  { label: '19px', className: 'cloth-type-sample--19' },
] as const
const TYPE_FAMILIES = [
  { label: 'Fraunces · production fixed English', className: 'cloth-type-family--fraunces' },
  { label: 'Hanken Grotesk · production live text', className: 'cloth-type-family--hanken' },
  { label: 'Source Serif 4 · preview control', className: 'cloth-type-family--source' },
  { label: 'Noto Serif · preview control', className: 'cloth-type-family--noto' },
] as const

function Frame({ width, height, round = false, children }: { width: number; height: number; round?: boolean; children: ReactNode }) {
  return (
    <div
      className={`cloth-frame${round ? ' cloth-frame--round' : ''}`}
      style={{ inlineSize: width, blockSize: height } as CSSProperties}
    >
      {children}
    </div>
  )
}

function leaderSummary(names: string[]) {
  if (!names.length) return 'Leader not assigned'
  if (names.length === 1) return `Led by ${names[0]}`
  return `Led by ${names[0]} +${names.length - 1}`
}

export default async function ClothPreviewPage() {
  const role = await getCurrentRole()
  if (role !== 'admin') notFound()

  const [preview, viewer, classLeaders] = await Promise.all([
    getClothPreviewData(),
    getViewer(),
    getClassLeaders(),
  ])
  const seeds = preview.seeds.length
    ? preview.seeds
    : ['preview-class-one', 'preview-class-two', 'preview-lesson-one', 'preview-sermon-one']
  const leadersByClass = new Map<string, string[]>()
  for (const leader of classLeaders) {
    const names = leadersByClass.get(leader.class_id) ?? []
    names.push(leader.leader_name)
    leadersByClass.set(leader.class_id, names)
  }
  for (const names of leadersByClass.values()) names.sort((left, right) => left.localeCompare(right))
  const greetingNames = [...new Set([
    ...(viewer.firstName ? [viewer.firstName] : []),
    ...classLeaders.map(leader => leader.leader_name),
  ])]

  return (
    <div className={`page-wrap cloth-page ${sourceSerif.variable} ${notoSerif.variable}`}>
      <Header />
      <main>
        <h1 className="cloth-title">Cover cloth</h1>
        <p className="cloth-note">
          Retained approval gate: production fonts, all six grounds, all eight motifs,
          every production cover size, both real 3:1 crops, compact marks, captions,
          default hashes and total SVG element counts. The page uses {preview.seeds.length
            ? `${preview.seeds.length} real ids`
            : 'static fallback ids because no readable rows exist'}.
        </p>

        <div className="cloth-themes">
          {THEMES.map(theme => (
            <section className={`cloth-scope cloth-scope--${theme}`} key={theme}>
              <h2 className="cloth-heading">{theme === 'light' ? 'Day room' : 'Lamplit room'}</h2>

              <h3 className="cloth-subheading">Yoruba shaping controls</h3>
              <div className="cloth-type-grid" lang="yo">
                {TYPE_FAMILIES.map(family => (
                  <section className={`cloth-type-family ${family.className}`} key={family.label}>
                    <h4 className="cloth-type-family-name">{family.label}</h4>
                    {TYPE_SIZES.map(size => (
                      <div className="cloth-type-row" key={size.label}>
                        <span className="cloth-type-size">{size.label} · NFC</span>
                        <p className={`cloth-type-sample ${size.className}`}>{YORUBA_NFC}</p>
                      </div>
                    ))}
                    <div className="cloth-type-row cloth-type-row--nfd">
                      <span className="cloth-type-size">16px · NFD diagnostic · n + U+0301</span>
                      <p className="cloth-type-sample cloth-type-sample--16">{YORUBA_NFD_DIAGNOSTIC}</p>
                    </div>
                    <div className="cloth-type-clusters">
                      {YORUBA_CLUSTERS.map(cluster => <span className="cloth-type-cluster" key={cluster}>{cluster}</span>)}
                    </div>
                    <div className="cloth-type-row cloth-type-row--known-fallback">
                      <span className="cloth-type-size">known split-subset fallback, not valid orthography</span>
                      <p className="cloth-type-sample cloth-type-sample--16">{KNOWN_SPLIT_SUBSET_FALLBACK}</p>
                    </div>
                  </section>
                ))}
              </div>

              <h3 className="cloth-subheading">Real-name greeting composition</h3>
              {greetingNames.length ? (
                <div className="cloth-greeting-grid">
                  {greetingNames.flatMap(name => TYPE_SIZES.map(size => (
                    <div className="cloth-type-row" key={`${name}-${size.label}`}>
                      <span className="cloth-type-size">{size.label}</span>
                      <p className={`cloth-greeting ${size.className}`}>Good morning, <span className="cloth-greeting__name">{name}</span>.</p>
                    </div>
                  )))}
                </div>
              ) : <p className="cloth-note">No readable real profile or leader names are available for this admin session.</p>}

              {COVER_SIZES.map((size, sizeIndex) => (
                <div key={size.id}>
                  <h3 className="cloth-subheading">{size.label}{sizeIndex > 0 ? ' · captioned' : ''}</h3>
                  <div className="cloth-grid">
                    {CLOTH_GROUNDS.flatMap((_, groundIndex) => CLOTH_MOTIFS.map((motif, motifIndex) => {
                      const sampleIndex = groundIndex * CLOTH_MOTIFS.length + motifIndex
                      const classRow = preview.classes[sampleIndex % Math.max(1, preview.classes.length)]
                      const title = classRow?.name ?? 'No active class row'
                      const leaders = classRow ? leadersByClass.get(classRow.id) ?? [] : []
                      return (
                        <figure className="cloth-swatch" key={`${size.id}-${groundIndex}-${motif}`}>
                          <div className="cloth-cover">
                            <Frame width={size.width} height={size.height}>
                              <CoverCloth
                                seed={seeds[sampleIndex % seeds.length]}
                                ground={groundIndex}
                                motif={motifIndex}
                                variant="cover"
                                preview
                              />
                            </Frame>
                            {sizeIndex > 0 && (
                              <div className="cloth-caption">
                                <p className="cloth-caption__title">{title}</p>
                                <p className="cloth-caption__leaders">{leaderSummary(leaders)}</p>
                              </div>
                            )}
                          </div>
                          <figcaption className="cloth-label">{groundIndex + 1} · {motif}</figcaption>
                        </figure>
                      )
                    }))}
                  </div>
                </div>
              ))}

              <h3 className="cloth-subheading">3:1 middle-third crop · every allowed rotation and min/max rhythm</h3>
              {HERO_SIZES.map(size => (
                <div key={size.id}>
                  <h4 className="cloth-type-family-name">{size.label}</h4>
                  <div className="cloth-grid">
                    {CLOTH_MOTIFS.flatMap((motif, motifIndex) => (
                      CLOTH_ROTATIONS[motif].flatMap(rotation => ([3, 9] as const).map(rhythm => {
                        const spec = getCoverClothSpec({ seed: 'hero-crop', motif: motifIndex, rotation, rhythm, variant: 'plate' })
                        const nodes = getCoverClothNodeCount(spec.name, spec.rhythm, 'plate')
                        return (
                          <figure className="cloth-swatch" key={`${size.id}-${motif}-${rotation}-${rhythm}`}>
                            <Frame width={size.width} height={size.height}>
                              <CoverCloth seed="hero-crop" ground={motifIndex % CLOTH_GROUNDS.length} motif={motifIndex} rotation={rotation as ClothRotation} rhythm={rhythm} variant="plate" preview />
                            </Frame>
                            <figcaption className="cloth-label">{motif} · {rotation}° · r{spec.rhythm} · {nodes} elements</figcaption>
                          </figure>
                        )
                      }))
                    ))}
                  </div>
                </div>
              ))}

              <h3 className="cloth-subheading">Compact marks · every motif</h3>
              <div className="cloth-grid">
                {CLOTH_MOTIFS.map((motif, motifIndex) => (
                  <figure className="cloth-swatch" key={`compact-${motif}`}>
                    <Frame width={44} height={44}>
                      <CoverCloth seed={`thumb-${motif}`} ground={motifIndex % CLOTH_GROUNDS.length} motif={motifIndex} variant="thumb" preview />
                    </Frame>
                    <Frame width={200} height={6}>
                      <CoverCloth seed={`band-${motif}`} ground={motifIndex % CLOTH_GROUNDS.length} motif={motifIndex} variant="strip" preview />
                    </Frame>
                    <Frame width={6} height={96}>
                      <CoverCloth seed={`spine-${motif}`} ground={motifIndex % CLOTH_GROUNDS.length} motif={motifIndex} variant="spine" preview />
                    </Frame>
                    <figcaption className="cloth-label">{motif}</figcaption>
                  </figure>
                ))}
              </div>

              <h3 className="cloth-subheading">Maximum element counts</h3>
              <div className="cloth-node-list">
                {CLOTH_MOTIFS.map((motif, motifIndex) => {
                  const spec = getCoverClothSpec({ seed: 'node-limit', motif: motifIndex, rhythm: 9, variant: 'cover' })
                  const count = getCoverClothNodeCount(spec.name, spec.rhythm, 'cover')
                  return (
                    <div className="cloth-node-item" key={`node-${motif}`}>
                      <span className="cloth-label">{motif} · rhythm {spec.rhythm}</span>
                      <span className={`cloth-node-count${count > 30 ? ' cloth-node-count--limit' : ''}`}>{count} total elements</span>
                    </div>
                  )
                })}
              </div>

              <h3 className="cloth-subheading">Real production hashes</h3>
              <div className="cloth-grid">
                {seeds.map(seed => (
                  <figure className="cloth-swatch" key={seed}>
                    <Frame width={144} height={192}>
                      <CoverCloth seed={seed} variant="cover" preview />
                    </Frame>
                    <figcaption className="cloth-label">{seed.slice(0, 12)}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
