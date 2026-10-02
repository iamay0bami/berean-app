'use client'

import { useState, useTransition } from 'react'
import { assignUserRole } from '@/app/actions'
import AdminNav from '@/components/admin-nav'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'
import type { ActiveClass, AdminMember, AppRole } from '@/lib/types'

const roles: AppRole[] = ['member', 'class_leader', 'admin']
const roleLabels: Record<AppRole, string> = { member: 'Member', class_leader: 'Class leader', admin: 'Admin' }

type Draft = { role: AppRole; classId: string }

export default function AdminMembersView({ members, classes }: { members: AdminMember[]; classes: ActiveClass[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(members.map(member => [member.id, { role: member.role, classId: member.assigned_class_id ?? '' }])))
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [isPending, startTransition] = useTransition()

  function updateDraft(id: string, update: Partial<Draft>) {
    setDrafts(current => ({ ...current, [id]: { ...current[id], ...update } }))
  }

  function save(member: AdminMember) {
    const draft = drafts[member.id]
    const classId = draft.role === 'class_leader' ? draft.classId || undefined : undefined
    if (!window.confirm(`Change ${member.name || member.email || 'this member'} to ${roleLabels[draft.role]}${classId ? ` for ${classes.find(item => item.id === classId)?.name ?? classId}` : ''}?`)) return
    setErrors(current => ({ ...current, [member.id]: null }))
    setPendingId(member.id)
    startTransition(async () => {
      const result = await assignUserRole(member.id, draft.role, classId)
      if (result.error) {
        setErrors(current => ({ ...current, [member.id]: result.error }))
        setPendingId(null)
        return
      }
      window.location.reload()
    })
  }

  return <div className="page-wrap"><Header /><main><section className="page-intro"><AdminNav /><Meta>ADMINISTRATION</Meta><h1>Members</h1><p>Manage access and class leadership for the Berean community.</p></section>{members.length ? <section className="member-list">{members.map(member => { const draft = drafts[member.id]; return <article className="paper-card member-card" key={member.id}><div className="member-card-head"><h2>{member.name || 'Unnamed member'}</h2><Meta>{roleLabels[member.role]}</Meta></div><div className="member-card-meta"><span className="muted-value">{member.email ?? '—'}</span><span className="muted-value">{member.username ? `@${member.username}` : '—'}</span>{draft.role === 'class_leader' && <span className="muted-value">{classes.find(item => item.id === draft.classId)?.name ?? 'No class selected'}</span>}</div><div className="member-controls"><label className="member-control"><Meta>Role</Meta><select aria-label={`Role for ${member.name || member.email}`} value={draft.role} onChange={event => updateDraft(member.id, { role: event.target.value as AppRole })}>{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>{draft.role === 'class_leader' && <label className="member-control"><Meta>Assigned class</Meta><select aria-label={`Class for ${member.name || member.email}`} value={draft.classId} onChange={event => updateDraft(member.id, { classId: event.target.value })}><option value="">Select a class</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<button className="primary-button" disabled={isPending} onClick={() => save(member)}>{pendingId === member.id ? 'Saving...' : 'Save'}</button></div>{errors[member.id] && <p className="field-message error" role="status">{errors[member.id]}</p>}</article> })}</section> : <EmptyState eyebrow="MEMBERS" title="No members found" body="New accounts will appear here once they have profiles." />}</main></div>
}
