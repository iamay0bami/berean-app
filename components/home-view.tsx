import { ArrowLeft, Bookmark, ChevronRight, Feather, MessageCircle, NotebookPen } from 'lucide-react'
import Link from 'next/link'
import type { Lesson, PrayerPoint, Sermon } from '@/lib/types'
import { Header, Meta } from '@/components/shared'

export default function HomeView({ lesson, sermon, prayer }: { lesson: Lesson; sermon: Sermon; prayer: PrayerPoint }) {
  return <div className="page-wrap"><Header /><main>
    <section className="welcome"><Meta>SUNDAY, AUGUST 25</Meta><h1>Good morning,<br /><em>friend.</em></h1><p className="lede">A little room to listen, learn, and live the Word this week.</p></section>
    <section className="continue-card paper-card"><div className="card-kicker"><Meta>CONTINUE READING</Meta><Bookmark size={17} fill="currentColor" /></div><div className="lesson-row"><div className="lesson-number">{lesson.number}</div><div className="lesson-info"><h2>{lesson.title}</h2><p>Foundations · 18 min left</p><div className="mini-progress"><span style={{ width: `${lesson.progress}%` }} /></div></div><ChevronRight size={21} /></div><Link className="text-action" href={`/classes/${lesson.id}`}>Open lesson <ArrowLeft size={15} className="rotate-180" /></Link></section>
    <section className="section-block"><div className="section-heading"><h2>For your week</h2><Link className="small-link" href="/sermons">See all <ChevronRight size={15} /></Link></div><div className="home-grid"><Link className="feature-tile gold-tile" href={`/sermons/${sermon.id}`}><NotebookPen size={23} /><span><Meta>SUNDAY NOTES</Meta><strong>The Table Is<br />Still Set</strong></span><ArrowLeft className="rotate-180" size={18} /></Link><Link className="feature-tile sage-tile" href="/discuss"><MessageCircle size={22} /><span><Meta>COMMUNITY</Meta><strong>What are you<br />carrying today?</strong></span><ArrowLeft className="rotate-180" size={18} /></Link></div></section>
    <section className="section-block prayer-preview"><div className="section-heading"><h2>Prayer corner</h2><Link className="small-link" href="/sermons">View prayers <ChevronRight size={15} /></Link></div><div className="prayer-quote"><Feather size={18} /><p>“Be near to those who need a little more strength today.”</p><Meta>— A PRAYER FROM THE COMMUNITY</Meta></div></section>
  </main></div>
}
