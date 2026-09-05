import { Meta } from '@/components/shared'

export function EmptyState({ eyebrow, title, body, className }: { eyebrow?: string; title: string; body?: string; className?: string }) {
  return <div className={`empty-state${className ? ` ${className}` : ''}`}>{eyebrow && <Meta>{eyebrow}</Meta>}<h2>{title}</h2>{body && <p>{body}</p>}</div>
}
