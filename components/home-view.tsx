import { ArrowLeft, Bookmark, ChevronRight, Feather, MessageCircle, NotebookPen } from 'lucide-react'
import Link from 'next/link'
import type { Lesson, PrayerPoint, Sermon } from '@/lib/types'
import type { ViewerRole } from '@/lib/mock-data'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'

const emptyCopy: Record<ViewerRole, Record<'all' | 'lesson' | 'sermon', { title: string; body: string }>> = {
  leader: {
    all: { title: "Your content isn't live yet", body: "The lesson and sermon you're preparing are still in drafts. Once published, they'll appear here for the community." },
    lesson: { title: 'No lesson published yet', body: 'Publish the next lesson and members will pick up right where they left off here.' },
    sermon: { title: 'No sermon published yet', body: "Publish the week's sermon notes and they'll show up here." },
  },
  visitor: {
    all: { title: 'New content is on the way', body: "We're preparing this week's lesson and sermon. Check back soon — a place is set for you." },
    lesson: { title: 'Your next lesson is being prepared', body: 'When your next lesson is ready, it will appear here for you to continue.' },
    sermon: { title: "This week's sermon is on the way", body: "Sunday notes will appear here once they're shared." },
  },
}

export default function HomeView({ lesson, sermon, prayer, viewerRole }: { lesson?: Lesson; sermon?: Sermon; prayer: PrayerPoint; viewerRole: ViewerRole }) {
  const copy = emptyCopy[viewerRole]
  const allEmpty = !lesson && !sermon
  return <div className="page-wrap"><Header /><main>
    <section className="welcome"><Meta>SUNDAY, AUGUST 25</Meta><h1>Good morning,<br /><em>friend.</em></h1><p className="lede">A little room to listen, learn, and live the Word this week.</p></section>
    {allEmpty ? <EmptyState title={copy.all.title} body={copy.all.body} /> : <>
      {lesson ? <section className="continue-card paper-card"><div className="card-kicker"><Meta>CONTINUE READING</Meta><Bookmark size={17} fill="currentColor" /></div><div className="lesson-row"><div className="lesson-number">{lesson.number}</div><div className="lesson-info"><h2>{lesson.title}</h2><p>Foundations · 18 min left</p><div className="mini-progress"><span style={{ width: `${lesson.progress}%` }} /></div></div><ChevronRight size={21} /></div><Link className="text-action" href={`/classes/${lesson.id}`}>Open lesson <ArrowLeft size={15} className="rotate-180" /></Link></section>
        : <EmptyState eyebrow="CONTINUE READING" title={copy.lesson.title} body={copy.lesson.body} />}
      <section className="section-block"><div className="section-heading"><h2>For your week</h2><Link className="small-link" href="/sermons">See all <ChevronRight size={15} /></Link></div><div className="home-grid">{sermon ? <Link className="feature-tile gold-tile" href={`/sermons/${sermon.id}`}><NotebookPen size={23} /><span><Meta>SUNDAY NOTES</Meta><strong>The Table Is<br />Still Set</strong></span><ArrowLeft className="rotate-180" size={18} /></Link>
        : <EmptyState className="tile" eyebrow="SUNDAY NOTES" title={copy.sermon.title} body={copy.sermon.body} />}<Link className="feature-tile sage-tile" href="/discuss"><MessageCircle size={22} /><span><Meta>COMMUNITY</Meta><strong>What are you<br />carrying today?</strong></span><ArrowLeft className="rotate-180" size={18} /></Link></div></section>
    </>}
    <section className="section-block prayer-preview"><div className="section-heading"><h2>Prayer corner</h2><Link className="small-link" href="/sermons">View prayers <ChevronRight size={15} /></Link></div><div className="prayer-quote"><Feather size={18} /><p>“Be near to those who need a little more strength today.”</p><Meta>— A PRAYER FROM THE COMMUNITY</Meta></div></section>
  </main></div>
}
