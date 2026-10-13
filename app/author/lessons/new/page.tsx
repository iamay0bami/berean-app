import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { EmptyState } from '@/components/empty-state'
import LessonForm from '@/components/lesson-form'
import { Header } from '@/components/shared'
import { getActiveClasses, getCurrentRole, getMyLedClass } from '@/lib/mock-data'

export default async function NewLessonPage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/author/lessons/new')
  if (role !== 'admin' && role !== 'class_leader') return <AppShell><div className="page-wrap"><Header /><main><EmptyState eyebrow="LESSON AUTHORING" title="Not permitted" body="You do not have permission to write lessons." /></main></div></AppShell>

  const led = role === 'class_leader' ? await getMyLedClass() : null
  if (led && led.status !== 'ready') return <AppShell><div className="page-wrap"><Header /><main>
    {led.status === 'inactive'
      ? <EmptyState eyebrow="LESSON AUTHORING" title="Class inactive" body={`${led.name} has been deactivated. An administrator needs to reactivate it before you can write its lessons.`} />
      : <EmptyState eyebrow="LESSON AUTHORING" title="No class assigned" body="An administrator has not assigned you to lead a class yet." />}
  </main></div></AppShell>
  const ledClass = led && led.status === 'ready' ? led.class : null

  const classes = role === 'admin' ? await getActiveClasses() : []
  // Without this the admin gets a form whose class <select> has no <option>s, so its own
  // required-class validation can never be satisfied. /admin/classes is where a class is
  // both created and reactivated, so the wording covers either reason the list is empty.
  if (role === 'admin' && !classes.length) return <AppShell><div className="page-wrap"><Header /><main>
    <EmptyState eyebrow="LESSON AUTHORING" title="No active classes" body="Create a class, or activate one, in Classes, before writing a lesson." />
    <Link className="primary-button" href="/admin/classes">Go to Classes</Link>
  </main></div></AppShell>

  // A leader's class is fixed: the form shows it read-only and sends it unchanged.
  return <AppShell><LessonForm lesson={null} classOptions={classes} fixedClass={ledClass} /></AppShell>
}
