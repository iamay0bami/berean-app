import { headers } from 'next/headers'
import AppShell from '@/components/app-shell'
import HomeView from '@/components/home-view'
import { dateLabel, safeTimeZone } from '@/lib/greeting'
import {
  getClassCatalog,
  getHomeLessonHighlights,
  getLatestDiscussionPrompt,
  getLatestLesson,
  getPrayerPoints,
  getSermons,
  getViewer,
} from '@/lib/mock-data'

export default async function HomePage() {
  const latestLessonPromise = getLatestLesson()
  const highlightsPromise = latestLessonPromise.then(lesson => (
    lesson ? getHomeLessonHighlights(lesson.id) : undefined
  ))

  const [lesson, highlights, classes, sermons, discussionPrompt, prayers, viewer, tzHeader] = await Promise.all([
    latestLessonPromise,
    highlightsPromise,
    getClassCatalog(),
    getSermons(1),
    getLatestDiscussionPrompt(),
    getPrayerPoints(1),
    getViewer(),
    headers().then(incoming => incoming.get('x-vercel-ip-timezone')),
  ])
  const timeZone = safeTimeZone(tzHeader)

  return (
    <AppShell>
      <HomeView
        lesson={lesson}
        highlights={highlights}
        classes={classes}
        sermon={sermons[0]}
        discussionPrompt={discussionPrompt}
        prayer={prayers[0]}
        firstName={viewer.firstName}
        dateLabel={dateLabel(timeZone)}
      />
    </AppShell>
  )
}
