import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AccountDetailsForm from '@/components/account-details-form'
import AccountPasswordForm from '@/components/account-password-form'
import AccountSessionForms from '@/components/account-session-forms'
import { Header } from '@/components/shared'

export default function AccountView({ account }: { account: { name: string; username: string; email: string } }) {
  return (
    <div className="page-wrap settings-page">
      <Header />
      <main className="settings-main">
        <Link className="settings-back btn btn--quiet" href="/profile/settings" aria-label="Back to Settings">
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          Back to Settings
        </Link>
        <h1 className="settings-page__title">Account</h1>
        <AccountDetailsForm initialName={account.name} initialUsername={account.username} email={account.email} />
        <AccountPasswordForm />
        <AccountSessionForms />
      </main>
    </div>
  )
}
