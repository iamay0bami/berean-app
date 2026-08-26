import AppShell from '@/components/app-shell'
import DiscussionView from '@/components/discussion-view'
import { getDiscussionData } from '@/lib/mock-data'

export default async function DiscussPage() {
  const data = await getDiscussionData()
  return <AppShell><DiscussionView data={data} /></AppShell>
}
