import { notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import SermonReading from '@/components/sermon-reading'
import { getSermon } from '@/lib/mock-data'

export default async function SermonPage({ params }: { params: Promise<{ sermonId: string }> }) {
  const { sermonId } = await params
  const sermon = await getSermon(sermonId)
  if (!sermon) notFound()
  return <AppShell><SermonReading sermon={sermon} /></AppShell>
}
