'use client'

import { Heart, MessageCircle, Send } from 'lucide-react'
import { useState, useTransition } from 'react'
import type { DiscussionData } from '@/lib/types'
import { Header, Meta } from '@/components/shared'
import { createDiscussion } from '@/app/actions'

export default function DiscussionView({ data }: { data: DiscussionData }) {
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!text.trim()) return
    startTransition(async () => {
      await createDiscussion(text)
      setText('')
    })
  }

  return <div className="page-wrap"><Header /><main><section className="page-intro"><Meta>AROUND THE TABLE</Meta><h1>Discussions</h1><p>Questions worth sitting with, together.</p></section><div className="discussion-prompt"><Meta>THIS WEEK&apos;S QUESTION</Meta><h2>{data.prompt}</h2><div className="share-input"><input value={text} onChange={event => setText(event.target.value)} placeholder="Add your thought..." /><button aria-label="Post thought" disabled={pending || !text.trim()} onClick={submit}><Send size={17} /></button></div></div><section className="discussion-feed"><div className="section-heading"><h2>Recent thoughts</h2><Meta>{data.peopleCount} PEOPLE</Meta></div>{data.entries.map(entry => <div className="feed-item" key={entry.id}><div className="avatar gold-avatar">{entry.initials}</div><div><strong>{entry.name}</strong><Meta> {entry.timestamp}</Meta><p>{entry.text}</p><div className="insight-actions"><Heart size={15} /> {entry.hearts} <MessageCircle size={15} /> Reply</div></div></div>)}</section></main></div>
}
