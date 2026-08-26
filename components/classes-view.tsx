'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { Lesson } from '@/lib/types'
import { Header, Meta } from '@/components/shared'

type Track = 'foundations' | 'deeper'

export default function ClassesView({ lessons }: { lessons: Lesson[] }) {
  const [track, setTrack] = useState<Track>('foundations')
  const visibleLessons = lessons
  return <div className="page-wrap"><Header /><main><section className="page-intro"><Meta>YOUR FORMATION</Meta><h1>Classes</h1><p>Small steps, taken faithfully. Find your place in the journey.</p></section><div className="track-tabs"><button className={track === 'foundations' ? 'active brick' : ''} onClick={() => setTrack('foundations')}><span className="tab-dot brick-bg" />Foundations<Meta>6 LESSONS</Meta></button><button className={track === 'deeper' ? 'active sage' : ''} onClick={() => setTrack('deeper')}><span className="tab-dot sage-bg" />Going Deeper<Meta>8 LESSONS</Meta></button></div><section className="lesson-list">{visibleLessons.map(lesson => <Link className="lesson-item" key={lesson.id} href={`/classes/${lesson.id}`}><div className="lesson-index"><Meta>{lesson.week}</Meta><span>{lesson.number}</span></div><div className="lesson-info"><h2>{lesson.title}</h2><p>{lesson.excerpt}</p><div className="lesson-meta"><Meta>{lesson.duration}</Meta>{lesson.progress > 0 && <><span className="dot-divider">·</span><Meta>{lesson.progress}% READ</Meta></>}</div></div>{lesson.progress > 0 ? <div className="lesson-ring" style={{ '--progress': `${lesson.progress * 3.6}deg` } as React.CSSProperties}>{lesson.progress}%</div> : <ChevronRight size={19} />}</Link>)}</section></main></div>
}
