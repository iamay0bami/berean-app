import type { DiscussionData, Lesson, PrayerPoint, Profile, Sermon } from '@/lib/types'

const lessons: Lesson[] = [
  {
    id: 'a-faith-that-listens',
    week: 'WEEK 04',
    number: '04',
    title: 'A faith that listens',
    excerpt: 'Learning to receive the Word with an open heart.',
    duration: '18 min',
    progress: 68,
    track: 'foundations',
    sectionLabel: 'THE PRACTICE OF LISTENING',
    quote: '“Let everyone be quick to listen, slow to speak, and slow to become angry.”',
    reference: 'JAMES 1:19',
    paragraphs: [
      'There is a kind of faith that is always talking. It fills the silence with answers, advice, and certainty. But the life Jesus invites us into begins somewhere quieter.',
      'Listening is not passive. It is the brave, attentive work of making room — for God, for one another, and for the parts of ourselves we would rather hurry past.',
      'Today, try noticing before fixing. Receive before responding. Let your attention become an act of love.',
    ],
    marginNote: 'What would change if you believed you didn’t have to have the last word?',
    questions: [
      { id: 'quiet-enough', text: 'What helps you become quiet enough to listen?' },
      { id: 'resisting-word', text: 'Where might you be resisting the Word right now?' },
    ],
    thoughts: [
      {
        id: 'elena-m',
        initials: 'EM',
        name: 'Elena M.',
        timestamp: '2 HOURS AGO',
        text: '“Listening to my daughter without reaching for a lesson. It felt small, but it felt like love.”',
        hearts: 7,
      },
    ],
  },
  {
    id: 'the-work-of-becoming',
    week: 'WEEK 05',
    number: '05',
    title: 'The work of becoming',
    excerpt: 'Grace is not a finish line. It is a way of walking.',
    duration: '22 min',
    progress: 0,
    track: 'foundations',
    sectionLabel: 'THE WORK OF BECOMING',
    quote: '“He who began a good work in you will carry it on to completion.”',
    reference: 'PHILIPPIANS 1:6',
    paragraphs: ['Grace meets us in motion, shaping the person we are becoming one faithful step at a time.'],
    marginNote: 'What patient work is God doing in you?',
    questions: [{ id: 'patient-work', text: 'Where are you learning to trust the process?' }],
    thoughts: [],
  },
  {
    id: 'when-the-road-gets-hard',
    week: 'WEEK 06',
    number: '06',
    title: 'When the road gets hard',
    excerpt: 'What endurance makes possible in us.',
    duration: '16 min',
    progress: 0,
    track: 'foundations',
    sectionLabel: 'THE LONG ROAD',
    quote: '“Let us run with perseverance the race marked out for us.”',
    reference: 'HEBREWS 12:1',
    paragraphs: ['Endurance does not make the road easy, but it teaches us how to keep walking with hope.'],
    marginNote: 'What helps you keep going?',
    questions: [{ id: 'keep-going', text: 'Where do you need a little more courage today?' }],
    thoughts: [],
  },
]

const sermons: Sermon[] = [
  {
    id: 'the-table-is-still-set',
    date: 'AUG 18, 2024',
    detailDate: 'AUGUST 18, 2024',
    title: 'The Table Is Still Set',
    speaker: 'Pastor Caleb Mensah',
    text: 'There is room at the table. Not because we have earned our seat, but because love made room first.',
    tag: 'COMMUNITY',
    paragraphs: [
      'We are often tempted to think belonging is something we can achieve. A place we can earn by knowing the right words, showing up enough, or getting our lives in order.',
      'But Jesus keeps setting the table before we are ready. He calls us by name before we can prove ourselves. This is the good news: the invitation is already ours.',
    ],
    marginNote: '“Love made room first.”',
    closing: 'Who might need to hear that there is a place for them this week? Carry the invitation outward.',
  },
  {
    id: 'a-better-kind-of-waiting',
    date: 'AUG 11, 2024',
    detailDate: 'AUGUST 11, 2024',
    title: 'A Better Kind of Waiting',
    speaker: 'Pastor Miriam Cole',
    text: 'Waiting is not wasted time when God is teaching us how to hope.',
    tag: 'HOPE',
    paragraphs: ['Waiting can become a place where hope grows roots and our attention returns to what matters.'],
    marginNote: 'Hope is being formed in the waiting.',
    closing: 'What would it look like to wait with open hands this week?',
  },
]

const prayerPoints: PrayerPoint[] = [
  {
    id: 'students-returning',
    initials: 'JM',
    name: 'Jon M.',
    time: '12 min ago',
    text: 'Praying for the students heading back to school this week — for courage, good friends, and quiet moments to breathe.',
    hearts: 14,
  },
  {
    id: 'annas-dad',
    initials: 'AR',
    name: 'Anna R.',
    time: 'Yesterday',
    text: 'Please pray for my dad as he starts a new round of treatment. We are holding onto hope together.',
    hearts: 28,
  },
]

const discussionData: DiscussionData = {
  prompt: 'Where have you noticed grace making room for you lately?',
  peopleCount: 12,
  entries: [
    { id: 'theo-d', initials: 'TD', name: 'Theo D.', timestamp: '1 DAY AGO', text: '“I found it in a friend who kept showing up when I was hard to reach.”', hearts: 3 },
    { id: 'rachel-k', initials: 'RK', name: 'Rachel K.', timestamp: '2 DAYS AGO', text: '“At the hospital, when a nurse remembered my name.”', hearts: 4 },
  ],
}

const profile: Profile = {
  initials: 'MC',
  memberSince: 'WALKING SINCE 2022',
  name: 'Maya Collins',
  tagline: '“Learning to be present.”',
  stats: [
    { value: 4, label: 'LESSONS' },
    { value: 12, label: 'THOUGHTS' },
    { value: 28, label: 'PRAYERS' },
  ],
  links: [
    { id: 'bookmarked-notes', label: 'Bookmarked notes', icon: 'bookmark' },
    { id: 'my-reflections', label: 'My reflections', icon: 'feather' },
    { id: 'reading-settings', label: 'Reading settings', icon: 'compass' },
  ],
}

export async function getLessons() {
  return lessons
}

export async function getLesson(id: string) {
  return lessons.find(lesson => lesson.id === id)
}

export async function getSermons() {
  return sermons
}

export async function getSermon(id: string) {
  return sermons.find(sermon => sermon.id === id)
}

export async function getPrayerPoints() {
  return prayerPoints
}

export async function getDiscussionData() {
  return discussionData
}

export async function getProfile() {
  return profile
}

export async function getHomeData() {
  const [lesson, sermon, prayers] = await Promise.all([
    getLesson('a-faith-that-listens'),
    getSermon('the-table-is-still-set'),
    getPrayerPoints(),
  ])
  return { lesson, sermon, prayer: prayers[0] }
}
