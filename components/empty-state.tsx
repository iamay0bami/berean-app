import type { ReactNode } from 'react'

// An empty state invites action. The eyebrow prop is gone: the page heading
// already names the surface, and repeating it above the empty title produced a
// duplicated heading on Sermons.
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string
  body?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`empty${className ? ` ${className}` : ''}`}>
      <h2 className="empty__title">{title}</h2>
      {body && <p className="empty__body">{body}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  )
}
