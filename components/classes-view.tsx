'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Lesson } from '@/lib/types'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'

export default function ClassesView({ lessons }: { lessons: Lesson[] }) {
  return <div className="page-wrap"><Header /><main><section className="page-intro"><Meta>YOUR FORMATION</Meta><h1>Classes</h1><p>Small steps, taken faithfully. Find your place in the journey.</p></section>{lessons.length ? <section className="lesson-list">{lessons.map(lesson => <Link className="lesson-item" key={lesson.id} href={`/classes/${lesson.id}`}><div className="lesson-index"><Meta>{lesson.week}</Meta><span>{lesson.number}</span></div><div className="lesson-info"><h2>{lesson.title}</h2><p>{lesson.excerpt}</p><div className="lesson-meta"><Meta>{lesson.duration}</Meta>{lesson.progress > 0 && <><span className="dot-divider">·</span><Meta>{lesson.progress}% READ</Meta></>}</div></div>{lesson.progress > 0 ? <div className="lesson-ring" style={{ '--progress': `${lesson.progress * 3.6}deg` } as React.CSSProperties}>{lesson.progress}%</div> : <ChevronRight size={19} />}</Link>)}</section>
    : <EmptyState eyebrow="YOUR FORMATION" title="Lessons are on the way" body="Lessons will appear here once they're published." />}</main></div>
}
