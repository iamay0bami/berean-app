'use client'

import { useState, useTransition } from 'react'
import { assignClassMember, removeClassMember } from '@/app/actions'
import { Header, Meta } from '@/components/shared'
import type { ActiveClass, ClassMember } from '@/lib/types'

// get_class_candidates()/get_class_members() return (id, name, initials) only, so unlike
// admin-members-view there is no email/username to fall back to — same fallback the admin
// roster uses for a nameless profile.
function memberLabel(member: ClassMember) {
  return member.name || 'Unnamed member'
}

// The single-class case of admin-classes-view: one active class, its roster, and the
// add-member control. No create, edit, or activate/deactivate — those stay admin-only.
// `ledClass` rather than `class`, which is a reserved word.
export default function ClassManageView({ ledClass, roster, candidates }: { ledClass: ActiveClass; roster: ClassMember[]; candidates: ClassMember[] }) {
  const [selectedId, setSelectedId] = useState('')
  const [pendingKey, setPendingKey] = useState<'add' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Roster and candidates are both fetched on the server, so a successful mutation reloads
  // rather than trying to patch local state — the approach admin-classes-view takes.
  function run(key: 'add' | 'remove', action: () => Promise<{ error: string | null }>) {
    setError(null)
    setPendingKey(key)
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setError(result.error)
        setPendingKey(null)
        return
      }
      window.location.reload()
    })
  }

  function addMember() {
    if (!selectedId) return
    run('add', () => assignClassMember(selectedId, ledClass.id))
  }

  function removeMember(member: ClassMember) {
    if (!window.confirm(`Remove ${memberLabel(member)} from ${ledClass.name}?`)) return
    run('remove', () => removeClassMember(member.id, ledClass.id))
  }

  return <div className="page-wrap"><Header /><main>
    <section className="page-intro"><Meta>CLASS MANAGEMENT</Meta><h1>{ledClass.name}</h1>{ledClass.description && <p>{ledClass.description}</p>}</section>

    <article className="paper-card member-card">
      <div className="member-card-head"><h2>Roster</h2><Meta>{roster.length === 1 ? '1 MEMBER' : `${roster.length} MEMBERS`}</Meta></div>

      <div className="class-roster">
        {roster.length
          ? <ul className="roster-list">{roster.map(member => <li className="roster-item" key={member.id}><span className="avatar">{member.initials}</span><strong>{memberLabel(member)}</strong><button className="text-action" disabled={isPending} onClick={() => removeMember(member)}>Remove</button></li>)}</ul>
          : <p className="auth-note">No one is in this class yet.</p>}

        {candidates.length
          ? <div className="member-controls"><label className="member-control"><Meta>Add member</Meta><select aria-label={`Member to add to ${ledClass.name}`} value={selectedId} onChange={event => setSelectedId(event.target.value)}><option value="">Select a member</option>{candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{memberLabel(candidate)}</option>)}</select></label><button className="primary-button" disabled={isPending || !selectedId} onClick={addMember}>{pendingKey === 'add' ? 'Adding...' : 'Add'}</button></div>
          : <p className="auth-note">Everyone in the organization is already in this class.</p>}
      </div>

      {error && <p className="field-message error" role="status">{error}</p>}
    </article>
  </main></div>
}
