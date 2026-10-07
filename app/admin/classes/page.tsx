import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import AdminClassesView from '@/components/admin-classes-view'
import { EmptyState } from '@/components/empty-state'
import { Header } from '@/components/shared'
import { getAdminClasses, getAdminMembers, getClassLeaders, getClassMembers, getCurrentRole } from '@/lib/mock-data'
import type { ClassMember } from '@/lib/types'

export default async function AdminClassesPage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/admin/classes')
  if (role !== 'admin') return <AppShell><div className="page-wrap"><Header /><main><EmptyState eyebrow="ADMINISTRATION" title="Not permitted" body="You do not have permission to manage classes." /></main></div></AppShell>
  // Rosters are fetched for every class up front so the client can compute "members not in this
  // class" from a plain array difference — one RPC per class, fine at this scale.
  const [classes, members, leaders] = await Promise.all([getAdminClasses(), getAdminMembers(), getClassLeaders()])
  const rosterLists = await Promise.all(classes.map(item => getClassMembers(item.id)))
  const rosters: Record<string, ClassMember[]> = Object.fromEntries(classes.map((item, index) => [item.id, rosterLists[index]] as const))
  return <AppShell><AdminClassesView classes={classes} rosters={rosters} members={members} leaders={leaders} /></AppShell>
}
