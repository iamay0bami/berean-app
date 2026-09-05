import AppShell from '@/components/app-shell'
import HomeView from '@/components/home-view'
import { getHomeData, getViewerRole } from '@/lib/mock-data'

export default async function HomePage() {
  const [{ lesson, sermon, prayer }, viewerRole] = await Promise.all([getHomeData(), getViewerRole()])
  return <AppShell><HomeView lesson={lesson} sermon={sermon} prayer={prayer ?? { id: '', initials: '', name: '', time: '', text: '', hearts: 0 }} viewerRole={viewerRole} /></AppShell>
}
