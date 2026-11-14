import AppShell from '@/components/app-shell'
import { Header } from '@/components/shared'

export default function SettingsLoading({ label, rows }: { label: string; rows: number }) {
  return (
    <AppShell>
      <div className="page-wrap settings-page settings-skeleton">
        <Header />
        <p className="sr-only" role="status">{label}</p>
        <main className="settings-main" aria-busy="true">
          <div aria-hidden="true" inert>
            <span className="settings-back skeleton-block settings-skeleton__back" />
            <span className="settings-page__title skeleton-block settings-skeleton__title" />
            <div className="settings-list card card--borderless">
              {Array.from({ length: rows }, (_, index) => (
                <span className="row settings-skeleton__row" key={index}>
                  <span className="skeleton-block settings-skeleton__line" />
                  <span className="skeleton-block settings-skeleton__cue" />
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
