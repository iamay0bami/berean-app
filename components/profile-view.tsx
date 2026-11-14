import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import ClassShelf from '@/components/class-shelf'
import { CoverCloth } from '@/components/cover-cloth'
import { Header } from '@/components/shared'
import type { ClassCatalogItem, LessonSummary, Profile, ProfileContent, ProfileInsight, ProfilePrayer } from '@/lib/types'

const ROLE_LABELS: Record<Profile['role'], string> = {
  member: 'Member',
  class_leader: 'Class leader',
  admin: 'Church administrator',
}

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <div className="section-heading profile-section__heading">
      <h2 className="card__title" id={id}>{children}</h2>
    </div>
  )
}

function ReflectionRows({ content, lessons }: {
  content: ProfileContent<ProfileInsight>
  lessons: LessonSummary[]
}) {
  const readableLessons = new Map(lessons.map(lesson => [lesson.id, lesson]))

  return (
    <ul className="profile-list card card--borderless">
      {content.items.map(insight => {
        const lesson = readableLessons.get(insight.lessonId)
        const row = (
          <>
            <span className="row__main">
              <span className="row__title profile-row__title">{lesson?.title ?? 'Reflection'}</span>
              <span className="profile-row__text">{insight.text}</span>
            </span>
            {lesson && <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />}
          </>
        )
        return (
          <li className="profile-list__item" key={insight.id}>
            {lesson
              ? <Link className="row profile-row" href={`/classes/${lesson.id}`}>{row}</Link>
              : <div className="row row--plain profile-row profile-row--static">{row}</div>}
          </li>
        )
      })}
      {content.truncated && (
        <li className="profile-list__limit-item">
          <p className="profile-list__limit">Showing your 10 most recent.</p>
        </li>
      )}
    </ul>
  )
}

function PrayerRows({ content }: { content: ProfileContent<ProfilePrayer> }) {
  return (
    <ul className="profile-list card card--borderless">
      {content.items.map(prayer => (
        <li className="profile-list__item" key={prayer.id}>
          <div className="row row--plain profile-row profile-row--static">
            <span className="row__main">
              <span className="profile-row__text">{prayer.text}</span>
            </span>
            <span className={`badge badge--${prayer.status}`}>
              <span className="badge__dot" aria-hidden="true" />
              {prayer.status === 'draft' ? 'Draft' : 'Published'}
            </span>
          </div>
        </li>
      ))}
      {content.truncated && (
        <li className="profile-list__limit-item">
          <p className="profile-list__limit">Showing your 10 most recent.</p>
        </li>
      )}
    </ul>
  )
}

export default function ProfileView({
  profile,
  classes,
  readableLessons,
  insights,
  prayers,
}: {
  profile: Profile
  classes: ClassCatalogItem[]
  readableLessons: LessonSummary[]
  insights: ProfileContent<ProfileInsight>
  prayers: ProfileContent<ProfilePrayer>
}) {
  const hasReflections = insights.items.length > 0
  const hasPrayers = prayers.items.length > 0

  return (
    <div className="page-wrap profile-page">
      <Header />
      <main className="profile-main">
        <section className="profile-identity card card--borderless" aria-labelledby="profile-name">
          <div className="profile-bookplate" aria-hidden="true">
            <span className="profile-bookplate__art"><CoverCloth seed={profile.id} variant="thumb" /></span>
            <span className="profile-bookplate__stamp">{profile.initials}</span>
          </div>
          <div className="profile-identity__copy">
            <h1 className="profile-identity__name" id="profile-name">{profile.name}</h1>
            <p className="profile-identity__church">{profile.churchName}</p>
            <p className="profile-identity__meta">{ROLE_LABELS[profile.role]} · Joined {profile.memberSinceYear}</p>
          </div>
        </section>

        <nav className="profile-section" aria-label="Profile options">
          <Link className="row profile-row card card--borderless" href="/profile/settings">
            <span className="row__main"><span className="profile-row__text">Settings</span></span>
            <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </nav>

        {classes.length > 0 && (
          <section className="profile-section" aria-labelledby="profile-classes-title">
            <SectionHeading id="profile-classes-title">Your classes</SectionHeading>
            <ClassShelf items={classes} labelledBy="profile-classes-title" idPrefix="profile-shelf" />
          </section>
        )}

        {(hasReflections || hasPrayers) && (
          <div className="profile-content-grid">
            {hasReflections && (
              <section className="profile-section profile-content-grid__section" aria-labelledby="profile-reflections-title">
                <SectionHeading id="profile-reflections-title">Your reflections</SectionHeading>
                <ReflectionRows content={insights} lessons={readableLessons} />
              </section>
            )}

            {hasPrayers && (
              <section className="profile-section profile-content-grid__section" aria-labelledby="profile-prayers-title">
                <SectionHeading id="profile-prayers-title">Your prayers</SectionHeading>
                <PrayerRows content={prayers} />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
