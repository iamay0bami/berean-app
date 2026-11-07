import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import ClassShelf from '@/components/class-shelf'
import { CoverCloth } from '@/components/cover-cloth'
import { Header } from '@/components/shared'
import type { ClassCatalogItem, HomeLessonHighlights, LessonSummary, PrayerPoint, Sermon } from '@/lib/types'

export default function HomeView({
  lesson,
  highlights,
  classes,
  sermon,
  discussionPrompt,
  prayer,
  firstName,
  dateLabel,
}: {
  lesson?: LessonSummary
  highlights?: HomeLessonHighlights
  classes: ClassCatalogItem[]
  sermon?: Sermon
  discussionPrompt?: string
  prayer?: PrayerPoint
  firstName: string | null
  dateLabel: string
}) {
  const myClasses = classes.filter(item => item.isMine)
  const shelfItems = myClasses.length ? myClasses : classes
  const classSectionTitle = myClasses.length ? 'Your classes' : 'Classes at your church'
  const lessonHref = lesson ? `/classes/${lesson.id}` : undefined
  const verse = highlights?.quote && highlights.reference
    ? { quote: highlights.quote, reference: highlights.reference }
    : undefined
  const question = lessonHref ? highlights?.question : undefined
  const thought = lessonHref ? highlights?.thought : undefined
  const hasReflections = Boolean(question || thought || prayer)
  const sermonMeta = sermon ? [sermon.date, sermon.speaker].filter(Boolean).join(' · ') : ''

  return (
    <div className="page-wrap home-page">
      <Header />
      <main className="home-main">
        <section className="home-welcome" aria-labelledby="home-title">
          <p className="home-welcome__date">{dateLabel}</p>
          <h1 className="home-welcome__title" id="home-title">
            Welcome back{firstName ? <>, <bdi className="home-welcome__name">{firstName}</bdi></> : null}.
          </h1>
        </section>

        <section className="home-section" aria-labelledby="home-latest-title">
          <div className="section-heading home-section__heading">
            <h2 className="card__title" id="home-latest-title">Latest lesson</h2>
          </div>
          {lesson && lessonHref ? (
            <Link className="row home-latest card card--borderless" href={lessonHref}>
              <span className="home-latest__band" aria-hidden="true">
                <span className="home-latest__band-art"><CoverCloth seed={lesson.id} variant="strip" /></span>
              </span>
              <span className="folio">{lesson.number}</span>
              <span className="row__main">
                <span className="row__title home-latest__title">{lesson.title}</span>
                {(lesson.week || lesson.duration) && (
                  <span className="row__meta">{[lesson.week, lesson.duration].filter(Boolean).join(' · ')}</span>
                )}
              </span>
              <ChevronRight className="row__action" size={20} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          ) : (
            <p className="home-note">A published lesson will appear here when one is available to you.</p>
          )}
        </section>

        {verse && (
          <section className="home-section" aria-labelledby="home-verse-title">
            <div className="section-heading home-section__heading">
              <h2 className="card__title" id="home-verse-title">This week’s verse</h2>
            </div>
            <blockquote className="home-verse card card--borderless">
              <p className="reading-deck--scripture home-verse__quote">“{verse.quote}”</p>
              <cite className="home-verse__reference">— {verse.reference}</cite>
            </blockquote>
          </section>
        )}

        <section className="home-section" aria-labelledby="home-classes-title">
          <div className="section-heading home-section__heading">
            <h2 className="card__title" id="home-classes-title">{classSectionTitle}</h2>
          </div>
          {shelfItems.length ? (
            <ClassShelf items={shelfItems} labelledBy="home-classes-title" idPrefix="home-shelf" />
          ) : (
            <p className="home-note">Classes will appear here after they’re added.</p>
          )}
        </section>

        <section className="home-section" aria-labelledby="home-week-title">
          <div className="section-heading home-section__heading">
            <h2 className="card__title" id="home-week-title">For your week</h2>
          </div>
          <div className="home-destinations">
            <Link className="home-destination card card--borderless" href={sermon ? `/sermons/${sermon.id}` : '/sermons'}>
              <span className="home-destination__top">
                <span className="home-destination__label">Sermons</span>
                <ChevronRight className="home-destination__chevron" size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="home-destination__panel">
                {sermon ? (
                  <>
                    <span className="home-destination__title">{sermon.title}</span>
                    {sermonMeta && <span className="home-destination__meta">{sermonMeta}</span>}
                  </>
                ) : (
                  <span className="home-destination__empty">No sermon notes have been published yet.</span>
                )}
              </span>
            </Link>

            <Link className="home-destination card card--borderless" href="/discuss">
              <span className="home-destination__top">
                <span className="home-destination__label">Community</span>
                <ChevronRight className="home-destination__chevron" size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="home-destination__panel">
                {discussionPrompt ? (
                  <span className="home-destination__prompt">{discussionPrompt}</span>
                ) : (
                  <span className="home-destination__empty">No discussion prompt has been published yet.</span>
                )}
              </span>
            </Link>
          </div>
        </section>

        {hasReflections && (
          <div className="home-reflections">
            {question && lessonHref && (
              <section className="home-section home-reflections__section" aria-labelledby="home-question-title">
                <div className="section-heading home-section__heading">
                  <h2 className="card__title" id="home-question-title">A question to sit with</h2>
                </div>
                <Link className="home-reflection-link card card--borderless" href={lessonHref}>
                  <span className="home-question__text">{question.text}</span>
                  <span className="home-link-cue">Open lesson <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                </Link>
              </section>
            )}

            {thought && lessonHref && (
              <section className="home-section home-reflections__section" aria-labelledby="home-thought-title">
                <div className="section-heading home-section__heading">
                  <h2 className="card__title" id="home-thought-title">A thought on this week’s lesson</h2>
                </div>
                <Link className="home-reflection-link home-thought card card--borderless" href={lessonHref}>
                  <span className="home-thought__byline">
                    <span className="home-thought__author">{thought.name}</span>
                    <span className="home-thought__time">{thought.timestamp}</span>
                  </span>
                  <span className="home-thought__text">{thought.text}</span>
                  <span className="home-link-cue">Read lesson <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                </Link>
              </section>
            )}

            {prayer && (
              <section className="home-section home-reflections__section home-reflections__section--prayer" aria-labelledby="home-prayer-title">
                <div className="section-heading home-section__heading">
                  <h2 className="card__title" id="home-prayer-title">Prayer corner</h2>
                </div>
                <div className="home-prayer card card--borderless">
                  <p className="home-prayer__text">“{prayer.text}”</p>
                  <p className="home-prayer__meta">— {prayer.name} · {prayer.time}</p>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
