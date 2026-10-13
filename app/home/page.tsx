import { headers } from 'next/headers'
import AppShell from '@/components/app-shell'
import HomeView from '@/components/home-view'
import { dateLabel, pickGreeting, safeTimeZone } from '@/lib/greeting'
import { getHomeData, getViewer } from '@/lib/mock-data'

export default async function HomePage() {
  const [{ lesson, sermon, prayer }, viewer, tzHeader] = await Promise.all([
    getHomeData(),
    getViewer(),
    headers().then(incoming => incoming.get('x-vercel-ip-timezone')),
  ])
  const timeZone = safeTimeZone(tzHeader)
  return <AppShell><HomeView lesson={lesson} sermon={sermon} prayer={prayer ?? { id: '', initials: '', name: '', time: '', text: '', hearts: 0 }} viewerRole={viewer.role} greeting={pickGreeting(viewer.firstName, timeZone)} dateLabel={dateLabel(timeZone)} /></AppShell>
}
