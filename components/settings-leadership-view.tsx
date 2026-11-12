import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/shared'

const LEADER_LINKS = [
  { href: '/classes/manage', label: 'Manage class' },
  { href: '/author/lessons', label: 'Write lessons' },
] as const

const ADMIN_LINKS = [
  { href: '/admin/members', label: 'Manage members' },
  { href: '/admin/classes', label: 'Manage classes' },
  { href: '/author/lessons', label: 'Write lessons' },
] as const

export default function SettingsLeadershipView({ role }: { role: 'class_leader' | 'admin' }) {
  const links = role === 'admin' ? ADMIN_LINKS : LEADER_LINKS

  return (
    <div className="page-wrap settings-page">
      <Header />
      <main className="settings-main">
        <Link className="settings-back btn btn--quiet" href="/profile/settings" aria-label="Back to Settings">
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          Back to Settings
        </Link>
        <h1 className="settings-page__title">Leadership</h1>
        <ul className="settings-list card card--borderless">
          {links.map(link => (
            <li key={link.href}>
              <Link className="row" href={link.href}>
                <span className="row__main"><span className="row__title">{link.label}</span></span>
                <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
