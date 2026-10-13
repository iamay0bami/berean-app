import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import AuthorLessonsView from '@/components/author-lessons-view'
import { EmptyState } from '@/components/empty-state'
import { Header } from '@/components/shared'
import { getAdminClasses, getAuthorLessons, getCurrentRole, getMyLedClass } from '@/lib/mock-data'

// /author/ rather than /admin/ (admin-only) or /classes/manage (leader-only) because this
// one page serves both roles behind a single gate. Gating is copied from
// app/classes/manage/page.tsx, the closest existing page.
export default async function AuthorLessonsPage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/author/lessons')
  if (role !== 'admin' && role !== 'class_leader') return <AppShell><div className="page-wrap"><Header /><main><EmptyState eyebrow="LESSON AUTHORING" title="Not permitted" body="You do not have permission to write lessons." /></main></div></AppShell>

  // get_my_led_class() (0009) is the only read path that can see a deactivated class, so
  // 'inactive' is a real state here and not something the classes table could report.
  const led = role === 'class_leader' ? await getMyLedClass() : null
  if (led && led.status !== 'ready') return <AppShell><div className="page-wrap"><Header /><main>
    {led.status === 'inactive'
      ? <EmptyState eyebrow="LESSON AUTHORING" title="Class inactive" body={`${led.name} has been deactivated. An administrator needs to reactivate it before you can write its lessons.`} />
      : <EmptyState eyebrow="LESSON AUTHORING" title="No class assigned" body="An administrator has not assigned you to lead a class yet." />}
  </main></div></AppShell>
  const ledClass = led && led.status === 'ready' ? led.class : null

  // A leader's list is scoped in the query and never left to RLS. class_memberships carries
  // no role restriction, so a leader can also be a plain member of another class, and
  // lessons_member_read would then hand back that class's published lessons as though the
  // leader could author them.
  const lessons = await getAuthorLessons(ledClass?.id)
  // getAdminClasses() rather than getActiveClasses(): getAuthorLessons() can include a
  // deactivated class's lessons, and the grouping below needs a name for that class.
  const classes = role === 'admin' ? await getAdminClasses() : ledClass ? [ledClass] : []
  return <AppShell><AuthorLessonsView lessons={lessons} classes={classes} /></AppShell>
}
