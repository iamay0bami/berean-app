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
  async function attempt(email: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }
  if (EMAIL_PATTERN.test(value)) {
    return { error: signInError(await attempt(value)) }
  }
  const { data: email } = await createServiceClient().rpc('resolve_username_email', { p_username: value })
  if (email && typeof email === 'string') {
    return { error: signInError(await attempt(email)) }
  }
  // Timing-normalization fallback for an unresolvable username: burn one
  // throwaway sign-in attempt. GoTrue's unknown-email path returns without a
  // bcrypt compare, so this equalizes request-level timing but NOT bcrypt
  // cost; a fully equal approach would require a server-side hash burn.
  await attempt(DUMMY_RESOLUTION_EMAIL)
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
  track: 'foundations' | 'deeper'; section_label: string; quote: string; reference: string; paragraphs: string[]; margin_note: string
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

export async function assignUserRole(userId: string, role: 'member' | 'class_leader' | 'admin', classId?: string) {
  const { supabase } = await userClient()
  const { error } = await supabase.rpc('assign_user_role', { target_user_id: userId, new_role: role, new_class_id: classId ?? null })
  if (error) throw error
}
