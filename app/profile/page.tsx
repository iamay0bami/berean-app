import AppShell from '@/components/app-shell'
import ProfileView from '@/components/profile-view'
import { getProfile } from '@/lib/mock-data'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/sign-in?next=/profile')
  return <AppShell><ProfileView profile={profile} /></AppShell>
}
