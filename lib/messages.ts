// Copy that has to read identically on both sides of the wire: deleteLesson refuses with this
// sentence, and the authoring form shows it as the reason its Delete button is disabled. It lives
// here rather than in app/actions.ts because that module is `'use server'`, where every export must
// be an async function — a plain constant cannot be exported from it.
//
// insights.lesson_id is ON DELETE CASCADE (0001), so without the refusal a lesson delete would
// erase members' writing along with the lesson. The wording points at the alternative that keeps
// it: unpublishing.
export const LESSON_HAS_INSIGHTS = 'Members have written thoughts on this lesson, so it can’t be deleted. Leave it unpublished instead.'
