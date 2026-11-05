import AppShell from '@/components/app-shell'

export default function Loading() {
  return (
    <AppShell>
      <div className="class-detail class-detail-skeleton">
        <p className="sr-only" role="status">Loading class…</p>
        <main className="class-detail-main" aria-busy="true">
          <div className="class-detail__wrap page-wrap" aria-hidden="true" inert>
            <div className="class-detail__hero">
              <div className="class-detail__art class-detail-skeleton__block" />
              <div className="class-detail-header">
                <span className="class-detail-skeleton__header-block class-detail-header__back" />
                <span className="class-detail-skeleton__header-block" />
              </div>
              <div className="cloth-caption cloth-caption--class class-detail__overview">
                <span className="class-detail-skeleton__line class-detail-skeleton__line--title" />
                <div className="class-detail__leaders">
                  <span className="class-detail-skeleton__line class-detail-skeleton__line--label" />
                  <span className="class-detail-skeleton__line class-detail-skeleton__line--leader" />
                  <span className="class-detail-skeleton__line class-detail-skeleton__line--short" />
                </div>
              </div>
            </div>
            <div className="card card--borderless class-detail__summary">
              <div className="class-detail-skeleton__row-copy">
                <span className="class-detail-skeleton__line" />
                <span className="class-detail-skeleton__line class-detail-skeleton__line--short" />
              </div>
              <div className="class-detail__lessons">
                <span className="class-detail-skeleton__line class-detail-skeleton__line--section" />
                {[0, 1, 2].map(index => (
                  <div className="class-detail-skeleton__row" key={index}>
                    <span className="folio class-detail-skeleton__folio" />
                    <span className="class-detail-skeleton__row-copy">
                      <span className="class-detail-skeleton__line class-detail-skeleton__line--row-title" />
                      <span className="class-detail-skeleton__line class-detail-skeleton__line--row-meta" />
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
