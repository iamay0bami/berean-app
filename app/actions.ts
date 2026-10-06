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

export type LessonInput = {
  id: string; class_id: string; week: string; number: string; title: string; excerpt: string; duration: string
  section_label: string; quote: string; reference: string; paragraphs: string[]; margin_note: string
}

export async function createLesson(input: LessonInput) {
  const { supabase, user } = await userClient()
  const { error } = await supabase.from('lessons').insert({ ...input, created_by: user.id, status: 'draft' })
  if (error) throw error
  revalidatePath('/classes')
}

export async function updateLesson(id: string, input: Partial<Omit<LessonInput, 'id'>>) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('lessons').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  revalidatePath(`/classes/${id}`)
}

export async function publishLesson(id: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('lessons').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  revalidatePath('/classes')
}

export async function upsertQuestion(question: { id: string; lesson_id: string; text: string; sort_order?: number }) {
  const { supabase } = await userClient()
  const { error } = await supabase.from('questions').upsert(question)
  if (error) throw error
  revalidatePath(`/classes/${question.lesson_id}`)
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

const CLASS_SLUG_FALLBACK = 'class'

// JS twin of handle_new_user()'s `regexp_replace(lower(org_name), '[^a-z0-9]+', '-', 'g')`.
function classSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || CLASS_SLUG_FALLBACK
}

function randomSuffix() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 6)
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
    const baseSlug = classSlug(trimmed)
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
    return { error: null }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Unable to remove this member.' }
  }
}
