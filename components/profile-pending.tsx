import { EmptyState } from '@/components/empty-state'
import { Header } from '@/components/shared'

export default function ProfilePending() {
  return <div className="page-wrap"><Header /><main><EmptyState eyebrow="PROFILE" title="Your profile is still being set up" body="It should appear any moment. Try again shortly." /></main></div>
}
