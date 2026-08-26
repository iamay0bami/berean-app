'use client'

import { ArrowLeft, Bookmark, Check, ChevronRight, Heart, MoreHorizontal, Send, Share2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Lesson } from '@/lib/types'
import { Meta, Rule } from '@/components/shared'

export default function LessonReading({ lesson }: { lesson: Lesson }) {
  const [progress, setProgress] = useState(18)
  const [answered, setAnswered] = useState<string[]>([])
  const [thought, setThought] = useState('')

  useEffect(() => {
    const fn = () => setProgress(Math.min(100, Math.max(18, Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100))))
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const [firstParagraph, secondParagraph, thirdParagraph] = lesson.paragraphs
  return <div className="page-wrap lesson-page"><div className="bookmark-ribbon" style={{ height: `${Math.max(64, 220 - progress * 1.3)}px` }}><Bookmark size={18} fill="currentColor" /><span>{progress}%</span></div><header className="reading-header"><Link className="icon-button" href="/classes" aria-label="Back to classes"><ArrowLeft size={20} /></Link><Meta>{lesson.track === 'foundations' ? 'FOUNDATIONS' : 'GOING DEEPER'} · {lesson.week}</Meta><button className="icon-button" aria-label="More options"><MoreHorizontal size={20} /></button></header><main className="reading-content"><Meta>{lesson.sectionLabel}</Meta><h1>{lesson.id === 'a-faith-that-listens' ? <>A faith<br /><em>that listens.</em></> : lesson.title}</h1><p className="reading-deck">{lesson.quote}</p><Meta>{lesson.reference}</Meta><Rule /><div className="reading-copy"><p>{firstParagraph}</p>{secondParagraph && <p>{secondParagraph}</p>}<div className="margin-note"><Sparkles size={17} /><div><Meta>A THOUGHT TO CARRY</Meta><p>{lesson.marginNote}</p></div></div>{thirdParagraph && <p>{thirdParagraph}</p>}</div><section className="review-section"><div className="section-heading"><h2>Make it yours</h2><Meta>REFLECT</Meta></div>{lesson.questions.map((question, i) => { const isAnswered = answered.includes(question.id); return <button className={`review-question ${isAnswered ? 'answered' : ''}`} key={question.id} onClick={() => setAnswered(isAnswered ? answered.filter(id => id !== question.id) : [...answered, question.id])}><span>{isAnswered ? <Check size={16} /> : i + 1}</span><strong>{question.text}</strong><ChevronRight size={18} /></button> })}</section><section className="share-section"><div className="section-heading"><h2>From the room</h2><Meta>3 THOUGHTS</Meta></div><p className="section-note">A few honest words from people walking this with you.</p>{lesson.thoughts.map(thoughtItem => <div className="insight" key={thoughtItem.id}><div className="avatar">{thoughtItem.initials}</div><div><strong>{thoughtItem.name}</strong><Meta> {thoughtItem.timestamp}</Meta><p>{thoughtItem.text}</p><div className="insight-actions"><Heart size={15} /> {thoughtItem.hearts} <Share2 size={15} /> Share</div></div></div>)}<div className="composer"><textarea value={thought} onChange={event => setThought(event.target.value)} placeholder="What are you noticing?" aria-label="Share your thought" /><button className="send-button" aria-label="Share this thought" onClick={() => setThought('')}><Send size={17} /></button></div></section></main></div>
}
