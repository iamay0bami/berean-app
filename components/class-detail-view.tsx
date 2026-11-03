import Link from 'next/link'
import { CoverCloth } from '@/components/cover-cloth'
import { EmptyState } from '@/components/empty-state'
import ThemeToggle from '@/components/theme-toggle'
import type { ClassDetail } from '@/lib/types'

function ClassTools({ viewerRole }: Pick<ClassDetail, 'viewerRole'>) {
  if (viewerRole !== 'admin' && viewerRole !== 'leader') return null

  const classTool = viewerRole === 'admin'
    ? { href: '/admin/classes', label: 'Manage classes' }
    : { href: '/classes/manage', label: 'Manage this class' }

  return (
    <nav className="class-detail__tools" aria-label="Class tools">
      <Link className="btn btn--secondary" href={classTool.href}>{classTool.label}</Link>
      <Link className="btn btn--secondary" href="/author/lessons">Manage lessons</Link>
    </nav>
  )
}

function ClassLessons({ classDetail }: { classDetail: ClassDetail }) {
  const authorized = classDetail.viewerRole !== 'none'
  const noneViewerBody = classDetail.leaders.length
    ? 'Ask your class leader to add you.'
    : 'Ask your church admin.'

  return (
    <section className="class-detail__lessons" aria-labelledby="class-detail-lessons-title">
      <h2 className="class-detail__section-title" id="class-detail-lessons-title">Lessons</h2>
      {authorized && classDetail.lessons.length > 0 ? (
        <div className="class-detail__lesson-list">
          {classDetail.lessons.map(lesson => (
            <Link className="row class-detail__lesson-row" href={`/classes/${lesson.id}`} key={lesson.id}>
              <span className="folio">{lesson.number}</span>
              <span className="row__main">
                <span className="class-detail__lesson-title">{lesson.title}</span>
                <span className="row__meta">{lesson.duration ? `${lesson.week} · ${lesson.duration}` : lesson.week}</span>
              </span>
              <span className="row__action" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      ) : authorized ? (
        <EmptyState title="Lessons are on the way" body="Published lessons will appear here." />
      ) : (
        <EmptyState title="Lessons are for class members." body={noneViewerBody} />
      )}
    </section>
  )
}

export default function ClassDetailView({ classDetail }: { classDetail: ClassDetail }) {
  return (
    <div className="class-detail">
      <header className="class-detail-header">
        <div className="class-detail-header__inner page-wrap">
          <Link className="class-detail-header__back" href="/classes">
            <span className="class-detail-header__back-mark" aria-hidden="true">‹</span>
            <span>Classes</span>
          </Link>
          <span className="class-detail-header__title">Class detail</span>
          <span className="class-detail-header__theme"><ThemeToggle /></span>
        </div>
      </header>

      <main className="class-detail-main" aria-labelledby="class-detail-name">
        <div className="class-detail__wrap page-wrap">
          <div className="class-detail__hero cloth-frame" aria-hidden="true">
            <CoverCloth seed={classDetail.id} variant="plate" />
          </div>

          <div className="class-detail__overview">
            <section className="class-detail__summary" aria-labelledby="class-detail-name">
              <h1 className="class-detail__name" id="class-detail-name">{classDetail.name}</h1>
              {classDetail.description && <p className="class-detail__description">{classDetail.description}</p>}
            </section>

            <section className="class-detail__leaders" aria-labelledby="class-detail-leaders-title">
              <h2 className="class-detail__leaders-title" id="class-detail-leaders-title">Class leaders</h2>
              <ul className="class-detail__leader-list">
                {classDetail.leaders.length ? classDetail.leaders.map(leader => (
                  <li className="class-detail__leader" key={leader.id}>{leader.name}</li>
                )) : (
                  <li className="class-detail__leader">Leader not assigned</li>
                )}
              </ul>
            </section>
          </div>

          <ClassTools viewerRole={classDetail.viewerRole} />
          <ClassLessons classDetail={classDetail} />
        </div>
      </main>
    </div>
  )
}
