import AppShell from '@/components/app-shell'
import ClassesView from '@/components/classes-view'
import { getClassCatalog, getCurrentRole, getReadableLessonSummaries } from '@/lib/mock-data'

export default async function ClassesPage() {
  const [catalog, lessons, role] = await Promise.all([
    getClassCatalog(),
    getReadableLessonSummaries(),
    getCurrentRole(),
  ])
  const myClasses = catalog.filter(item => item.isMine)
  const otherClasses = catalog.filter(item => !item.isMine)

  // Role changes empty-state copy only; the readers own class/lesson eligibility.
  return <AppShell><ClassesView lessons={lessons} myClasses={myClasses} otherClasses={otherClasses} role={role} /></AppShell>
}
