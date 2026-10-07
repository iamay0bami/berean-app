import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import ClassManageView from '@/components/class-manage-view'
import { EmptyState } from '@/components/empty-state'
import { Header } from '@/components/shared'
import { getClassCandidates, getClassMembers, getCurrentRole, getMyLedClass } from '@/lib/mock-data'

// Strictly class_leader, unlike /admin/classes which is strictly admin. An admin reaching
// here gets "Not permitted" rather than a second copy of the admin page.
export default async function ClassManagePage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/classes/manage')
  if (role !== 'class_leader') return <AppShell><div className="page-wrap"><Header /><main><EmptyState eyebrow="CLASS MANAGEMENT" title="Not permitted" body="You do not have permission to manage a class." /></main></div></AppShell>

  // get_my_led_class() (0009) is the only read path that can see a deactivated class, so
  // 'inactive' is a real state here and not something the classes table could report.
  const led = await getMyLedClass()
  if (led.status !== 'ready') return <AppShell><div className="page-wrap"><Header /><main>
    {led.status === 'inactive'
      ? <EmptyState eyebrow="CLASS MANAGEMENT" title="Class inactive" body={`${led.name} has been deactivated. An administrator needs to reactivate it before you can manage its members.`} />
      : <EmptyState eyebrow="CLASS MANAGEMENT" title="No class assigned" body="An administrator has not assigned you to lead a class yet." />}
  </main></div></AppShell>

  const [roster, candidates] = await Promise.all([getClassMembers(led.class.id), getClassCandidates(led.class.id)])
  return <AppShell><ClassManageView ledClass={led.class} roster={roster} candidates={candidates} /></AppShell>
}
