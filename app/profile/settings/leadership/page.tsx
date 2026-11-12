import AppShell from '@/components/app-shell'
import SettingsLeadershipView from '@/components/settings-leadership-view'
import { getCurrentRole } from '@/lib/mock-data'
import { redirect } from 'next/navigation'

export default async function LeadershipPage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/profile/settings/leadership')
  if (role === 'member') redirect('/profile/settings')
  return <AppShell><SettingsLeadershipView role={role} /></AppShell>
}
