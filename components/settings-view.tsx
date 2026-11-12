import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/shared'
import type { AppRole } from '@/lib/types'

export default function SettingsView({ role }: { role: AppRole }) {
  const showLeadership = role === 'class_leader' || role === 'admin'

  return (
    <div className="page-wrap settings-page">
      <Header />
      <main className="settings-main">
        <Link className="settings-back btn btn--quiet" href="/profile" aria-label="Back to Profile">
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          Back to Profile
        </Link>
        <h1 className="settings-page__title">Settings</h1>
        <ul className="settings-list card card--borderless">
          <li>
            <Link className="row" href="/profile/settings/appearance">
              <span className="row__main"><span className="row__title">Appearance</span></span>
              <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </li>
          {showLeadership && (
            <li>
              <Link className="row" href="/profile/settings/leadership">
                <span className="row__main"><span className="row__title">Leadership</span></span>
                <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </li>
          )}
        </ul>
      </main>
    </div>
  )
}
