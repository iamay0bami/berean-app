'use client'

import { ChevronRight } from 'lucide-react'
import { FormEvent, useState, useTransition } from 'react'
import { activateClass, assignClassMember, createClass, deactivateClass, deleteClass, removeClassMember, updateClass } from '@/app/actions'
import AdminNav from '@/components/admin-nav'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'
import type { AdminClass, AdminMember, ClassLeader, ClassMember } from '@/lib/types'

type Draft = { name: string; description: string }

// Class ids are slugs derived from the name, so a class literally named "Create" would slug to
// "create" and collide with the create form's own pending/error key. Namespace the two.
function classKey(id: string) {
  return `class:${id}`
}

// Delete gets its own key rather than reusing classKey(id), which every other action on a card
// shares (save, activate, add member, remove member). Sharing it would make the Delete button
// read "Deleting..." whenever an unrelated mutation on the same card was in flight.
function deleteKey(id: string) {
  return `delete:${id}`
}

// Same fallback chain admin-members-view uses: a profile may be missing a name, and a
// nameless <option> would be unusable.
function memberLabel(member: AdminMember) {
  return member.name || member.email || (member.username ? `@${member.username}` : 'Unnamed member')
}

export default function AdminClassesView({ classes, rosters, members, leaders }: { classes: AdminClass[]; rosters: Record<string, ClassMember[]>; members: AdminMember[]; leaders: ClassLeader[] }) {
  // More than one class_leader profile may point at the same class, so collect names.
  const leaderNames = new Map<string, string[]>()
  leaders.forEach(leader => leaderNames.set(leader.class_id, [...(leaderNames.get(leader.class_id) ?? []), leader.leader_name]))
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(classes.map(item => [item.id, { name: item.name, description: item.description ?? '' }])))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createDraft, setCreateDraft] = useState<Draft>({ name: '', description: '' })
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [isPending, startTransition] = useTransition()

  function setError(key: string, message: string | null) {
    setErrors(current => ({ ...current, [key]: message }))
  }

  // Both the class list and every roster are fetched on the server, so a successful mutation
  // reloads rather than trying to patch local state — the same approach admin-members-view takes.
  function run(key: string, action: () => Promise<{ error: string | null }>) {
    setError(key, null)
    setPendingKey(key)
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setError(key, result.error)
        setPendingKey(null)
        return
      }
      window.location.reload()
    })
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    run('create', () => createClass(createDraft.name, createDraft.description))
  }

  function saveClass(item: AdminClass) {
    const draft = drafts[item.id]
    run(classKey(item.id), () => updateClass(item.id, draft.name, draft.description))
  }

  function toggleActive(item: AdminClass) {
    // Only deactivation is destructive: it hides the class and its lessons from every member.
    if (item.active && !window.confirm(`Deactivate ${item.name}? Members will no longer see it or its lessons.`)) return
    run(classKey(item.id), () => (item.active ? deactivateClass(item.id) : activateClass(item.id)))
  }

  function addMember(item: AdminClass) {
    const userId = selected[item.id]
    if (!userId) return
    run(classKey(item.id), () => assignClassMember(userId, item.id))
  }

  function removeMember(item: AdminClass, member: ClassMember) {
    if (!window.confirm(`Remove ${member.name || 'this member'} from ${item.name}?`)) return
    run(classKey(item.id), () => removeClassMember(member.id, item.id))
  }

  // Named removeClass rather than deleteClass so it does not shadow the imported action, the way
  // toggleActive wraps activateClass/deactivateClass without taking either name.
  //
  // The count comes from the roster the page already fetched — no new query — and it is a real
  // consequence rather than a warning about nothing: class_memberships.class_id is ON DELETE
  // CASCADE (0008), so those rows go with the class.
  function removeClass(item: AdminClass) {
    const size = (rosters[item.id] ?? []).length
    const members = size === 1 ? '1 member will be removed from it' : `${size} members will be removed from it`
    if (!window.confirm(`Delete ${item.name}? ${size ? `${members}.` : 'It has no members.'} This can't be undone.`)) return
    run(deleteKey(item.id), () => deleteClass(item.id))
  }

  return <div className="page-wrap"><Header /><main><section className="page-intro"><AdminNav /><Meta>ADMINISTRATION</Meta><h1>Classes</h1><p>Create classes, keep their details current, and manage who belongs to each one.</p></section>

    <form className="paper-card class-form" onSubmit={submitCreate}>
      <Meta>NEW CLASS</Meta>
      <label className="member-control"><Meta>Name</Meta><input required value={createDraft.name} onChange={event => setCreateDraft(current => ({ ...current, name: event.target.value }))} /></label>
      <label className="member-control"><Meta>Description</Meta><textarea value={createDraft.description} onChange={event => setCreateDraft(current => ({ ...current, description: event.target.value }))} /></label>
      <div className="class-form-actions"><button className="primary-button" type="submit" disabled={isPending}>{pendingKey === 'create' ? 'Creating...' : 'Create class'}</button></div>
      {errors.create && <p className="field-message error" role="status">{errors.create}</p>}
    </form>

    {classes.length ? <section className="member-list">{classes.map(item => {
      const roster = rosters[item.id] ?? []
      const rosterIds = new Set(roster.map(member => member.id))
      const candidates = members.filter(member => !rosterIds.has(member.id))
      const expanded = expandedId === item.id
      const draft = drafts[item.id]
      const key = classKey(item.id)
      const leadersForClass = leaderNames.get(item.id)
      // Why this class cannot be deleted, or null when it can. Lessons win over a leader: that is
      // the blocker the database itself enforces (lessons.class_id is ON DELETE RESTRICT), and a
      // leader is cleared in one step on /admin/members, so it is the less fundamental of the two.
      const blocked = item.lessonCount > 0
        ? `Has ${item.lessonCount} ${item.lessonCount === 1 ? 'lesson' : 'lessons'}. Deactivate instead.`
        : leadersForClass?.length ? 'Reassign its leader first.' : null
      // Read once into a const so it narrows the same way `errors[key]` does below.
      const deleteError = errors[deleteKey(item.id)]
      return <article className="paper-card member-card" key={item.id}>
        <div className="member-card-head"><h2>{item.name}</h2><span className={`status-badge ${item.active ? 'active' : 'inactive'}`}>{item.active ? 'Active' : 'Inactive'}</span></div>

        {leadersForClass?.length ? <Meta>Led by {leadersForClass.join(', ')}</Meta> : null}

        {editingId === item.id
          ? <><label className="member-control"><Meta>Name</Meta><input value={draft.name} onChange={event => setDrafts(current => ({ ...current, [item.id]: { ...current[item.id], name: event.target.value } }))} /></label><label className="member-control"><Meta>Description</Meta><textarea value={draft.description} onChange={event => setDrafts(current => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} /></label></>
          : item.description && <p className="class-description">{item.description}</p>}

        <div className="member-controls">
          {editingId === item.id
            ? <><button className="primary-button" disabled={isPending} onClick={() => saveClass(item)}>{pendingKey === key ? 'Saving...' : 'Save'}</button><button className="outline-button" onClick={() => { setEditingId(null); setDrafts(current => ({ ...current, [item.id]: { name: item.name, description: item.description ?? '' } })) }}>Cancel</button></>
            : <><button className="outline-button" onClick={() => setEditingId(item.id)}>Edit</button><button className="outline-button" onClick={() => toggleActive(item)}>{item.active ? 'Deactivate' : 'Activate'}</button></>}
          <button className="text-action roster-toggle" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : item.id)}>{roster.length === 1 ? '1 member' : `${roster.length} members`}<ChevronRight className={expanded ? 'rotate-180' : ''} size={16} /></button>
          {/* Last in the row on purpose: a destructive button should not sit directly beside Edit.
              Rendered outside the editingId ternary so it is present in both modes — deleting is
              not an edit, and burying it behind Cancel would be worse. */}
          <button className="danger-button" disabled={isPending || blocked !== null} onClick={() => removeClass(item)}>{pendingKey === deleteKey(item.id) ? 'Deleting...' : 'Delete'}</button>
        </div>

        {/* Visible text, not a title on the disabled button: a disabled button is not focusable,
            so an attached description would never be announced, and a tooltip is unreachable on
            touch. Uses the same muted note class as the rest of this card. */}
        {blocked && <p className="auth-note">{blocked}</p>}

        {expanded && <div className="class-roster">
          {roster.length
            ? <ul className="roster-list">{roster.map(member => <li className="roster-item" key={member.id}><span className="avatar">{member.initials}</span><strong>{member.name || 'Unnamed member'}</strong><button className="text-action" disabled={isPending} onClick={() => removeMember(item, member)}>Remove</button></li>)}</ul>
            : <p className="auth-note">No one is in this class yet.</p>}

          {!item.active
            ? <p className="auth-note">Reactivate this class to add members.</p>
            : candidates.length
              ? <div className="member-controls"><label className="member-control"><Meta>Add member</Meta><select aria-label={`Member to add to ${item.name}`} value={selected[item.id] ?? ''} onChange={event => setSelected(current => ({ ...current, [item.id]: event.target.value }))}><option value="">Select a member</option>{candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{memberLabel(candidate)}</option>)}</select></label><button className="primary-button" disabled={isPending || !selected[item.id]} onClick={() => addMember(item)}>Add</button></div>
              : <p className="auth-note">Everyone in the organization is already in this class.</p>}
        </div>}

        {errors[key] && <p className="field-message error" role="status">{errors[key]}</p>}
        {/* Delete holds a separate key, so its refusal needs its own slot — without this the
            action's message would be set and never shown. Stale text cannot linger: a successful
            action on this card reloads the page, which drops all of this state. */}
        {deleteError && <p className="field-message error" role="status">{deleteError}</p>}
      </article>
    })}</section>
      : <EmptyState eyebrow="CLASSES" title="No classes yet" body="Create the first class above and it will appear here." />}
  </main></div>
}
