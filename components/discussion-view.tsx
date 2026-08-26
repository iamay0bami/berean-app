'use client'

import { Heart, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import type { DiscussionData } from '@/lib/types'
import { Header, Meta } from '@/components/shared'

export default function DiscussionView({ data }: { data: DiscussionData }) {
  const [joined, setJoined] = useState(false)
  return <div className="page-wrap"><Header /><main><section className="page-intro"><Meta>AROUND THE TABLE</Meta><h1>Discussions</h1><p>Questions worth sitting with, together.</p></section><div className="discussion-prompt"><Meta>THIS WEEK&apos;S QUESTION</Meta><h2>{data.prompt}</h2><button className="primary-button" onClick={() => setJoined(!joined)}>{joined ? 'You&apos;re in the conversation' : 'Join the conversation'} <MessageCircle size={16} /></button></div><section className="discussion-feed"><div className="section-heading"><h2>Recent thoughts</h2><Meta>{data.peopleCount} PEOPLE</Meta></div>{data.entries.map(entry => <div className="feed-item" key={entry.id}><div className={`avatar ${entry.id === 'rachel-k' ? 'sage-avatar' : 'gold-avatar'}`}>{entry.initials}</div><div><strong>{entry.name}</strong><Meta> {entry.timestamp}</Meta><p>{entry.text}</p><div className="insight-actions"><Heart size={15} /> {entry.hearts} <MessageCircle size={15} /> Reply</div></div></div>)}</section></main></div>
}
