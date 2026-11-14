import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import AccountView from '@/components/account-view'
import ProfilePending from '@/components/profile-pending'
import { getOwnAccount } from '@/lib/mock-data'

export default async function AccountPage() {
  const result = await getOwnAccount()
  if (result.status === 'anonymous') redirect('/auth/sign-in?next=/profile/settings/account')
  if (result.status === 'pending') return <AppShell><ProfilePending /></AppShell>
  return <AppShell><AccountView account={result.account} /></AppShell>
}
