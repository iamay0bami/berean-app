import { notFound } from 'next/navigation'
import { CoverCloth, CLOTH_GROUNDS, CLOTH_MOTIFS } from '@/components/cover-cloth'
import { Header } from '@/components/shared'
import { getActiveClasses, getCurrentRole, getSermons } from '@/lib/mock-data'

// A gate, not a surface. Every ground × motif at the sizes the app actually
// uses, side by side in both themes, seeded with real ids where the database has
// them. Reviewed before any screen renders a plate, then deleted with the route.

const SIZES = [
  { id: 'card', label: '16:9 card', width: 320, height: 180, round: false },
  { id: 'header', label: '4:5 class header', width: 200, height: 250, round: false },
  { id: 'letterbox', label: '16:9 sermon letterbox', width: 240, height: 135, round: false },
  { id: 'band', label: '6px lesson band', width: 200, height: 6, round: false },
  { id: 'edge', label: '3px row edge', width: 200, height: 3, round: false },
  { id: 'bookplate', label: 'bookplate ring', width: 78, height: 78, round: true },
] as const

const THEMES = ['light', 'dark'] as const

export default async function ClothPreviewPage() {
  const role = await getCurrentRole()
  if (role !== 'admin') notFound()

  const [classes, sermons] = await Promise.all([getActiveClasses(), getSermons(12)])
  const realSeeds = [...classes.map(item => item.id), ...sermons.map(item => item.id)]
  const seeds = realSeeds.length
    ? realSeeds
    : ['preview-class-one', 'preview-class-two', 'preview-lesson-one', 'preview-sermon-one']

  return (
    <div className="page-wrap cloth-page">
      <Header />
      <main>
        <h1 className="cloth-title">Cover cloth</h1>
        <p className="cloth-note">
          Six grounds × eight motifs at the app&apos;s real sizes, seeded from real ids
          ({realSeeds.length ? `${realSeeds.length} live ids` : 'static seeds — the database is empty'}).
          The grounds must stay distinct at 3px, the deep plates must sit on the light
          surface, and no motif may read as a logo or a flag.
        </p>

        <div className="cloth-themes">
          {THEMES.map(theme => (
            <section className={`cloth-scope cloth-scope--${theme}`} key={theme}>
              <h2 className="cloth-heading">{theme === 'light' ? 'Day room' : 'Lamplit room'}</h2>

              <h3 className="cloth-subheading">Ground × motif, 16:9 card</h3>
              <div className="cloth-grid">
                {CLOTH_GROUNDS.flatMap((ground, groundIndex) => (
                  CLOTH_MOTIFS.map((motif, motifIndex) => (
                    <figure className="cloth-swatch" key={`${groundIndex}-${motifIndex}`}>
                      <div className="cloth-frame" style={{ inlineSize: 112, blockSize: 63 }}>
                        <CoverCloth seed={seeds[(groundIndex * CLOTH_MOTIFS.length + motifIndex) % seeds.length]} ground={groundIndex} motif={motifIndex} />
                      </div>
                      <figcaption className="cloth-label">{groundIndex + 1} · {motif}</figcaption>
                    </figure>
                  ))
                ))}
              </div>

              {SIZES.slice(1).map(size => (
                <div key={size.id}>
                  <h3 className="cloth-subheading">{size.label}</h3>
                  <div className="cloth-grid">
                    {CLOTH_GROUNDS.map((ground, groundIndex) => (
                      <figure className="cloth-swatch" key={`${size.id}-${groundIndex}`}>
                        <div
                          className="cloth-frame"
                          style={{
                            inlineSize: size.width,
                            blockSize: size.height,
                            borderRadius: size.round ? '50%' : undefined,
                          }}
                        >
                          <CoverCloth seed={seeds[groundIndex % seeds.length]} ground={groundIndex} motif={groundIndex} />
                        </div>
                        <figcaption className="cloth-label">ground {groundIndex + 1}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ))}

              <h3 className="cloth-subheading">Production seeds (default hash)</h3>
              <div className="cloth-grid">
                {seeds.map(seed => (
                  <figure className="cloth-swatch" key={seed}>
                    <div className="cloth-frame" style={{ inlineSize: 112, blockSize: 63 }}>
                      <CoverCloth seed={seed} />
                    </div>
                    <figcaption className="cloth-label">{seed.slice(0, 8)}</figcaption>
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
