'use client'

import { ChevronRight } from 'lucide-react'
import { FormEvent, useState, useTransition } from 'react'
import { activateClass, assignClassMember, createClass, deactivateClass, removeClassMember, updateClass } from '@/app/actions'
import AdminNav from '@/components/admin-nav'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'
import type { AdminClass, AdminMember, ClassMember } from '@/lib/types'

type Draft = { name: string; description: string }

// Class ids are slugs derived from the name, so a class literally named "Create" would slug to
// "create" and collide with the create form's own pending/error key. Namespace the two.
function classKey(id: string) {
  return `class:${id}`
}

// Same fallback chain admin-members-view uses: a profile may be missing a name, and a
// nameless <option> would be unusable.
function memberLabel(member: AdminMember) {
  return member.name || member.email || (member.username ? `@${member.username}` : 'Unnamed member')
}

export default function AdminClassesView({ classes, rosters, members }: { classes: AdminClass[]; rosters: Record<string, ClassMember[]>; members: AdminMember[] }) {
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
      return <article className="paper-card member-card" key={item.id}>
        <div className="member-card-head"><h2>{item.name}</h2><span className={`status-badge ${item.active ? 'active' : 'inactive'}`}>{item.active ? 'Active' : 'Inactive'}</span></div>

        {editingId === item.id
          ? <><label className="member-control"><Meta>Name</Meta><input value={draft.name} onChange={event => setDrafts(current => ({ ...current, [item.id]: { ...current[item.id], name: event.target.value } }))} /></label><label className="member-control"><Meta>Description</Meta><textarea value={draft.description} onChange={event => setDrafts(current => ({ ...current, [item.id]: { ...current[item.id], description: event.target.value } }))} /></label></>
          : item.description && <p className="class-description">{item.description}</p>}

        <div className="member-controls">
          {editingId === item.id
            ? <><button className="primary-button" disabled={isPending} onClick={() => saveClass(item)}>{pendingKey === key ? 'Saving...' : 'Save'}</button><button className="outline-button" onClick={() => { setEditingId(null); setDrafts(current => ({ ...current, [item.id]: { name: item.name, description: item.description ?? '' } })) }}>Cancel</button></>
            : <><button className="outline-button" onClick={() => setEditingId(item.id)}>Edit</button><button className="outline-button" onClick={() => toggleActive(item)}>{item.active ? 'Deactivate' : 'Activate'}</button></>}
          <button className="text-action roster-toggle" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : item.id)}>{roster.length === 1 ? '1 member' : `${roster.length} members`}<ChevronRight className={expanded ? 'rotate-180' : ''} size={16} /></button>
        </div>

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
      </article>
    })}</section>
      : <EmptyState eyebrow="CLASSES" title="No classes yet" body="Create the first class above and it will appear here." />}
  </main></div>
}
