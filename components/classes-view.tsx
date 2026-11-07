import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { AppRole, ClassCatalogItem, LessonSummary } from '@/lib/types'
import ClassShelf, { fullLeaderSummary } from '@/components/class-shelf'
import { CoverCloth } from '@/components/cover-cloth'
import { EmptyState } from '@/components/empty-state'
import { Header } from '@/components/shared'

export default function ClassesView({ lessons, myClasses, otherClasses, role }: {
  lessons: LessonSummary[]
  myClasses: ClassCatalogItem[]
  otherClasses: ClassCatalogItem[]
  role: AppRole | null
}) {
  const classNames = new Map([...myClasses, ...otherClasses].map(item => [item.id, item.name]))
  const catalogEmpty = myClasses.length === 0 && otherClasses.length === 0

  return (
    <div className="page-wrap classes-page">
      <Header />
      <main>
        <h1 className="classes-page__title">Classes</h1>
        {catalogEmpty ? (
          <EmptyState
            title="No classes yet"
            body={role === 'admin'
              ? 'Create a class to make it available here.'
              : 'Classes appear here after your church admin creates them.'}
            action={role === 'admin' ? <Link className="btn btn--secondary" href="/admin/classes">Manage classes</Link> : undefined}
          />
        ) : (
          <>
            <section className="section-block classes-section" aria-labelledby="your-classes-title">
              <div className="section-heading">
                <h2 className="card__title" id="your-classes-title">Your classes</h2>
              </div>
              {myClasses.length ? (
                <ClassShelf items={myClasses} labelledBy="your-classes-title" idPrefix="shelf" />
              ) : (
                <p className="classes-page__note">{role === 'admin'
                  ? 'You’re not in any classes yet. Classes you belong to will appear here.'
                  : 'You’re not in any classes yet. Ask a class leader or your church admin to add you.'}</p>
              )}
            </section>

            <section className="section-block classes-section" aria-labelledby="other-classes-title">
              <div className="section-heading">
                <h2 className="card__title" id="other-classes-title">Other classes</h2>
              </div>
              {otherClasses.length ? (
                <ul className="class-row-list">
                  {otherClasses.map(item => (
                    <li key={item.id}>
                      <Link
                        className="row row--plate card card--borderless"
                        href={`/class/${item.id}`}
                        aria-labelledby={`other-title-${item.id}`}
                        aria-describedby={`other-leaders-${item.id}`}
                      >
                        <div className="cloth-frame class-row__thumb"><CoverCloth seed={item.id} variant="thumb" /></div>
                        <div className="row__main">
                          <h3 className="row__title" id={`other-title-${item.id}`}>{item.name}</h3>
                          <p className="row__meta" aria-hidden="true">{item.leaderSummary}</p>
                          <span className="sr-only" id={`other-leaders-${item.id}`}>{fullLeaderSummary(item)}</span>
                        </div>
                        <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="classes-page__note">No other classes. All available classes are in Your classes.</p>
              )}
            </section>

            <section className="section-block classes-section" aria-labelledby="class-lessons-title">
              <div className="section-heading">
                <h2 className="card__title" id="class-lessons-title">Lessons from your classes</h2>
              </div>
              {lessons.length ? (
                <ul className="class-row-list class-row-list--lessons">
                  {lessons.map(lesson => (
                    <li key={lesson.id}>
                      <Link className="row" href={`/classes/${lesson.id}`}>
                        <span className="folio">{lesson.number}</span>
                        <div className="row__main">
                          <h3 className="row__title">{lesson.title}</h3>
                          <p className="row__meta">{[classNames.get(lesson.classId), lesson.week, lesson.duration].filter(Boolean).join(' · ')}</p>
                          {lesson.excerpt && <p className="classes-page__excerpt">{lesson.excerpt}</p>}
                        </div>
                        <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="classes-page__note">Published lessons from your classes will appear here.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
