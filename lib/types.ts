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
  track: 'foundations' | 'deeper'
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
  stats: ProfileStat[]
  links: ProfileLink[]
}
