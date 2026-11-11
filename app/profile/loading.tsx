import AppShell from '@/components/app-shell'
import { Header } from '@/components/shared'

export default function Loading() {
  return (
    <AppShell>
      <div className="page-wrap profile-page profile-skeleton">
        <Header />
        <p className="sr-only" role="status">Loading profile…</p>
        <main className="profile-main" aria-busy="true">
          <div className="profile-skeleton__geometry" aria-hidden="true" inert>
            <div className="profile-identity card card--borderless">
              <span className="skeleton-block profile-skeleton__bookplate" />
              <span className="profile-skeleton__identity-copy">
                <span className="skeleton-block profile-skeleton__line profile-skeleton__line--name" />
                <span className="skeleton-block profile-skeleton__line profile-skeleton__line--church" />
                <span className="skeleton-block profile-skeleton__line profile-skeleton__line--meta" />
              </span>
            </div>

            <div className="profile-section">
              <span className="skeleton-block profile-skeleton__heading" />
              <div className="class-shelf">
                {[0, 1, 2].map(index => (
                  <div className="class-shelf__item" key={index}>
                    <div className="skeleton-block profile-skeleton__cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-content-grid">
              {[0, 1].map(section => (
                <div className="profile-section profile-content-grid__section" key={section}>
                  <span className="skeleton-block profile-skeleton__heading" />
                  <div className="profile-list card card--borderless">
                    {[0, 1].map(row => (
                      <span className="profile-skeleton__row" key={row}>
                        <span className="profile-skeleton__row-copy">
                          <span className="skeleton-block profile-skeleton__line" />
                          <span className="skeleton-block profile-skeleton__line profile-skeleton__line--short" />
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
