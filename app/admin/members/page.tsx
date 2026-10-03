import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import AdminMembersView from '@/components/admin-members-view'
import { EmptyState } from '@/components/empty-state'
import { Header } from '@/components/shared'
import { getActiveClasses, getAdminMembers, getClassLeaders, getCurrentRole } from '@/lib/mock-data'

export default async function AdminMembersPage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/admin/members')
  if (role !== 'admin') return <AppShell><div className="page-wrap"><Header /><main><EmptyState eyebrow="ADMINISTRATION" title="Not permitted" body="You do not have permission to manage members." /></main></div></AppShell>
  const [members, classes, leaders] = await Promise.all([getAdminMembers(), getActiveClasses(), getClassLeaders()])
  return <AppShell><AdminMembersView members={members} classes={classes} leaders={leaders} /></AppShell>
}
