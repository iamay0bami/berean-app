import type { DiscussionData, DiscussionEntry, Lesson, LessonThought, PrayerPoint, Profile, Sermon } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

type Display = { id: string; name: string; initials: string }
type AuthorRow = { author_id: string }

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
  return new Map((data as Display[]).map(display => [display.id, display]))
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

export async function getViewerRole(): Promise<ViewerRole> {
  const { supabase, user } = await getSessionUser()
  if (!user) return 'visitor'
  const { data, error } = await supabase.rpc('current_role')
  if (error) throw error
  return data === 'admin' || data === 'class_leader' ? 'leader' : 'visitor'
}

function mapSermon(row: any): Sermon {
  const date = new Date(`${row.date}T00:00:00`)
  return {
    id: row.id,
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
    detailDate: row.detail_date || date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(),
    title: row.title,
    speaker: row.speaker,
    text: row.text,
    tag: row.tag,
    paragraphs: row.paragraphs ?? [],
    marginNote: row.margin_note,
    closing: row.closing,
  }
}

async function mapLesson(row: any): Promise<Lesson> {
  const insights = (row.insights ?? []) as any[]
  let displays = new Map<string, Display>()
  if (insights.length) displays = await displaysFor(insights)
  const thoughts: LessonThought[] = insights.map(item => {
    const author = displays.get(item.author_id) ?? anonymousDisplay()
    return { id: item.id, initials: author.initials, name: author.name, timestamp: relativeTime(item.created_at), text: item.text, hearts: item.hearts }
  })
  return {
    id: row.id, week: row.week, number: row.number, title: row.title, excerpt: row.excerpt,
    duration: row.duration, progress: row.progress, track: row.track, sectionLabel: row.section_label,
    quote: row.quote, reference: row.reference, paragraphs: row.paragraphs ?? [], marginNote: row.margin_note,
    questions: (row.questions ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((question: any) => ({ id: question.id, text: question.text })),
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

export async function getLesson(id: string) {
  const { supabase, user } = await getSessionUser()
  const select = user
    ? '*, questions(id,text,sort_order), insights(id,author_id,text,hearts,created_at)'
    : '*, questions(id,text,sort_order)'
  const { data, error } = await supabase.from('lessons').select(select).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapLesson(data) : undefined
}

export async function getSermons() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sermons').select('*').eq('status', 'published').order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapSermon)
}

export async function getSermon(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('sermons').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapSermon(data) : undefined
}

export async function getPrayerPoints() {
  const { supabase, user } = await getSessionUser()
  if (!user) return []
  const { data, error } = await supabase.from('prayer_points').select('id,author_id,text,hearts,created_at,prayer_confirmations(count)').eq('status', 'published').order('created_at', { ascending: false })
  if (error) throw error
  const rows = data ?? []
  const displays = await displaysFor(rows)
  return rows.map((row: any): PrayerPoint => {
    const author = displays.get(row.author_id) ?? anonymousDisplay()
    return { id: row.id, initials: author.initials, name: author.name, time: relativeTime(row.created_at), text: row.text, hearts: row.prayer_confirmations?.[0]?.count ?? row.hearts }
  })
}

export async function getDiscussionData(): Promise<DiscussionData> {
  const { supabase, user } = await getSessionUser()
  if (!user) return { prompt: DEFAULT_DISCUSSION_PROMPT, entries: [], peopleCount: 0 }
  const [{ data: topic }, { data, error }] = await Promise.all([
    supabase.from('discussion_topics').select('id,prompt').eq('status', 'published').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('discussions').select('id,author_id,text,hearts,created_at,discussion_replies(id,author_id,text,hearts,created_at)').order('created_at', { ascending: false }),
  ])
  if (error) throw error
  const rows = data ?? []
  const authorRows = rows.flatMap((row: any) => [{ author_id: row.author_id }, ...(row.discussion_replies ?? []).map((reply: any) => ({ author_id: reply.author_id }))])
  const displays = await displaysFor(authorRows)
  const entries: DiscussionEntry[] = rows.map((row: any) => {
    const author = displays.get(row.author_id) ?? anonymousDisplay()
    return { id: row.id, initials: author.initials, name: author.name, timestamp: relativeTime(row.created_at), text: row.text, hearts: row.hearts }
  })
  return { prompt: topic?.prompt ?? DEFAULT_DISCUSSION_PROMPT, entries, peopleCount: new Set(authorRows.map(row => row.author_id)).size }
}

export async function getProfile(): Promise<Profile | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return undefined
  const { data, error } = await supabase.from('profiles').select('name,initials,tagline,member_since').eq('id', user.id).single()
  if (error) throw error
  const [{ count: thoughts }, { count: prayers }] = await Promise.all([
    supabase.from('insights').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
    supabase.from('prayer_confirmations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])
  return {
    initials: data.initials, memberSince: `WALKING SINCE ${new Date(data.member_since).getFullYear()}`, name: data.name, tagline: data.tagline,
    stats: [{ value: 0, label: 'LESSONS' }, { value: thoughts ?? 0, label: 'THOUGHTS' }, { value: prayers ?? 0, label: 'PRAYERS' }],
    links: [{ id: 'bookmarked-notes', label: 'Bookmarked notes', icon: 'bookmark' }, { id: 'my-reflections', label: 'My reflections', icon: 'feather' }, { id: 'reading-settings', label: 'Reading settings', icon: 'compass' }],
  }
}

export async function getHomeData() {
  const [lessons, sermons, prayers] = await Promise.all([getLessons(), getSermons(), getPrayerPoints()])
  return { lesson: lessons[0], sermon: sermons[0], prayer: prayers[0] }
}
