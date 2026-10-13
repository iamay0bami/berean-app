export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export type Greeting = {
  // First line of the h1, before the gold flourish. Empty when the name leads.
  before: string
  // The gold italic flourish: the name plus any punctuation attached to it.
  name: string
  // Second line of the h1, after the gold flourish. Empty when the name ends the sentence.
  after: string
}

export const DEFAULT_TIME_ZONE = 'UTC'

// The zone arrives from a request header, and Intl throws a RangeError on an unknown
// zone — uncaught, that would take down the whole page. Probe it once, fall back to UTC.
export function safeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return DEFAULT_TIME_ZONE
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return timeZone
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

// hourCycle 'h23', NOT hour12:false — the latter can render midnight as "24", which
// would land in the wrong bucket. Intl throws if both options are passed together.
function hourIn(timeZone: string, now: Date): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(now))
}

export function timeOfDay(timeZone: string, now = new Date()): TimeOfDay {
  const hour = hourIn(timeZone, now)
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night' // 21:00–04:59
}

export function dateLabel(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric' })
    .format(now)
    .toUpperCase()
}

// Every template carries a {name} token and belongs to exactly one of two shapes:
// "<lead> {name}<punct>" (name last) or "{name}<punct> <trail>" (name first). Never
// both — a template with words on either side of the name renders a third line, which
// would break the two-line welcome heading. Keep new entries to one shape or the other.
const TIME_OF_DAY_TEMPLATES: Record<TimeOfDay, string[]> = {
  morning: [
    'Good morning, {name}.',
    'A blessed morning to you, {name}.',
    'New mercies this morning, {name}.',
    'Rise and read, {name}.',
    'First light, {name}.',
    'The day is young, {name}.',
  ],
  afternoon: [
    'Good afternoon, {name}.',
    'Hope your afternoon is gentle, {name}.',
    'A quiet afternoon to you, {name}.',
    'Wherever this afternoon finds you, {name}.',
    'Breathe easy this afternoon, {name}.',
  ],
  evening: [
    'Good evening, {name}.',
    'You made it through the day, {name}.',
    'A restful evening to you, {name}.',
    'The day is winding down, {name}.',
    'Let this evening be gentle, {name}.',
  ],
  night: [
    'Good night, {name}.',
    'Still awake, {name}?',
    'A quiet night to you, {name}.',
    'Peace for the night, {name}.',
    'Rest well, {name}.',
  ],
}

const ALWAYS_TEMPLATES = [
  'Welcome back, {name}.',
  'Good to see you, {name}.',
  "Glad you're here, {name}.",
  'Peace to you, {name}.',
  'Grace and peace, {name}.',
  'Peace be with you, {name}.',
  'Welcome home, {name}.',
  'So glad you came, {name}.',
  'Good to have you here, {name}.',
  'Come and rest a while, {name}.',
  'Blessings, {name}.',
  'Welcome, {name}.',
  'The Word is waiting, {name}.',
  'A moment of quiet, {name}.',
  '{name}, welcome back.',
]

function splitTemplate(template: string, name: string): Greeting {
  const [before = '', afterRaw = ''] = template.split('{name}')
  // Punctuation sitting directly against the name belongs to it — that is what keeps
  // "friend." wholly inside the gold flourish, exactly as it rendered before.
  const [, attached = '', rest = ''] = afterRaw.match(/^([.,!?]*)([\s\S]*)$/) ?? []
  return { before: before.trim(), name: name + attached, after: rest.trim() }
}

export function pickGreeting(firstName: string | null | undefined, timeZone: string, now = new Date()): Greeting {
  const name = (firstName ?? '').trim() || 'friend'
  const pool = [...TIME_OF_DAY_TEMPLATES[timeOfDay(timeZone, now)], ...ALWAYS_TEMPLATES]
  return splitTemplate(pool[Math.floor(Math.random() * pool.length)], name)
}
