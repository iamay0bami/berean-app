import AppShell from '@/components/app-shell'
import ProfileView from '@/components/profile-view'
import { getProfile } from '@/lib/mock-data'

export default async function ProfilePage() {
  const profile = await getProfile()
  return <AppShell><ProfileView profile={profile} /></AppShell>
}
