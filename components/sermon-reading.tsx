import { ArrowLeft, Bookmark, Heart } from 'lucide-react'
import Link from 'next/link'
import type { Sermon } from '@/lib/types'
import { Meta, Rule } from '@/components/shared'

export default function SermonReading({ sermon }: { sermon: Sermon }) {
  return <div className="page-wrap"><header className="reading-header"><Link className="icon-button" href="/sermons" aria-label="Back"><ArrowLeft size={20} /></Link><Meta>SERMON NOTE</Meta><button className="icon-button" aria-label="Bookmark"><Bookmark size={19} /></button></header><main className="reading-content sermon-reading"><Meta>{sermon.detailDate} · {sermon.speaker.toUpperCase()}</Meta><h1>The Table<br /><em>Is Still Set.</em></h1><p className="reading-deck">{sermon.text}</p><Rule /><div className="reading-copy"><p>{sermon.paragraphs[0]}</p><p>{sermon.paragraphs[1]}</p><div className="margin-note"><Heart size={17} /><div><Meta>THE LINE I&apos;M KEEPING</Meta><p>{sermon.marginNote}</p></div></div><p>{sermon.closing}</p></div></main></div>
}
