import { notFound, redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { EmptyState } from '@/components/empty-state'
import LessonForm from '@/components/lesson-form'
import { Header } from '@/components/shared'
import { getAdminClasses, getCurrentRole, getLessonForEdit, getMyLedClass } from '@/lib/mock-data'

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = await getCurrentRole()
  if (role === null) redirect(`/auth/sign-in?next=/author/lessons/${id}`)
  if (role !== 'admin' && role !== 'class_leader') return <AppShell><div className="page-wrap"><Header /><main><EmptyState title="Not permitted" body="You do not have permission to write lessons." /></main></div></AppShell>

  const led = role === 'class_leader' ? await getMyLedClass() : null
  if (led && led.status !== 'ready') return <AppShell><div className="page-wrap"><Header /><main>
    {led.status === 'inactive'
      ? <EmptyState title="Class inactive" body={`${led.name} has been deactivated. An administrator needs to reactivate it before you can write its lessons.`} />
      : <EmptyState title="No class assigned" body="An administrator has not assigned you to lead a class yet." />}
  </main></div></AppShell>
  const ledClass = led && led.status === 'ready' ? led.class : null

  // Two checks, because RLS catches only one of the two failure modes.
  const lesson = await getLessonForEdit(id)
  if (!lesson) notFound()
  // RLS hid nothing here. class_memberships carries no role restriction, so a leader can
  // also be a plain member of another class, and lessons_member_read then admits them to
  // that class's PUBLISHED lessons — the read succeeds for a lesson whose Save could never
  // land. 404 rather than "Not permitted": the lesson is not theirs to know about, and it
  // keeps this consistent with the cross-class draft the read above already hides.
  if (ledClass && lesson.class_id !== ledClass.id) notFound()

  // getAdminClasses() rather than getActiveClasses(): a lesson's class may be deactivated,
  // and a <select> whose value matches no <option> silently falls back to its first entry —
  // which would move the lesson to another class on the next save.
  const classes = role === 'admin' ? await getAdminClasses() : []
  const classOptions = classes
    .filter(item => item.active || item.id === lesson.class_id)
    .map(item => ({ id: item.id, name: item.active ? item.name : `${item.name} (inactive)`, description: item.description }))

  return <AppShell><LessonForm lesson={lesson} classOptions={classOptions} fixedClass={ledClass} /></AppShell>
}
