'use client'

import { Send } from 'lucide-react'
import { useState, useTransition } from 'react'
import type { DiscussionData } from '@/lib/types'
import { EmptyState } from '@/components/empty-state'
import { Header, Meta } from '@/components/shared'
import { createDiscussion } from '@/app/actions'

export default function DiscussionView({ data }: { data: DiscussionData }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!text.trim()) return
    startTransition(async () => {
      // createDiscussion now returns { error } instead of throwing. Without this branch a
      // failed post (expired session, RLS denial) would clear the field and look successful.
      const result = await createDiscussion(text)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setText('')
    })
  }

  return (
    <div className="page-wrap">
      <Header />
      <main>
        <section className="page-intro">
          <h1>Discussions</h1>
          <p>Questions worth sitting with, together.</p>
        </section>

        <div className="discussion-prompt">
          <Meta>This week&apos;s question</Meta>
          <h2>{data.prompt}</h2>
          <div className="share-input">
            <input
              value={text}
              onChange={event => { setText(event.target.value); if (error) setError(null) }}
              placeholder="Add your thought..."
            />
            <button aria-label="Post thought" disabled={pending || !text.trim()} onClick={submit}>
              <Send size={17} />
            </button>
          </div>
        </div>
        {error && <p className="field-message error" role="alert">{error}</p>}

        <section className="discussion-feed">
          <div className="section-heading">
            <h2>Recent thoughts</h2>
            {data.entries.length > 0 && <Meta>{data.peopleCount === 1 ? '1 person' : `${data.peopleCount} people`}</Meta>}
          </div>
          {data.entries.length ? data.entries.map(entry => (
            <div className="feed-item" key={entry.id}>
              <div className="avatar gold-avatar">{entry.initials}</div>
              <div>
                <strong>{entry.name}</strong><Meta> {entry.timestamp}</Meta>
                <p>{entry.text}</p>
              </div>
            </div>
          )) : <EmptyState title="The table is quiet right now" body="When thoughts are shared, they'll gather here." />}
        </section>
      </main>
    </div>
  )
}
