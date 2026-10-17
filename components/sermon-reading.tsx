import { Sparkles } from 'lucide-react'
import { Fragment } from 'react'
import type { Sermon } from '@/lib/types'
import { Meta, ReadingHeader, Rule } from '@/components/shared'

export default function SermonReading({ sermon }: { sermon: Sermon }) {
  // The margin note sits after the second paragraph where there is one,
  // otherwise after the first. Every paragraph renders — the old version
  // dropped everything from the third onward.
  const marginNoteIndex = Math.min(1, sermon.paragraphs.length - 1)
  return (
    <div className="page-wrap">
      <ReadingHeader backHref="/sermons" backLabel="Back to sermons" title={<Meta>Sermon note</Meta>} />
      <main className="reading-content sermon-reading">
        <Meta>{sermon.detailDate} · {sermon.speaker}</Meta>
        <h1>{sermon.title}</h1>
        <p className="reading-deck">{sermon.text}</p>
        <Rule />
        <div className="reading-copy">
          {sermon.paragraphs.map((paragraph, index) => (
            <Fragment key={index}>
              <p>{paragraph}</p>
              {index === marginNoteIndex && sermon.marginNote ? (
                <div className="margin-note">
                  <Sparkles size={17} />
                  <div>
                    <Meta>The line I&apos;m keeping</Meta>
                    <p>{sermon.marginNote}</p>
                  </div>
                </div>
              ) : null}
            </Fragment>
          ))}
          {sermon.closing && <p>{sermon.closing}</p>}
        </div>
      </main>
    </div>
  )
}
