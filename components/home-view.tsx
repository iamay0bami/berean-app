import { ArrowLeft, ChevronRight, Feather, MessageCircle, NotebookPen } from 'lucide-react'
import Link from 'next/link'
import type { Lesson, PrayerPoint, Sermon } from '@/lib/types'
import type { ViewerRole } from '@/lib/mock-data'
import type { Greeting } from '@/lib/greeting'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'

const emptyCopy: Record<ViewerRole, Record<'all' | 'lesson' | 'sermon', { title: string; body: string }>> = {
  leader: {
    all: { title: 'Nothing is published yet', body: 'Once a lesson or sermon is published, it will appear here for the community.' },
    lesson: { title: 'No lesson published yet', body: 'Publish a lesson and it will appear here for everyone.' },
    sermon: { title: 'No sermon published yet', body: "Publish the week's sermon notes and they'll show up here." },
  },
  visitor: {
    all: { title: 'New content is on the way', body: 'There is nothing published yet. Check back soon — a place is set for you.' },
    lesson: { title: 'No lesson published yet', body: 'When the next lesson is published, it will appear here.' },
    sermon: { title: 'No sermon notes yet', body: "Sunday notes will appear here once they're shared." },
  },
}

export default function HomeView({ lesson, sermon, prayer, viewerRole, greeting, dateLabel }: { lesson?: Lesson; sermon?: Sermon; prayer?: PrayerPoint; viewerRole: ViewerRole; greeting: Greeting; dateLabel: string }) {
  const copy = emptyCopy[viewerRole]
  const allEmpty = !lesson && !sermon
  return <div className="page-wrap"><Header /><main>
    <section className="welcome"><Meta>{dateLabel}</Meta><h1>{greeting.before ? <>{greeting.before}<br /></> : null}<em>{greeting.name}</em>{greeting.after ? <><br />{greeting.after}</> : null}</h1><p className="lede">A little room to listen, learn, and live the Word this week.</p></section>
    {allEmpty ? <EmptyState title={copy.all.title} body={copy.all.body} /> : <>
      {lesson ? <section className="continue-card paper-card"><div className="card-kicker"><Meta>Latest lesson</Meta></div><div className="lesson-row"><div className="lesson-number">{lesson.number}</div><div className="lesson-info"><h2>{lesson.title}</h2><p>{lesson.duration}</p></div><ChevronRight size={21} /></div><Link className="text-action" href={`/classes/${lesson.id}`}>Open lesson <ArrowLeft size={15} className="rotate-180" /></Link></section>
        : <EmptyState title={copy.lesson.title} body={copy.lesson.body} />}
      <section className="section-block"><div className="section-heading"><h2>For your week</h2><Link className="small-link" href="/sermons">See all <ChevronRight size={15} /></Link></div><div className="home-grid">{sermon ? <Link className="feature-tile gold-tile" href={`/sermons/${sermon.id}`}><NotebookPen size={23} /><span><Meta>Sunday notes</Meta><strong>{sermon.title}</strong></span><ArrowLeft className="rotate-180" size={18} /></Link>
        : <EmptyState className="empty--tile" title={copy.sermon.title} body={copy.sermon.body} />}<Link className="feature-tile sage-tile" href="/discuss"><MessageCircle size={22} /><span><Meta>Community</Meta><strong>What are you<br />carrying today?</strong></span><ArrowLeft className="rotate-180" size={18} /></Link></div></section>
    </>}
    {prayer && <section className="section-block prayer-preview"><div className="section-heading"><h2>Prayer corner</h2><Link className="small-link" href="/sermons">View prayers <ChevronRight size={15} /></Link></div><div className="prayer-quote"><Feather size={18} /><p>“{prayer.text}”</p><Meta>— {prayer.name} · {prayer.time}</Meta></div></section>}
  </main></div>
}
