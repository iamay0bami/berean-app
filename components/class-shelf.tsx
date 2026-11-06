import Link from 'next/link'
import { CoverCloth } from '@/components/cover-cloth'
import type { ClassCatalogItem } from '@/lib/types'

const leaderList = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })

export function fullLeaderSummary(item: ClassCatalogItem) {
  return item.leaders.length
    ? `Led by ${leaderList.format(item.leaders.map(leader => leader.name))}`
    : item.leaderSummary
}

export default function ClassShelf({ items, labelledBy, idPrefix }: {
  items: ClassCatalogItem[]
  labelledBy: string
  idPrefix: string
}) {
  return (
    <ul className="class-shelf" aria-labelledby={labelledBy}>
      {items.map(item => (
        <li className="class-shelf__item" key={item.id}>
          <Link
            className="cloth-cover card card--plate card--borderless class-shelf__link"
            href={`/class/${item.id}`}
            aria-labelledby={`${idPrefix}-title-${item.id}`}
            aria-describedby={`${idPrefix}-leaders-${item.id}`}
          >
            <div className="cloth-frame class-shelf__art"><CoverCloth seed={item.id} variant="cover" /></div>
            <div className="cloth-caption cloth-caption--class">
              <h3 className="cloth-caption__title" id={`${idPrefix}-title-${item.id}`}>{item.name}</h3>
              <p className="cloth-caption__leaders" aria-hidden="true">{item.leaderSummary}</p>
            </div>
            <span className="sr-only" id={`${idPrefix}-leaders-${item.id}`}>{fullLeaderSummary(item)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
