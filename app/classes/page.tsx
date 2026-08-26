import AppShell from '@/components/app-shell'
import ClassesView from '@/components/classes-view'
import { getLessons } from '@/lib/mock-data'

export default async function ClassesPage() {
  const lessons = await getLessons()
  return <AppShell><ClassesView lessons={lessons} /></AppShell>
}
