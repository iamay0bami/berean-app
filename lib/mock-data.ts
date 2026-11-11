import { cache } from 'react'
import type { ActiveClass, AdminClass, AdminMember, AppRole, AuthorLesson, ClassCatalogItem, ClassDetail, ClassLeader, ClassLeaderDisplay, ClassMember, ContentStatus, DiscussionData, DiscussionEntry, HomeLessonHighlights, Lesson, LessonEdit, LessonEditQuestion, LessonSummary, LessonThought, PrayerPoint, Profile, ProfileContent, ProfileInsight, ProfilePrayer, Sermon } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import { normalizeHumanText, normalizeHumanTextArray, normalizeOptionalHumanText } from '@/lib/text'

type Display = { id: string; name: string; initials: string }
type AuthorRow = { author_id: string }

function normalizeDisplay(display: Display): Display {
  return {
    ...display,
    name: normalizeHumanText(display.name),
    initials: normalizeHumanText(display.initials),
  }
}

function normalizeActiveClass(row: ActiveClass): ActiveClass {
  return {
    ...row,
    name: normalizeHumanText(row.name),
    description: normalizeOptionalHumanText(row.description),
  }
}

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 3600) return `${Math.floor(seconds / 60) || 1} MIN AGO`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} HOURS AGO`
  return `${Math.floor(seconds / 86400)} DAYS AGO`
}

async function displaysFor(rows: AuthorRow[]) {
  const ids = [...new Set(rows.map(row => row.author_id).filter(Boolean))]
  if (!ids.length) return new Map<string, Display>()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('member_display', { member_ids: ids })
  if (error) throw error
  return new Map((data as Display[]).map(normalizeDisplay).map(display => [display.id, display]))
}

async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function anonymousDisplay(): Display {
  return { id: '', name: 'A member', initials: 'BM' }
}

const DEFAULT_DISCUSSION_PROMPT = 'What has stayed with you this week?'

export type ViewerRole = 'leader' | 'visitor'
export type Viewer = { role: ViewerRole; firstName: string | null }

// The first whitespace-delimited word of profiles.name, or null when the row is
// missing or the name is blank. The 'friend' fallback belongs to the greeting, not here.
function firstNameOf(name: string | null | undefined) {
  return normalizeHumanText(name ?? '').split(/\s+/)[0] || null
}

// Role and first name in one pass. This is the home page's only viewer read — the
// profiles select is the caller's own row, which self+admin-read RLS permits and which
// getProfile() below already does. It rides alongside the current_role RPC rather than
// after it, so the extra column costs no extra round trip.
export async function getViewer(): Promise<Viewer> {
  const { supabase, user } = await getSessionUser()
  if (!user) return { role: 'visitor', firstName: null }
  const [{ data: role, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.rpc('current_role'),
    supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ])
  if (roleError) throw roleError
  if (profileError) throw profileError
  return {
    role: role === 'admin' || role === 'class_leader' ? 'leader' : 'visitor',
    firstName: firstNameOf(profile?.name),
  }
}

export async function getCurrentRole(): Promise<AppRole | null> {
  const { supabase, user } = await getSessionUser()
  if (!user) return null
  const { data, error } = await supabase.rpc('current_role')
  if (error) throw error
  return data as AppRole | null
}

export async function getActiveClasses(): Promise<ActiveClass[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('classes').select('id,name,description').eq('active', true).order('name')
  if (error) throw error
  return ((data ?? []) as ActiveClass[]).map(normalizeActiveClass)
}

// Deliberately separate from getActiveClasses() rather than a widening of it: that function
// feeds the member-facing "Other classes" list and the class-leader dropdown, neither of which
// should ever show a deactivated class. An admin managing classes needs both states, and
// classes_member_read (0006) already allows an admin to select inactive rows — so this is
// purely an app-side filter difference, not a permissions one.
export async function getAdminClasses(): Promise<AdminClass[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('classes').select('id,name,description,active,lessons(count)').order('name')
  if (error) throw error
  // The embed arrives as a one-element array; flatten it so callers get a number rather than a
  // PostgREST shape, the same way getLessonForEdit() turns insights(count) into a count.
  // lessons_leader_read (0006) passes for an admin through is_class_leader_for, so drafts are
  // included — which is what "no lessons of any status" for a delete requires.
  return ((data ?? []) as any[]).map(row => ({
    id: row.id,
    name: normalizeHumanText(row.name),
    description: normalizeOptionalHumanText(row.description),
    active: row.active,
    lessonCount: row.lessons?.[0]?.count ?? 0,
  }))
}

// The caller's own memberships. get_my_classes() (0008) returns (id, name) only — it has
// no description column — so the return type is narrowed rather than claiming a field
// this path cannot supply.
export async function getMyClasses(): Promise<Pick<ActiveClass, 'id' | 'name'>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_classes')
  if (error) throw error
  return ((data ?? []) as Pick<ActiveClass, 'id' | 'name'>[]).map(row => ({
    ...row,
    name: normalizeHumanText(row.name),
  }))
}

export async function getAdminMembers(): Promise<AdminMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_list_members')
  if (error) throw error
  return ((data ?? []) as AdminMember[]).map(row => ({
    ...row,
    name: normalizeHumanText(row.name),
  }))
}

// get_class_members() guards on admin-or-that-class's-leader and returns (id, name, initials)
// only — never join profiles directly for another user, member_display()/this RPC is the
// sanctioned path. The param is `target_class_id`, a text slug, not a uuid.
export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_class_members', { target_class_id: classId })
  if (error) throw error
  return ((data ?? []) as ClassMember[]).map(row => ({
    ...row,
    name: normalizeHumanText(row.name),
    initials: normalizeHumanText(row.initials),
  }))
}

// The complement of get_class_members(): org members with no row in class_memberships for
// this class. Exists because the only other candidate source, admin_list_members(), is
// is_admin()-gated and rejects a class_leader caller outright. Returns the identical
// (id, name, initials) row, so ClassMember is reused rather than a parallel type.
export async function getClassCandidates(classId: string): Promise<ClassMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_class_candidates', { target_class_id: classId })
  if (error) throw error
  return ((data ?? []) as ClassMember[]).map(row => ({
    ...row,
    name: normalizeHumanText(row.name),
    initials: normalizeHumanText(row.initials),
  }))
}

// 'none' is a leader with no assigned class; 'inactive' carries the name because the RPC is
// the only path that can read a deactivated class at all. See 0009 for why the classes table
// cannot supply this directly.
export type LedClassResult =
  | { status: 'none' }
  | { status: 'inactive'; name: string }
  | { status: 'ready'; class: ActiveClass }

export async function getMyLedClass(): Promise<LedClassResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_led_class')
  if (error) throw error
  const row = (data ?? [])[0] as { id: string; name: string; description: string | null; active: boolean } | undefined
  if (!row) return { status: 'none' }
  const className = normalizeHumanText(row.name)
  if (!row.active) return { status: 'inactive', name: className }
  return {
    status: 'ready',
    class: { id: row.id, name: className, description: normalizeOptionalHumanText(row.description) },
  }
}

export async function getOrgInviteCode(): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_org_invite_code')
  if (error) throw error
  return (data as string | null) ?? null
}

export async function getClassLeaders(): Promise<ClassLeader[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_class_leaders')
  if (error) throw error
  return ((data ?? []) as ClassLeader[])
    .map(row => ({
      ...row,
      leader_name: normalizeHumanText(row.leader_name),
      leader_initials: normalizeHumanText(row.leader_initials),
    }))
    .sort((left, right) => left.leader_name.localeCompare(right.leader_name, 'en', { sensitivity: 'base' }) || left.leader_id.localeCompare(right.leader_id))
}

export function formatClassLeaderSummary(leaders: ClassLeaderDisplay[]): string {
  if (!leaders.length) return 'Leader not assigned'
  const additional = leaders.length - 1
  return `Led by ${leaders[0].name}${additional ? ` +${additional}` : ''}`
}

type ActiveMembershipContext = {
  activeClasses: ActiveClass[]
  memberIds: Set<string>
  ledClassId: string | null
  eligibleClassIds: string[]
}

const getActiveMembershipContext = cache(async (): Promise<ActiveMembershipContext> => {
  const [activeClasses, myClasses, ledClass] = await Promise.all([
    getActiveClasses(),
    getMyClasses(),
    getMyLedClass(),
  ])
  const activeIds = new Set(activeClasses.map(item => item.id))
  const memberIds = new Set(myClasses.map(item => item.id).filter(id => activeIds.has(id)))
  const ledClassId = ledClass.status === 'ready' && activeIds.has(ledClass.class.id)
    ? ledClass.class.id
    : null
  return {
    activeClasses,
    memberIds,
    ledClassId,
    eligibleClassIds: activeClasses
      .filter(item => memberIds.has(item.id) || item.id === ledClassId)
      .map(item => item.id),
  }
})

type ActiveClassContext = {
  catalog: ClassCatalogItem[]
}

const getActiveClassContext = cache(async (): Promise<ActiveClassContext> => {
  const [{ activeClasses, memberIds, ledClassId }, classLeaders] = await Promise.all([
    getActiveMembershipContext(),
    getClassLeaders(),
  ])
  const leadersByClass = new Map<string, ClassLeaderDisplay[]>()
  for (const leader of classLeaders) {
    const leaders = leadersByClass.get(leader.class_id) ?? []
    leaders.push({
      id: leader.leader_id,
      name: leader.leader_name,
      initials: leader.leader_initials,
    })
    leadersByClass.set(leader.class_id, leaders)
  }
  return {
    catalog: activeClasses.map((activeClass): ClassCatalogItem => {
      const leaders = leadersByClass.get(activeClass.id) ?? []
      const isMember = memberIds.has(activeClass.id)
      const isLeader = activeClass.id === ledClassId
      return {
        ...activeClass,
        leaders,
        leaderSummary: formatClassLeaderSummary(leaders),
        isMember,
        isLeader,
        isMine: isMember || isLeader,
      }
    }),
  }
})

export async function getClassCatalog(): Promise<ClassCatalogItem[]> {
  return (await getActiveClassContext()).catalog
}

export async function getEligibleClassIds(): Promise<string[]> {
  return (await getActiveMembershipContext()).eligibleClassIds
}

function mapSermon(row: any): Sermon {
  const date = new Date(`${row.date}T00:00:00`)
  return {
    id: row.id,
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    detailDate: normalizeHumanText(row.detail_date || date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })),
    title: normalizeHumanText(row.title),
    speaker: normalizeHumanText(row.speaker),
    text: normalizeHumanText(row.text),
    tag: normalizeHumanText(row.tag),
    paragraphs: normalizeHumanTextArray(row.paragraphs),
    marginNote: normalizeHumanText(row.margin_note),
    closing: normalizeHumanText(row.closing),
  }
}

const LESSON_SUMMARY_SELECT = 'id,class_id,week,number,title,excerpt,duration'

function mapLessonSummary(row: any): LessonSummary {
  return {
    id: row.id,
    classId: row.class_id,
    week: normalizeHumanText(row.week),
    number: normalizeHumanText(row.number),
    title: normalizeHumanText(row.title),
    excerpt: normalizeHumanText(row.excerpt),
    duration: normalizeHumanText(row.duration),
  }
}

async function mapLesson(row: any): Promise<Lesson> {
  const insights = (row.insights ?? []) as any[]
  let displays = new Map<string, Display>()
  if (insights.length) displays = await displaysFor(insights)
  const thoughts: LessonThought[] = insights.map(item => {
    const author = displays.get(item.author_id) ?? anonymousDisplay()
    return {
      id: item.id,
      initials: author.initials,
      name: author.name,
      timestamp: relativeTime(item.created_at),
      text: normalizeHumanText(item.text),
      hearts: item.hearts,
    }
  })
  return {
    ...mapLessonSummary(row),
    sectionLabel: normalizeHumanText(row.section_label),
    quote: normalizeHumanText(row.quote),
    reference: normalizeHumanText(row.reference),
    paragraphs: normalizeHumanTextArray(row.paragraphs),
    marginNote: normalizeHumanText(row.margin_note),
    questions: (row.questions ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((question: any) => ({ id: question.id, text: normalizeHumanText(question.text) })),
    thoughts,
  }
}

export async function getLessons() {
  const { supabase, user } = await getSessionUser()
  const select = user
    ? '*, questions(id,text,sort_order), insights(id,author_id,text,hearts,created_at)'
    : '*, questions(id,text,sort_order)'
  const { data, error } = await supabase.from('lessons').select(select).eq('status', 'published').order('number')
  if (error) throw error
  return Promise.all((data ?? []).map(mapLesson))
}

async function getPublishedLessonSummaries(classIds: string[]): Promise<LessonSummary[]> {
  if (!classIds.length) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select(LESSON_SUMMARY_SELECT)
    .eq('status', 'published')
    .in('class_id', classIds)
    .order('number')
  if (error) throw error
  return (data ?? []).map(mapLessonSummary)
}

export async function getReadableLessonSummaries(): Promise<LessonSummary[]> {
  const { activeClasses, eligibleClassIds } = await getActiveMembershipContext()
  const classOrder = new Map(activeClasses.map((item, index) => [item.id, index]))
  const lessons = await getPublishedLessonSummaries(eligibleClassIds)
  return lessons.sort((left, right) =>
    (classOrder.get(left.classId) ?? Number.MAX_SAFE_INTEGER) - (classOrder.get(right.classId) ?? Number.MAX_SAFE_INTEGER)
    || left.number.localeCompare(right.number),
  )
}

// "Latest" means most recently published, not highest lesson number: a class can
// publish out of order, or revise an earlier lesson a fortnight later. The summary
// select intentionally omits reading-body, question, and insight data the Home card
// does not render.
export async function getLatestLesson(): Promise<LessonSummary | undefined> {
  const eligibleClassIds = await getEligibleClassIds()
  if (!eligibleClassIds.length) return undefined
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select(LESSON_SUMMARY_SELECT)
    .eq('status', 'published')
    .in('class_id', eligibleClassIds)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? mapLessonSummary(data) : undefined
}

// This intentionally mirrors getLesson's user-scoped RLS filtering while bounding
// Home to one lesson row, one ordered question and one newest thought.
export async function getHomeLessonHighlights(lessonId: string): Promise<HomeLessonHighlights> {
  const { supabase, user } = await getSessionUser()
  const [lessonResult, questionResult, thoughtResult] = await Promise.all([
    supabase.from('lessons').select('quote,reference').eq('id', lessonId).maybeSingle(),
    supabase.from('questions').select('id,text').eq('lesson_id', lessonId).order('sort_order').limit(1).maybeSingle(),
    supabase.from('insights').select('author_id,text,created_at').eq('lesson_id', lessonId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (lessonResult.error) throw lessonResult.error
  if (questionResult.error) throw questionResult.error
  if (thoughtResult.error) throw thoughtResult.error
  if (!lessonResult.data) return {}

  const quote = normalizeOptionalHumanText(lessonResult.data.quote) ?? undefined
  const reference = normalizeOptionalHumanText(lessonResult.data.reference) ?? undefined
  const question = questionResult.data
    ? { id: questionResult.data.id, text: normalizeHumanText(questionResult.data.text) }
    : undefined

  let thought: HomeLessonHighlights['thought']
  if (thoughtResult.data) {
    const displays = user ? await displaysFor([thoughtResult.data]) : new Map<string, Display>()
    const author = displays.get(thoughtResult.data.author_id) ?? anonymousDisplay()
    thought = {
      name: author.name,
      initials: author.initials,
      text: normalizeHumanText(thoughtResult.data.text),
      timestamp: relativeTime(thoughtResult.data.created_at),
    }
  }

  return { quote, reference, question, thought }
}

export async function getClassDetail(classId: string): Promise<ClassDetail | undefined> {
  const [{ catalog }, role] = await Promise.all([
    getActiveClassContext(),
    getCurrentRole(),
  ])
  const classSummary = catalog.find(item => item.id === classId)
  if (!classSummary) return undefined
  const viewerRole = role === 'admin'
    ? 'admin'
    : classSummary.isLeader
      ? 'leader'
      : classSummary.isMember
        ? 'member'
        : 'none'
  const lessons = viewerRole === 'none' ? [] : await getPublishedLessonSummaries([classId])
  return { ...classSummary, viewerRole, lessons }
}

export async function getLesson(id: string) {
  const { supabase, user } = await getSessionUser()
  const select = user
    ? '*, questions(id,text,sort_order), insights(id,author_id,text,hearts,created_at)'
    : '*, questions(id,text,sort_order)'
  const { data, error } = await supabase.from('lessons').select(select).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapLesson(data) : undefined
}

// Authoring list: every status, drafts included. The member-facing getLessons() above is
// published-only and stays that way.
//
// RLS is NOT sufficient to scope this for a leader, which is why the class id is passed
// explicitly. class_memberships carries no role restriction, so a class_leader can also
// be a plain member of another class — and lessons_member_read (0008) would then hand
// back that class's published lessons as though the leader could author them. A leader
// caller therefore always passes its led class id; only an admin omits it.
export async function getAuthorLessons(classId?: string): Promise<AuthorLesson[]> {
  const supabase = await createClient()
  const query = supabase.from('lessons').select('id,class_id,week,number,title,status')
  const { data, error } = await (classId ? query.eq('class_id', classId) : query).order('number')
  if (error) throw error
  return ((data ?? []) as AuthorLesson[]).map(row => ({
    ...row,
    week: normalizeHumanText(row.week),
    title: normalizeHumanText(row.title),
  }))
}

// The authoring form's read: every editable field, plus each question's id, order and
// insight count. Undefined when RLS hides the row entirely (another class's draft).
//
// It still returns a row for a PUBLISHED lesson of a class the caller merely belongs to,
// because a leader who is also a plain member of another class passes
// lessons_member_read. RLS cannot express "can write", so the caller must compare
// class_id against the led class and 404 on a mismatch.
export async function getLessonForEdit(id: string): Promise<LessonEdit | undefined> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lessons')
    // Two insights embeds, over two different foreign keys and neither ambiguous: the nested one
    // runs questions -> insights over question_id, the top-level one lessons -> insights over
    // lesson_id (insights has exactly one FK to lessons). Both are needed, and the lesson-level
    // one cannot be derived from the per-question ones — see the note on insightCount below.
    .select('id,class_id,week,number,title,excerpt,duration,section_label,quote,reference,paragraphs,margin_note,status,questions(id,text,sort_order,insights(count)),insights(count)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return undefined
  const row = data as any
  // insights(count) rides along the embed; anything else would need a second round trip
  // per question just to warn before a removal.
  const questions: LessonEditQuestion[] = ((row.questions ?? []) as any[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(question => ({
      id: question.id,
      text: normalizeHumanText(question.text),
      insightCount: question.insights?.[0]?.count ?? 0,
    }))
  return {
    id: row.id,
    class_id: row.class_id,
    week: normalizeHumanText(row.week),
    number: row.number,
    title: normalizeHumanText(row.title),
    excerpt: normalizeHumanText(row.excerpt),
    duration: normalizeHumanText(row.duration),
    section_label: normalizeHumanText(row.section_label),
    quote: normalizeHumanText(row.quote),
    reference: normalizeHumanText(row.reference),
    paragraphs: normalizeHumanTextArray(row.paragraphs),
    margin_note: normalizeHumanText(row.margin_note),
    status: row.status as ContentStatus,
    questions,
    // The lesson-level total, which is NOT the sum of the counts above: a thought with a null
    // question_id (written without one, or orphaned when its question was deleted) counts here
    // and nowhere above. deleteLesson counts the same way, so this is what keeps the form's
    // disabled state and the server's refusal in agreement.
    insightCount: row.insights?.[0]?.count ?? 0,
  }
}

export async function getSermons(limit?: number) {
  const supabase = await createClient()
  const query = supabase.from('sermons').select('*').eq('status', 'published').order('date', { ascending: false })
  const { data, error } = await (limit ? query.limit(limit) : query)
  if (error) throw error
  return (data ?? []).map(mapSermon)
}

export async function getSermon(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sermons').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapSermon(data) : undefined
}

export async function getPrayerPoints(limit?: number) {
  const { supabase, user } = await getSessionUser()
  if (!user) return []
  const query = supabase.from('prayer_points').select('id,author_id,text,hearts,created_at,prayer_confirmations(count)').eq('status', 'published').order('created_at', { ascending: false })
  const { data, error } = await (limit ? query.limit(limit) : query)
  if (error) throw error
  const rows = data ?? []
  const displays = await displaysFor(rows)
  return rows.map((row: any): PrayerPoint => {
    const author = displays.get(row.author_id) ?? anonymousDisplay()
    return {
      id: row.id,
      initials: author.initials,
      name: author.name,
      time: relativeTime(row.created_at),
      text: normalizeHumanText(row.text),
      hearts: row.prayer_confirmations?.[0]?.count ?? row.hearts,
    }
  })
}

export async function getLatestDiscussionPrompt(): Promise<string | undefined> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('discussion_topics')
    .select('prompt')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? normalizeHumanText(data.prompt) : undefined
}

export async function getDiscussionData(): Promise<DiscussionData> {
  const { supabase, user } = await getSessionUser()
  if (!user) return { prompt: DEFAULT_DISCUSSION_PROMPT, entries: [], peopleCount: 0 }
  const [prompt, { data, error }] = await Promise.all([
    getLatestDiscussionPrompt(),
    supabase.from('discussions').select('id,author_id,text,hearts,created_at,discussion_replies(id,author_id,text,hearts,created_at)').order('created_at', { ascending: false }),
  ])
  if (error) throw error
  const rows = data ?? []
  const authorRows = rows.flatMap((row: any) => [{ author_id: row.author_id }, ...(row.discussion_replies ?? []).map((reply: any) => ({ author_id: reply.author_id }))])
  const displays = await displaysFor(authorRows)
  const entries: DiscussionEntry[] = rows.map((row: any) => {
    const author = displays.get(row.author_id) ?? anonymousDisplay()
    return {
      id: row.id,
      initials: author.initials,
      name: author.name,
      timestamp: relativeTime(row.created_at),
      text: normalizeHumanText(row.text),
      hearts: row.hearts,
    }
  })
  return {
    prompt: prompt ?? DEFAULT_DISCUSSION_PROMPT,
    entries,
    peopleCount: new Set(authorRows.map(row => row.author_id)).size,
  }
}

export type ProfileResult =
  | { status: 'anonymous' }
  | { status: 'pending' }
  | { status: 'ready'; profile: Profile }

const PROFILE_CONTENT_QUERY_LIMIT = 11
const PROFILE_CONTENT_RENDER_LIMIT = 10

export async function getMyInsights(): Promise<ProfileContent<ProfileInsight>> {
  const { supabase, user } = await getSessionUser()
  if (!user) return { items: [], truncated: false }
  // Own-only is guaranteed by this trusted server filter, not by SELECT RLS,
  // which intentionally permits same-organization insight reads elsewhere.
  const { data, error } = await supabase
    .from('insights')
    .select('id,lesson_id,text')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(PROFILE_CONTENT_QUERY_LIMIT)
  if (error) throw error
  const rows = data ?? []
  return {
    items: rows.slice(0, PROFILE_CONTENT_RENDER_LIMIT).map(row => ({
      id: row.id,
      lessonId: row.lesson_id,
      text: normalizeHumanText(row.text),
    })),
    truncated: rows.length > PROFILE_CONTENT_RENDER_LIMIT,
  }
}

export async function getMyPrayerPoints(): Promise<ProfileContent<ProfilePrayer>> {
  const { supabase, user } = await getSessionUser()
  if (!user) return { items: [], truncated: false }
  // Own-only is guaranteed by this trusted server filter, not by SELECT RLS.
  // No status filter is added: authors can read their own drafts under current RLS.
  const { data, error } = await supabase
    .from('prayer_points')
    .select('id,text,status')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(PROFILE_CONTENT_QUERY_LIMIT)
  if (error) throw error
  const rows = data ?? []
  return {
    items: rows.slice(0, PROFILE_CONTENT_RENDER_LIMIT).map(row => ({
      id: row.id,
      text: normalizeHumanText(row.text),
      status: row.status as ContentStatus,
    })),
    truncated: rows.length > PROFILE_CONTENT_RENDER_LIMIT,
  }
}

export async function getProfile(): Promise<ProfileResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'anonymous' }
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,initials,member_since,role,organization_id')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return { status: 'pending' }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', data.organization_id)
    .maybeSingle()
  if (organizationError) throw organizationError

  return {
    status: 'ready',
    profile: {
      id: data.id,
      initials: normalizeHumanText(data.initials),
      memberSinceYear: String(data.member_since).slice(0, 4),
      name: normalizeHumanText(data.name),
      churchName: normalizeHumanText(organization?.name ?? ''),
      role: data.role as AppRole,
    },
  }
}

export async function getClothPreviewData(): Promise<{ seeds: string[]; classes: Pick<ActiveClass, 'id' | 'name'>[] }> {
  const supabase = await createClient()
  const [classes, lessons, sermons] = await Promise.all([
    supabase.from('classes').select('id,name').eq('active', true).order('name').limit(12),
    supabase.from('lessons').select('id').order('created_at', { ascending: false }).limit(12),
    supabase.from('sermons').select('id').order('created_at', { ascending: false }).limit(12),
  ])
  if (classes.error) throw classes.error
  if (lessons.error) throw lessons.error
  if (sermons.error) throw sermons.error
  return {
    seeds: [...(classes.data ?? []), ...(lessons.data ?? []), ...(sermons.data ?? [])].map(row => row.id),
    classes: (classes.data ?? []).map(row => ({ id: row.id, name: normalizeHumanText(row.name) })),
  }
}

export async function getHomeData() {
  const [latestLesson, sermons, prayers] = await Promise.all([getLatestLesson(), getSermons(1), getPrayerPoints(1)])
  const lesson = latestLesson ? await getLesson(latestLesson.id) : undefined
  return { lesson, sermon: sermons[0], prayer: prayers[0] }
}
