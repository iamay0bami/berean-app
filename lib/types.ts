export interface LessonQuestion {
  id: string
  text: string
}

export interface LessonThought {
  id: string
  initials: string
  name: string
  timestamp: string
  text: string
  hearts: number
}

export interface Lesson {
  id: string
  week: string
  number: string
  title: string
  excerpt: string
  duration: string
  progress: number
  sectionLabel: string
  quote: string
  reference: string
  paragraphs: string[]
  marginNote: string
  questions: LessonQuestion[]
  thoughts: LessonThought[]
}

export interface Sermon {
  id: string
  date: string
  detailDate: string
  title: string
  speaker: string
  text: string
  tag: string
  paragraphs: string[]
  marginNote: string
  closing: string
}

export interface PrayerPoint {
  id: string
  initials: string
  name: string
  time: string
  text: string
  hearts: number
}

export interface DiscussionEntry {
  id: string
  initials: string
  name: string
  timestamp: string
  text: string
  hearts: number
}

export interface DiscussionData {
  prompt: string
  entries: DiscussionEntry[]
  peopleCount: number
}

export interface ProfileStat {
  value: number
  label: string
}

export interface ProfileLink {
  id: string
  label: string
  icon: 'bookmark' | 'feather' | 'compass'
}

export interface Profile {
  initials: string
  memberSince: string
  name: string
  tagline: string
  role: AppRole
  stats: ProfileStat[]
  links: ProfileLink[]
}

export type AppRole = 'member' | 'class_leader' | 'admin'

export interface ActiveClass {
  id: string
  name: string
  description: string | null
}

export interface ClassLeader {
  class_id: string
  leader_id: string
  leader_name: string
  leader_initials: string
}

// Admin-side class row: ActiveClass plus the active flag. Unlike getActiveClasses(),
// getAdminClasses() returns deactivated rows too — classes_member_read (0006) already
// permits an admin to select them.
//
// lessonCount is flattened from a lessons(count) embed and counts every status: a class may
// not be deleted while it holds any lesson, and lessons.class_id is ON DELETE RESTRICT (0001),
// so a drafts-only count would offer a Delete the database then refuses.
export interface AdminClass {
  id: string
  name: string
  description: string | null
  active: boolean
  lessonCount: number
}

// get_class_members() (0008) returns exactly (id, name, initials) — a lean roster row,
// not an AdminMember (which carries email/username/role and has no initials column).
export interface ClassMember {
  id: string
  name: string
  initials: string
}

export interface AdminMember {
  id: string
  email: string | null
  name: string
  username: string | null
  role: AppRole
  assigned_class_id: string | null
}

export type ContentStatus = 'draft' | 'published'

// Authoring-side types. Unlike Lesson (the camelCased reading-view shape built by
// mapLesson), these are the raw column names the authoring reader selects, the same way
// AdminMember keeps admin_list_members()' snake_case.
//
// getAuthorLessons() returns every status — drafts included — which is why it is a
// separate reader from the published-only getLessons().
export interface AuthorLesson {
  id: string
  class_id: string
  week: string
  number: string
  title: string
  status: ContentStatus
}

// Deliberately not a widening of LessonQuestion (which backs Lesson.questions for the
// reading view and carries neither an order nor a count): insightCount is what lets the
// form warn before removing a question someone has already written a thought against.
export interface LessonEditQuestion {
  id: string
  text: string
  insightCount: number
}

export interface LessonEdit {
  id: string
  class_id: string
  week: string
  number: string
  title: string
  excerpt: string
  duration: string
  section_label: string
  quote: string
  reference: string
  paragraphs: string[]
  margin_note: string
  status: ContentStatus
  questions: LessonEditQuestion[]
  // Every thought on the lesson, counted by insights.lesson_id — a different question from
  // LessonEditQuestion.insightCount above, and NOT the sum of it. insights.question_id is
  // nullable, so thoughts written without a question, and thoughts orphaned when their question
  // was deleted, belong to no question and are invisible to any per-question count. This is the
  // number that decides whether the lesson can be deleted, so it has to be the lesson-level one.
  insightCount: number
}
