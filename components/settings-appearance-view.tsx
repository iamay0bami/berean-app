import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/shared'
import { ThemeChoices, type ThemeChoice } from '@/components/theme-toggle'

export default function SettingsAppearanceView({ initialTheme }: { initialTheme: ThemeChoice }) {
  return (
    <div className="page-wrap settings-page">
      <Header />
      <main className="settings-main">
        <Link className="settings-back btn btn--quiet" href="/profile/settings" aria-label="Back to Settings">
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          Back to Settings
        </Link>
        <h1 className="settings-page__title">Appearance</h1>
        <ThemeChoices initialTheme={initialTheme} />
      </main>
    </div>
  )
}
