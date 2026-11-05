import AppShell from '@/components/app-shell'
import { Header } from '@/components/shared'

export default function Loading() {
  return (
    <AppShell>
      <div className="page-wrap classes-page classes-skeleton">
        <Header />
        <p className="sr-only" role="status">Loading classes…</p>
        <main aria-busy="true">
          <div aria-hidden="true" inert>
            <div className="classes-page__title skeleton-block classes-skeleton__title" />
            <div className="classes-section">
              <div className="skeleton-block classes-skeleton__heading" />
              <div className="class-shelf">
                {[0, 1, 2].map(index => (
                  <div className="class-shelf__item" key={index}>
                    <div className="skeleton-block classes-skeleton__cover" />
                  </div>
                ))}
              </div>
            </div>
            <div className="classes-section">
              <div className="skeleton-block classes-skeleton__heading" />
              <div className="class-row-list">
                {[0, 1].map(index => (
                  <div className="row row--plate card card--borderless classes-skeleton__row" key={index}>
                    <span className="class-row__thumb skeleton-block classes-skeleton__thumb" />
                    <span className="row__main classes-skeleton__copy">
                      <span className="skeleton-block classes-skeleton__line" />
                      <span className="skeleton-block classes-skeleton__line classes-skeleton__line--short" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="classes-section">
              <div className="skeleton-block classes-skeleton__heading" />
              <div className="class-row-list class-row-list--lessons">
                {[0, 1].map(index => (
                  <div className="row classes-skeleton__row" key={index}>
                    <span className="folio skeleton-block classes-skeleton__folio" />
                    <span className="row__main classes-skeleton__copy">
                      <span className="skeleton-block classes-skeleton__line" />
                      <span className="skeleton-block classes-skeleton__line classes-skeleton__line--short" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
