import { notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ClassDetailView from '@/components/class-detail-view'
import { getClassDetail } from '@/lib/mock-data'

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params
  const classDetail = await getClassDetail(classId)
  if (!classDetail) notFound()

  return (
    <AppShell>
      <ClassDetailView classDetail={classDetail} />
    </AppShell>
  )
}
