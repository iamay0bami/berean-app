import AppShell from '@/components/app-shell'
import SettingsView from '@/components/settings-view'
import { getCurrentRole } from '@/lib/mock-data'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/profile/settings')
  return <AppShell><SettingsView role={role} /></AppShell>
}
