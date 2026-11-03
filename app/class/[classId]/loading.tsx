import AppShell from '@/components/app-shell'

export default async function Loading() {
  return (
    <AppShell>
      <div className="class-detail class-detail-skeleton">
        <header className="class-detail-header" aria-hidden="true">
          <div className="class-detail-header__inner page-wrap">
            <span className="class-detail-skeleton__header-block class-detail-skeleton__header-block--back" />
            <span className="class-detail-skeleton__header-block class-detail-skeleton__header-block--title" />
            <span className="class-detail-skeleton__header-block class-detail-skeleton__header-block--theme" />
          </div>
        </header>
        <main className="class-detail-main" aria-busy="true">
          <p className="sr-only" role="status">Loading…</p>
          <div className="class-detail__wrap page-wrap" aria-hidden="true">
            <div className="class-detail__hero cloth-frame class-detail-skeleton__block" />
            <div className="class-detail__overview class-detail-skeleton__overview">
              <div className="class-detail-skeleton__summary">
                <span className="class-detail-skeleton__line class-detail-skeleton__line--title" />
                <span className="class-detail-skeleton__line" />
                <span className="class-detail-skeleton__line class-detail-skeleton__line--short" />
              </div>
              <div className="class-detail-skeleton__leaders">
                <span className="class-detail-skeleton__line class-detail-skeleton__line--label" />
                <span className="class-detail-skeleton__line class-detail-skeleton__line--leader" />
                <span className="class-detail-skeleton__line class-detail-skeleton__line--short" />
              </div>
            </div>
            <div className="class-detail-skeleton__lessons">
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
        </main>
      </div>
    </AppShell>
  )
}
