import AppShell from '@/components/app-shell'
import { Header } from '@/components/shared'

export default function Loading() {
  return (
    <AppShell>
      <div className="page-wrap home-page home-skeleton">
        <Header />
        <p className="sr-only" role="status">Loading home…</p>
        <main className="home-main" aria-busy="true">
          <div className="home-skeleton__geometry" aria-hidden="true" inert>
            <div className="home-welcome">
              <span className="skeleton-block home-skeleton__date" />
              <div className="home-skeleton__greeting">
                <span className="skeleton-block home-skeleton__greeting-line" />
                <span className="skeleton-block home-skeleton__greeting-line home-skeleton__greeting-line--short" />
              </div>
            </div>

            <div className="home-section">
              <span className="skeleton-block home-skeleton__heading" />
              <div className="home-latest card card--borderless home-skeleton__latest">
                <span className="home-skeleton__band" />
                <div className="home-skeleton__latest-content">
                  <span className="folio skeleton-block" />
                  <span className="home-skeleton__copy">
                    <span className="skeleton-block home-skeleton__line home-skeleton__line--title" />
                    <span className="skeleton-block home-skeleton__line home-skeleton__line--meta" />
                  </span>
                  <span className="skeleton-block home-skeleton__chevron" />
                </div>
              </div>
            </div>

            <div className="home-section">
              <span className="skeleton-block home-skeleton__heading" />
              <div className="home-verse card card--borderless home-skeleton__verse">
                <div className="home-skeleton__copy home-skeleton__copy--verse">
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--short" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--meta" />
                </div>
              </div>
            </div>

            <div className="home-section">
              <span className="skeleton-block home-skeleton__heading" />
              <div className="class-shelf">
                {[0, 1, 2].map(index => (
                  <div className="class-shelf__item" key={index}>
                    <div className="skeleton-block home-skeleton__cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="home-section">
              <span className="skeleton-block home-skeleton__heading" />
              <div className="home-destinations">
                {[0, 1].map(index => (
                  <div className="home-destination card card--borderless" key={index}>
                    <div className="home-destination__top">
                      <span className="skeleton-block home-skeleton__destination-label" />
                      <span className="skeleton-block home-skeleton__chevron" />
                    </div>
                    <div className="home-destination__panel home-skeleton__panel">
                      <span className="skeleton-block home-skeleton__line home-skeleton__line--title" />
                      <span className="skeleton-block home-skeleton__line" />
                      <span className="skeleton-block home-skeleton__line home-skeleton__line--short" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-reflections">
              <div className="home-section home-reflections__section">
                <span className="skeleton-block home-skeleton__heading" />
                <div className="home-reflection-link card card--borderless">
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--short" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--cue" />
                </div>
              </div>

              <div className="home-section home-reflections__section">
                <span className="skeleton-block home-skeleton__heading" />
                <div className="home-reflection-link card card--borderless">
                  <div className="home-skeleton__byline">
                    <span className="skeleton-block home-skeleton__line home-skeleton__line--author" />
                    <span className="skeleton-block home-skeleton__line home-skeleton__line--time" />
                  </div>
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--short" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--cue" />
                </div>
              </div>

              <div className="home-section home-reflections__section home-reflections__section--prayer">
                <span className="skeleton-block home-skeleton__heading" />
                <div className="home-prayer card card--borderless home-skeleton__prayer">
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--short" />
                  <span className="skeleton-block home-skeleton__line home-skeleton__line--meta" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
