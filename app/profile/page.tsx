import AppShell from '@/components/app-shell'
import ProfileView from '@/components/profile-view'
import ProfilePending from '@/components/profile-pending'
import { getClassCatalog, getMyInsights, getMyPrayerPoints, getProfile, getReadableLessonSummaries } from '@/lib/mock-data'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const result = await getProfile()
  if (result.status === 'anonymous') redirect('/auth/sign-in?next=/profile')
  if (result.status === 'pending') return <AppShell><ProfilePending /></AppShell>

  const [catalog, readableLessons, insights, prayers] = await Promise.all([
    getClassCatalog(),
    getReadableLessonSummaries(),
    getMyInsights(),
    getMyPrayerPoints(),
  ])

  return (
    <AppShell>
      <ProfileView
        profile={result.profile}
        classes={catalog.filter(item => item.isMine)}
        readableLessons={readableLessons}
        insights={insights}
        prayers={prayers}
      />
    </AppShell>
  )
}
