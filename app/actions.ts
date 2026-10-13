'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const GENERIC_SIGN_IN_ERROR = 'Invalid email/username or password'
const CONFIRM_EMAIL_ERROR = 'Please confirm your email before signing in — check your inbox.'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DUMMY_RESOLUTION_EMAIL = 'no-such-account@example.com'

function signInError(error: { message?: string; code?: string } | null) {
  if (error) {
    // GoTrue validates the password BEFORE the confirmation check, so this
    // error can only surface to someone who already knows the correct
    // password — showing a distinct message does not create an oracle.
    if (error.code === 'email_not_confirmed' || error.message?.includes('Email not confirmed')) return CONFIRM_EMAIL_ERROR
    return GENERIC_SIGN_IN_ERROR
  }
  return null
}

export async function signInWithIdentifier(identifier: string, password: string): Promise<{ error: string | null }> {
  const value = identifier.trim()
  if (!value || !password) return { error: GENERIC_SIGN_IN_ERROR }
  // Every signInWithPassword below MUST use this cookie-bound SSR client —
  // it is the only one whose cookie store persists the session across the
  // server action. The service-role client is used ONLY for the
  // resolve_username_email lookup and never signs a user in.
  const supabase = await createClient()
  console.error(`[signInDebug] enter identifier=${JSON.stringify(value)} passwordLength=${password?.length ?? 0}`)
  async function attempt(email: string, branch: 'email' | 'username' | 'dummy') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.error(`[signInDebug] branch=${branch} email=${JSON.stringify(email)} lowerMatch=${JSON.stringify(value.toLowerCase() === email.toLowerCase())} error=`, error ? { message: error.message, code: error.code, status: error.status, name: error.name } : null)
    return error
  }
  if (EMAIL_PATTERN.test(value)) {
    return { error: signInError(await attempt(value, 'email')) }
  }
  const rpc = await createServiceClient().rpc('resolve_username_email', { p_username: value })
  console.error(`[signInDebug] rpc identifier=${JSON.stringify(value)} data=${JSON.stringify(rpc.data)} error=`, rpc.error ? { message: rpc.error.message, code: rpc.error.code } : null)
  const { data: email } = rpc
  if (email && typeof email === 'string') {
    return { error: signInError(await attempt(email, 'username')) }
  }
  // Timing-normalization fallback for an unresolvable username: burn one
  // throwaway sign-in attempt. GoTrue's unknown-email path returns without a
  // bcrypt compare, so this equalizes request-level timing but NOT bcrypt
  // cost; a fully equal approach would require a server-side hash burn.
  await attempt(DUMMY_RESOLUTION_EMAIL, 'dummy')
  return { error: GENERIC_SIGN_IN_ERROR }
}

async function userClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')
  return { supabase, user }
}

function requireText(value: string) {
  const text = value.trim()
  if (!text) throw new Error('Text is required')
  return text
}

export async function createInsight(lessonId: string, text: string, questionId?: string) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('insights').insert({ lesson_id: lessonId, question_id: questionId ?? null, author_id: user.id, text: requireText(text) })
  if (error) throw error
  revalidatePath(`/classes/${lessonId}`)
}

