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

export interface AdminMember {
  id: string
  email: string | null
  name: string
  username: string | null
  role: AppRole
  assigned_class_id: string | null
}
