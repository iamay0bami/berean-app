'use client'

import { ChevronRight, Heart } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import type { PrayerPoint, Sermon } from '@/lib/types'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'
import { confirmPrayer } from '@/app/actions'

export default function SermonsView({ sermons, prayers }: { sermons: Sermon[]; prayers: PrayerPoint[] }) {
  const [pending, startTransition] = useTransition()
  return <div className="page-wrap"><Header /><main><section className="page-intro"><Meta>GATHERED WORDS</Meta><h1>Sermons<br /><em>& prayer.</em></h1><p>Keep a word close. Return when you need it.</p></section><div className="sub-tabs"><button className="selected">Sermon notes</button><button>Prayer points</button></div>{sermons.length ? <section className="sermon-list">{sermons.map(sermon => <Link className="sermon-card" key={sermon.id} href={`/sermons/${sermon.id}`}><div className="sermon-top"><Meta>{sermon.date}</Meta><span className="tag">{sermon.tag}</span></div><h2>{sermon.title}</h2><p>{sermon.text}</p><div className="sermon-bottom"><Meta>{sermon.speaker}</Meta><ChevronRight size={17} /></div></Link>)}</section>
    : <EmptyState eyebrow="GATHERED WORDS" title="No sermon notes yet" body="Sermon notes will appear here after each gathering. Check back soon." />}{prayers.length > 0 && <section className="section-block prayer-list"><div className="section-heading"><h2>Prayer points</h2></div>{prayers.map(prayer => <div className="prayer-item" key={prayer.id}><div className="avatar brick-avatar">{prayer.initials}</div><div><strong>{prayer.name} <Meta>{prayer.time}</Meta></strong><p>{prayer.text}</p><button className="insight-actions" disabled={pending} onClick={() => startTransition(() => confirmPrayer(prayer.id))}><Heart size={15} /> {prayer.hearts} people are praying</button></div></div>)}</section>}</main></div>
}