export async function updateInsight(id: string, text: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('insights').update({ text: requireText(text), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteInsight(id: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('insights').delete().eq('id', id)
  if (error) throw error
}

export async function createDiscussion(text: string, topicId?: string) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('discussions').insert({ author_id: user.id, topic_id: topicId ?? null, text: requireText(text) })
  if (error) throw error
  revalidatePath('/discuss')
}

export async function updateDiscussion(id: string, text: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('discussions').update({ text: requireText(text), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteDiscussion(id: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('discussions').delete().eq('id', id)
  if (error) throw error
}

export async function createDiscussionReply(discussionId: string, text: string) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('discussion_replies').insert({ discussion_id: discussionId, author_id: user.id, text: requireText(text) })
  if (error) throw error
  revalidatePath('/discuss')
}

export async function updateDiscussionReply(id: string, text: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('discussion_replies').update({ text: requireText(text), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteDiscussionReply(id: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('discussion_replies').delete().eq('id', id)
  if (error) throw error
}

export async function createPrayerPoint(text: string) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('prayer_points').insert({ author_id: user.id, text: requireText(text), status: 'draft' })
  if (error) throw error
  revalidatePath('/sermons')
}

export async function confirmPrayer(prayerPointId: string) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('prayer_confirmations').upsert({ prayer_point_id: prayerPointId, user_id: user.id })
  if (error) throw error
  revalidatePath('/sermons')
}

export async function removePrayerConfirmation(prayerPointId: string) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('prayer_confirmations').delete().eq('prayer_point_id', prayerPointId).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/sermons')
}

export async function updateMyProfile(name: string, initials: string, tagline: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.rpc('update_my_profile', { new_name: requireText(name), new_initials: requireText(initials), new_tagline: tagline.trim() })
  if (error) throw error
  revalidatePath('/profile')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

const CLASS_SLUG_FALLBACK = 'class'
const LESSON_SLUG_FALLBACK = 'lesson'

// An UPDATE or DELETE filtered out by RLS returns NO error and affects zero rows —
// PostgREST reports the silence as success. Every lesson write therefore chains
// .select('id') and checks the row count, or a caller who can read a lesson but not
// write it would see "Saved" while nothing changed. Do not remove these guards.
const WRITE_DENIED = "You can't change this lesson."
const WRITE_DENIED_QUESTIONS = "You can't change this lesson's questions."

// Static routes that sit beside a dynamic segment, so a slug equal to one of them would
// be shadowed by the static page and become unreachable:
//   manage -> /classes/manage         (the leader's class page, not the lesson)
//   new    -> /author/lessons/new     (the create form, so the lesson could never be edited)
// Lesson ids come from author-typed titles, so this is reachable by typing "Manage" or
// "New". Add an entry here whenever a new static route appears beside a dynamic one.
const RESERVED_SLUGS = new Set(['new', 'manage'])

// JS twin of handle_new_user()'s `regexp_replace(lower(org_name), '[^a-z0-9]+', '-', 'g')`.
function slugify(value: string, fallback: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback
}

function randomSuffix() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 6)
}

// Every lesson write refreshes the authoring list, the member-facing routes, and /home —
// getHomeData() features lessons[0], so publishing can change what the home page shows.
function revalidateLessonPaths(id: string) {
  revalidatePath('/author/lessons')
  revalidatePath(`/author/lessons/${id}`)
  revalidatePath('/classes')
  revalidatePath(`/classes/${id}`)
  revalidatePath('/home')
}

export type LessonInput = {
  class_id: string; week: string; number: string; title: string; excerpt: string; duration: string
  section_label: string; quote: string; reference: string; paragraphs: string[]; margin_note: string
}

// Shared by createLesson and updateLesson so the two can never drift. updateLesson takes
// the full LessonInput, not a Partial, precisely so this can promise the required fields.
//
// lessons has no nullable text column — excerpt, duration, section_label, quote,
// reference and margin_note are all `not null default ''` (0001) — so a blank optional
// field is stored as '' and there is no null-vs-'' decision to make. That is the
// opposite of classes.description, which is nullable and normalised to null.
function validateLessonInput(input: LessonInput): { error: string } | { error: null; fields: LessonInput } {
  const classId = input.class_id.trim()
  if (!classId) return { error: 'A class is required.' }
  const title = input.title.trim()
  if (!title) return { error: 'A title is required.' }
  const week = input.week.trim()
  if (!week) return { error: 'A week is required.' }
  const number = input.number.trim()
  if (!number) return { error: 'A lesson number is required.' }
  // lessons.number is text and the list orders by it, so anything but digits sorts
  // wrongly and silently ("3a", "#3", "03 "). The form's number input already refuses
  // letters; this guards the action boundary.
  if (!/^\d+$/.test(number)) return { error: 'The lesson number must be digits only.' }
  const paragraphs = input.paragraphs.map(part => part.trim()).filter(Boolean)
  if (!paragraphs.length) return { error: 'At least one paragraph is required.' }
  return {
    error: null,
    fields: {
      class_id: classId,
      week,
      number: number.padStart(2, '0'),
      title,
      excerpt: input.excerpt.trim(),
      duration: input.duration.trim(),
      section_label: input.section_label.trim(),
      quote: input.quote.trim(),
      reference: input.reference.trim(),
      paragraphs,
      margin_note: input.margin_note.trim(),
    },
  }
}

// Lesson ids are slugs of the title, not caller-supplied: lessons.id is a plain text
// primary key with no default, the same shape classes.id already has. The loop ports
// createClass's exactly — on a 23505 collision retry with a random suffix (53 + '-' + 6
// = the same 60-char ceiling), capped at 5 attempts. Ids are unique globally rather than
// per class, so two classes may not both hold a lesson titled "Grace".
//
// created_by is NOT NULL with no default and lessons_leader_insert requires it to equal
// auth.uid(), so the insert must send it. Only 23505 retries, so an RLS denial on INSERT
// (which does raise, unlike UPDATE/DELETE) returns its message instead of being misread
// as a collision.
export async function createLesson(input: LessonInput): Promise<{ error: string | null; id: string | null }> {
  try {
    const checked = validateLessonInput(input)
    if (checked.error !== null) return { error: checked.error, id: null }
    const { supabase, user } = await userClient()
    const baseSlug = slugify(checked.fields.title, LESSON_SLUG_FALLBACK)
    // A reserved slug skips the bare attempt entirely, so "New" is stored as new-a1b2c3
    // rather than being tried as `new` and shadowed by /author/lessons/new.
    let candidate = RESERVED_SLUGS.has(baseSlug) ? `${baseSlug.slice(0, 53)}-${randomSuffix()}` : baseSlug.slice(0, 60)
    for (let attempts = 0; attempts <= 5; attempts++) {
      const { data, error } = await supabase
        .from('lessons')
        .insert({ ...checked.fields, id: candidate, created_by: user.id, status: 'draft' })
        .select('id')
        .maybeSingle()
      if (!error) {
        const id = (data as { id: string } | null)?.id ?? candidate
        revalidateLessonPaths(id)
        return { error: null, id }
      }
      if (error.code !== '23505') return { error: error.message, id: null }
      candidate = `${baseSlug.slice(0, 53)}-${randomSuffix()}`
    }
    return { error: 'Could not create lesson.', id: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to create this lesson.', id: null }
  }
}

// Editable fields only — status is deliberately absent, so "Save draft" can never
// silently unpublish a published lesson. created_by is absent too: protect_creator
// (0001) raises if it changes.
export async function updateLesson(id: string, input: LessonInput): Promise<{ error: string | null }> {
  try {
    const checked = validateLessonInput(input)
    if (checked.error !== null) return { error: checked.error }
    const { supabase } = await userClient()
    const { data, error } = await supabase
      .from('lessons')
      .update({ ...checked.fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
    if (error) return { error: error.message }
    if (!data?.length) return { error: WRITE_DENIED }
    revalidateLessonPaths(id)
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to update this lesson.' }
  }
}

// Status-only. .select('id') is the guard described above: without it a leader who can
// read this lesson but not write it would get error === null and a success message.
async function setLessonStatus(id: string, status: 'draft' | 'published'): Promise<{ error: string | null }> {
  try {
    const { supabase } = await userClient()
    const { data, error } = await supabase
      .from('lessons')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
    if (error) return { error: error.message }
    if (!data?.length) return { error: WRITE_DENIED }
    revalidateLessonPaths(id)
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to update this lesson.' }
  }
}

export async function publishLesson(id: string): Promise<{ error: string | null }> {
  return setLessonStatus(id, 'published')
}

export async function unpublishLesson(id: string): Promise<{ error: string | null }> {
  return setLessonStatus(id, 'draft')
}

// Existing ids are kept, new questions get `${lessonId}-q-${suffix}`, sort_order follows
// array order, and questions absent from the array are deleted.
//
// Upsert first, delete second, returning the first error: a failed upsert must not be
// followed by deletes, or a partial write silently loses questions.
//
// Deleting a question cannot delete an insight — insights.question_id is ON DELETE SET
// NULL (0001), so the insight row survives, still attached to the lesson via lesson_id,
// with question_id nulled. It is orphaned, never destroyed. lesson_id is CASCADE, but
// that only fires on a lesson delete, which this function never performs.
export async function saveLessonQuestions(lessonId: string, questions: { id?: string; text: string }[]): Promise<{ error: string | null }> {
  try {
    const { supabase } = await userClient()
    const { data: existing, error: readError } = await supabase.from('questions').select('id').eq('lesson_id', lessonId)
    if (readError) return { error: readError.message }
    // This read is id bookkeeping only, NOT a permission check: questions_member_read
    // (0006) admits any member to a published lesson's questions, so it succeeds for a
    // caller who can read but cannot write. Write rights are proven by the row counts below.
    const existingIds = new Set(((existing ?? []) as { id: string }[]).map(row => row.id))

    const rows: { id: string; lesson_id: string; text: string; sort_order: number; updated_at: string }[] = []
    const kept = new Set<string>()
    const now = new Date().toISOString()
    for (const question of questions) {
      const text = question.text.trim()
      // questions.text is NOT NULL with no default, and a blank row is not a question.
      if (!text) continue
      // An id we did not just read is treated as new, so an unknown or foreign id becomes
      // a fresh row rather than a cross-lesson move of someone else's question.
      const id = question.id && existingIds.has(question.id) ? question.id : `${lessonId}-q-${randomSuffix()}`
      kept.add(id)
      rows.push({ id, lesson_id: lessonId, text, sort_order: rows.length, updated_at: now })
    }

    if (rows.length) {
      const { data, error } = await supabase.from('questions').upsert(rows).select('id')
      if (error) return { error: error.message }
      if ((data ?? []).length !== rows.length) return { error: WRITE_DENIED_QUESTIONS }
    }

    const removed = [...existingIds].filter(id => !kept.has(id))
    // in() with an empty list is not a valid filter, so an empty removal is skipped.
    if (removed.length) {
      const { data, error } = await supabase.from('questions').delete().eq('lesson_id', lessonId).in('id', removed).select('id')
      if (error) return { error: error.message }
      if ((data ?? []).length !== removed.length) return { error: WRITE_DENIED_QUESTIONS }
    }

    revalidateLessonPaths(lessonId)
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to save these questions.' }
  }
}

export async function createSermon(input: Record<string, unknown>) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('sermons').insert({ ...input, created_by: user.id })
  if (error) throw error
  revalidatePath('/sermons')
}

export async function publishSermon(id: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('sermons').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  revalidatePath('/sermons')
}

export async function publishPrayerPoint(id: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('prayer_points').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  revalidatePath('/sermons')
}

export async function createDiscussionTopic(prompt: string, lessonId?: string, sermonId?: string) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('discussion_topics').insert({ prompt: requireText(prompt), lesson_id: lessonId ?? null, sermon_id: sermonId ?? null, created_by: user.id })
  if (error) throw error
  revalidatePath('/discuss')
}

export async function assignUserRole(userId: string, role: 'member' | 'class_leader' | 'admin', classId?: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await userClient()
    const { error } = await supabase.rpc('assign_user_role', { target_user_id: userId, new_role: role, new_class_id: classId ?? null })
    if (error) return { error: error.message }
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to save this role.' }
  }
}

export async function createOrgInviteCode(): Promise<{ error: string | null; code: string | null }> {
  try {
    const { supabase } = await userClient()
    const { data, error } = await supabase.rpc('create_org_invite_code')
    if (error) return { error: error.message, code: null }
    revalidatePath('/admin/invite')
    return { error: null, code: typeof data === 'string' ? data : null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to generate an invite code.', code: null }
  }
}

// classes.description is nullable with no default, and the member-facing /classes view
// omits the paragraph on null/empty — so collapse whitespace-only input to SQL NULL
// rather than storing an empty string that reads the same but is a different value.
function normalizeDescription(description?: string) {
  const trimmed = description?.trim()
  return trimmed ? trimmed : null
}

// Classes are created by an admin; classes_admin_write (0006) enforces that, and
// classes.organization_id defaults to current_organization_id(). There is no admin UI
// for these yet — they are validated from a signed-in session, so failures are returned
// rather than thrown (Next.js redacts thrown Server Action messages in production).
export async function createClass(name: string, description?: string): Promise<{ error: string | null; id: string | null }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'A class name is required.', id: null }
  try {
    const { supabase } = await userClient()
    const baseSlug = slugify(trimmed, CLASS_SLUG_FALLBACK)
    let candidate = baseSlug.slice(0, 60)
    // Ports handle_new_user()'s org-slug retry loop exactly: on collision, retry with a
    // random suffix (53 + '-' + 6 = the same 60-char ceiling), capped at 5 attempts.
    // Postgres' `on conflict do nothing returning id` has no app-side analogue, so a
    // 23505 unique violation is the retry signal.
    for (let attempts = 0; attempts <= 5; attempts++) {
      const { data, error } = await supabase.from('classes').insert({ id: candidate, name: trimmed, description: normalizeDescription(description) }).select('id').maybeSingle()
      if (!error) {
        revalidatePath('/admin/members')
        revalidatePath('/admin/classes')
        revalidatePath('/classes')
        return { error: null, id: (data as { id: string } | null)?.id ?? candidate }
      }
      if (error.code !== '23505') return { error: error.message, id: null }
      candidate = `${baseSlug.slice(0, 53)}-${randomSuffix()}`
    }
    return { error: 'Could not create class.', id: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to create a class.', id: null }
  }
}

export async function updateClass(id: string, name: string, description?: string): Promise<{ error: string | null }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'A class name is required.' }
  try {
    const { supabase } = await userClient()
    const { error } = await supabase.from('classes').update({ name: trimmed, description: normalizeDescription(description), updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/members')
    revalidatePath('/admin/classes')
    revalidatePath('/classes')
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to update this class.' }
  }
}

// Soft delete: classes.active drives classes_member_read, so deactivating hides the
// class from members while leaving its lessons and memberships intact.
export async function deactivateClass(id: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await userClient()
    const { error } = await supabase.from('classes').update({ active: false, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/members')
    revalidatePath('/admin/classes')
    revalidatePath('/classes')
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to deactivate this class.' }
  }
}

// Undoes deactivateClass. The class was never deleted, so reactivating restores it with its
// lessons and memberships untouched.
export async function activateClass(id: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await userClient()
    const { error } = await supabase.from('classes').update({ active: true, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/members')
    revalidatePath('/admin/classes')
    revalidatePath('/classes')
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to activate this class.' }
  }
}

// Class membership. Both RPCs are SECURITY DEFINER and guard on admin-or-that-class's-leader;
// class_memberships itself is revoked from every role, so these are the only write path.
export async function assignClassMember(userId: string, classId: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await userClient()
    const { error } = await supabase.rpc('assign_class_membership', { target_user_id: userId, target_class_id: classId })
    if (error) return { error: error.message }
    revalidatePath('/admin/classes')
    revalidatePath('/classes/manage')
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to add this member.' }
  }
}

export async function removeClassMember(userId: string, classId: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await userClient()
    const { error } = await supabase.rpc('remove_class_membership', { target_user_id: userId, target_class_id: classId })
    if (error) return { error: error.message }
    revalidatePath('/admin/classes')
    revalidatePath('/classes/manage')
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to remove this member.' }
  }
}
