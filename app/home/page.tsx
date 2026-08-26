import AppShell from '@/components/app-shell'
import HomeView from '@/components/home-view'
import { getHomeData } from '@/lib/mock-data'

export default async function HomePage() {
  const { lesson, sermon, prayer } = await getHomeData()
  if (!lesson || !sermon || !prayer) return null
  return <AppShell><HomeView lesson={lesson} sermon={sermon} prayer={prayer} /></AppShell>
}
