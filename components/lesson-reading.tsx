'use client'

import { Check, ChevronRight, Sparkles } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import type { Lesson } from '@/lib/types'
import { EmptyState } from '@/components/empty-state'
import { Meta, ReadingHeader, Rule } from '@/components/shared'

export default function LessonReading({ lesson }: { lesson: Lesson }) {
  const railRef = useRef<HTMLDivElement>(null)
  const [answered, setAnswered] = useState<string[]>([])

  // The rail is written through a ref in a rAF, so scrolling causes no React
  // render and no layout: only --progress and a composited transform change.
  useEffect(() => {
    const el = railRef.current
    if (!el) return
    let frame = 0
    const measure = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      el.style.setProperty('--progress', String(progress))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    measure()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // The margin note sits after the second paragraph where there is one,
  // otherwise after the first. Every paragraph renders.
  const marginNoteIndex = Math.min(1, lesson.paragraphs.length - 1)
  const thoughtCount = lesson.thoughts.length

  return (
    <div className="page-wrap lesson-page">
      <div className="reading-rail" ref={railRef} aria-hidden="true" />
      <ReadingHeader backHref="/classes" backLabel="Back to classes" title={<Meta>{lesson.week}</Meta>} />
      <main className="reading-content">
        <Meta>{lesson.sectionLabel}</Meta>
        <h1>{lesson.title}</h1>
        {lesson.quote && <p className="reading-deck">{lesson.quote}</p>}
        {lesson.reference && <Meta>{lesson.reference}</Meta>}
        <Rule />
        <div className="reading-copy">
          {lesson.paragraphs.map((paragraph, index) => (
            <Fragment key={index}>
              <p>{paragraph}</p>
              {index === marginNoteIndex && lesson.marginNote ? (
                <div className="margin-note">
                  <Sparkles size={17} />
                  <div>
                    <Meta>A thought to carry</Meta>
                    <p>{lesson.marginNote}</p>
                  </div>
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>

        {lesson.questions.length > 0 && (
          <section className="review-section">
            <div className="section-heading"><h2>Make it yours</h2></div>
            {lesson.questions.map((question, index) => {
              const isAnswered = answered.includes(question.id)
              return (
                <button
                  className={`review-question ${isAnswered ? 'answered' : ''}`}
                  key={question.id}
                  onClick={() => setAnswered(isAnswered ? answered.filter(id => id !== question.id) : [...answered, question.id])}
                >
                  <span className="review-question__mark">{isAnswered ? <Check size={16} /> : index + 1}</span>
                  <strong className="review-question__text">{question.text}</strong>
                  <ChevronRight size={18} />
                </button>
              )
            })}
          </section>
        )}

        <section className="share-section">
          <div className="section-heading">
            <h2>From the room</h2>
            {thoughtCount > 0 && <Meta>{thoughtCount === 1 ? '1 thought' : `${thoughtCount} thoughts`}</Meta>}
          </div>
          {thoughtCount > 0 ? (
            <>
              <p className="section-note">A few honest words from people walking this with you.</p>
              {lesson.thoughts.map(thoughtItem => (
                <div className="insight" key={thoughtItem.id}>
                  <div className="avatar">{thoughtItem.initials}</div>
                  <div>
                    <strong>{thoughtItem.name}</strong><Meta> {thoughtItem.timestamp}</Meta>
                    <p>{thoughtItem.text}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <EmptyState title="No thoughts yet" body="Thoughts from people in this class will gather here." />
          )}
        </section>
      </main>
    </div>
  )
}
