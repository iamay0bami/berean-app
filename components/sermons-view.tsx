import { Bookmark, ChevronRight, Heart } from 'lucide-react'
import Link from 'next/link'
import type { PrayerPoint, Sermon } from '@/lib/types'
import { Header, Meta } from '@/components/shared'

export default function SermonsView({ sermons, prayers }: { sermons: Sermon[]; prayers: PrayerPoint[] }) {
  return <div className="page-wrap"><Header /><main><section className="page-intro"><Meta>GATHERED WORDS</Meta><h1>Sermons<br /><em>& prayer.</em></h1><p>Keep a word close. Return when you need it.</p></section><div className="sub-tabs"><button className="selected">Sermon notes</button><button>Prayer points</button></div><section className="sermon-list">{sermons.map(sermon => <Link className="sermon-card" key={sermon.id} href={`/sermons/${sermon.id}`}><div className="sermon-top"><Meta>{sermon.date}</Meta><span className="tag">{sermon.tag}</span></div><h2>{sermon.title}</h2><p>{sermon.text}</p><div className="sermon-bottom"><Meta>{sermon.speaker}</Meta><ChevronRight size={17} /></div></Link>)}</section><section className="section-block prayer-list"><div className="section-heading"><h2>Prayer points</h2><button className="small-link">See all <ChevronRight size={15} /></button></div>{prayers.slice(0, 1).map(prayer => <div className="prayer-item" key={prayer.id}><div className="avatar brick-avatar">{prayer.initials}</div><div><strong>{prayer.name} <Meta>{prayer.time}</Meta></strong><p>{prayer.text}</p><div className="insight-actions"><Heart size={15} /> {prayer.hearts} people are praying</div></div></div>)}</section></main></div>
}
