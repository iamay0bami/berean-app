import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'
import type { AuthorLesson } from '@/lib/types'

type ClassName = { id: string; name: string }

// A plain server component — the list has no interactivity, so it takes no hooks, unlike
// lesson-form.tsx next to it.
export default function AuthorLessonsView({ lessons, classes }: { lessons: AuthorLesson[]; classes: ClassName[] }) {
  // Grouped in the class list's order, so an admin sees one section per class and a leader
  // sees the single class they lead. A class with no lessons drops out rather than
  // rendering an empty heading.
  const groups = classes
    .map(item => ({ item, rows: lessons.filter(lesson => lesson.class_id === item.id) }))
    .filter(group => group.rows.length)

  return <div className="page-wrap"><Header /><main>
    <section className="page-intro">
      <h1>Lessons</h1>
      <p>Write a lesson, save it as a draft, and publish it when it is ready.</p>
      <Link className="primary-button" href="/author/lessons/new">New lesson</Link>
    </section>

    {groups.length
      ? groups.map(group => <section className="section-block" key={group.item.id}>
        <div className="section-heading"><h2>{group.item.name}</h2><Meta>{group.rows.length === 1 ? '1 lesson' : `${group.rows.length} lessons`}</Meta></div>
        <div className="lesson-list">{group.rows.map(lesson => <Link className="lesson-item" key={lesson.id} href={`/author/lessons/${lesson.id}`}>
          <div className="lesson-index"><Meta>{lesson.week}</Meta><span className="folio">{lesson.number}</span></div>
          <div className="lesson-info"><h2>{lesson.title}</h2></div>
          <span className={`status-badge ${lesson.status}`}>{lesson.status === 'published' ? 'Published' : 'Draft'}</span>
        </Link>)}</div>
      </section>)
      : <EmptyState title="No lessons yet" body="Write the first one and it will appear here as a draft." />}
  </main></div>
}
