import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import AdminInviteView from '@/components/admin-invite-view'
import { EmptyState } from '@/components/empty-state'
import { Header } from '@/components/shared'
import { getCurrentRole, getOrgInviteCode } from '@/lib/mock-data'

export default async function AdminInvitePage() {
  const role = await getCurrentRole()
  if (role === null) redirect('/auth/sign-in?next=/admin/invite')
  if (role !== 'admin') return <AppShell><div className="page-wrap"><Header /><main><EmptyState eyebrow="ADMINISTRATION" title="Not permitted" body="You do not have permission to manage invite codes." /></main></div></AppShell>
  const initialCode = await getOrgInviteCode()
  return <AppShell><AdminInviteView initialCode={initialCode} /></AppShell>
}
