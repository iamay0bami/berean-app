import { notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'
import LessonReading from '@/components/lesson-reading'
import { getLesson } from '@/lib/mock-data'

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  const lesson = await getLesson(lessonId)
  if (!lesson) notFound()
  return <AppShell><LessonReading lesson={lesson} /></AppShell>
}
