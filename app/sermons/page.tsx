import AppShell from '@/components/app-shell'
import SermonsView from '@/components/sermons-view'
import { getPrayerPoints, getSermons } from '@/lib/mock-data'

export default async function SermonsPage() {
  const [sermons, prayers] = await Promise.all([getSermons(), getPrayerPoints()])
  return <AppShell><SermonsView sermons={sermons} prayers={prayers} /></AppShell>
}
