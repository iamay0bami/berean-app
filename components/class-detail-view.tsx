import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { CoverCloth } from '@/components/cover-cloth'
import ThemeToggle from '@/components/theme-toggle'
import type { ClassDetail } from '@/lib/types'

const leaderChoices = new Intl.ListFormat('en', { style: 'long', type: 'disjunction' })

function unknownRole(role: never): never {
  throw new Error(`Unknown class viewer role: ${role}`)
}

function ClassTools({ viewerRole }: Pick<ClassDetail, 'viewerRole'>) {
  let classTool: { href: string; label: string }
  switch (viewerRole) {
    case 'admin':
      classTool = { href: '/admin/classes', label: 'Manage classes' }
      break
    case 'leader':
      classTool = { href: '/classes/manage', label: 'Manage this class' }
      break
    case 'member':
    case 'none':
      return null
    default:
      return unknownRole(viewerRole)
  }

  return (
    <div className="class-detail__tools">
      {viewerRole === 'admin' && <p className="class-detail__tools-label">Church-wide tools</p>}
      <nav className="class-detail__tool-links" aria-label={viewerRole === 'admin' ? 'Church-wide tools' : 'Class tools'}>
        <Link className="btn btn--secondary" href={classTool.href}>{classTool.label}</Link>
        <Link className="btn btn--secondary" href="/author/lessons">Manage lessons</Link>
      </nav>
    </div>
  )
}

function ClassLessons({ classDetail }: { classDetail: ClassDetail }) {
  let content: ReactNode
  switch (classDetail.viewerRole) {
    case 'none': {
      const whomToAsk = classDetail.leaders.length
        ? leaderChoices.format(classDetail.leaders.map(leader => leader.name))
        : 'your church admin'
      content = <p className="class-detail__access-note">Lessons are for class members. Ask {whomToAsk} to add you.</p>
      break
    }
    case 'admin':
    case 'leader':
    case 'member':
      content = classDetail.lessons.length ? (
        <ul className="class-detail__lesson-list">
          {classDetail.lessons.map(lesson => (
            <li key={lesson.id}>
              <Link className="row class-detail__lesson-row" href={`/classes/${lesson.id}`}>
                <span className="folio">{lesson.number}</span>
                <div className="row__main">
                  <h3 className="row__title class-detail__lesson-title">{lesson.title}</h3>
                  {(lesson.week || lesson.duration) && <p className="row__meta">{[lesson.week, lesson.duration].filter(Boolean).join(' · ')}</p>}
                </div>
                <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="class-detail__note">Lessons are on the way. Published lessons will appear here.</p>
      )
      break
    default:
      return unknownRole(classDetail.viewerRole)
  }

  return (
    <section className="class-detail__lessons" aria-labelledby="class-detail-lessons-title">
      <h2 className="card__title class-detail__section-title" id="class-detail-lessons-title">Lessons</h2>
      {content}
    </section>
  )
}

export default function ClassDetailView({ classDetail }: { classDetail: ClassDetail }) {
  return (
    <div className="class-detail">
      <main className="class-detail-main" aria-labelledby="class-detail-name">
        <div className="class-detail__wrap page-wrap">
          <div className="class-detail__hero">
            <div className="class-detail__art" aria-hidden="true"><CoverCloth seed={classDetail.id} variant="cover" /></div>
            <header className="class-detail-header">
              <Link className="icon-button class-detail-header__chip class-detail-header__back" href="/classes" aria-label="Back to Classes">
                <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <ThemeToggle className="class-detail-header__chip" />
            </header>
            <div className="cloth-caption cloth-caption--class class-detail__overview">
              <h1 className="class-detail__name" id="class-detail-name">{classDetail.name}</h1>
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
          </div>

          <div className="card card--borderless class-detail__summary">
            {classDetail.description && <p className="class-detail__description">{classDetail.description}</p>}
            <ClassTools viewerRole={classDetail.viewerRole} />
            <ClassLessons classDetail={classDetail} />
          </div>
        </div>
      </main>
    </div>
  )
}
