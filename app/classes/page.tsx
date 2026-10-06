import AppShell from '@/components/app-shell'
import ClassesView from '@/components/classes-view'
import { getActiveClasses, getLessons, getMyClasses } from '@/lib/mock-data'

export default async function ClassesPage() {
  const [lessons, myClasses, activeClasses] = await Promise.all([getLessons(), getMyClasses(), getActiveClasses()])
  const myClassIds = new Set(myClasses.map(item => item.id))
  const otherClasses = activeClasses.filter(item => !myClassIds.has(item.id))
  return <AppShell><ClassesView lessons={lessons} myClasses={myClasses} otherClasses={otherClasses} /></AppShell>
}
