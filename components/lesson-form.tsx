'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { FormEvent, MouseEvent, useRef, useState, useTransition } from 'react'
import { createLesson, deleteLesson, publishLesson, saveLessonQuestions, unpublishLesson, updateLesson } from '@/app/actions'
import type { LessonInput } from '@/app/actions'
import { LESSON_HAS_INSIGHTS } from '@/lib/messages'
import { Header, Meta } from '@/components/shared'
import type { ActiveClass, LessonEdit, LessonEditQuestion } from '@/lib/types'

// The client-only identity of a repeater row. Saved questions use their database id; a
// question that has not been saved yet has none, so it gets a uuid. Keying on the array
// index instead would break input focus the moment a row is reordered.
type QuestionDraft = { key: string; id?: string; text: string; insightCount: number }

function toDraft(question: LessonEditQuestion): QuestionDraft {
  return { key: question.id, id: question.id, text: question.text, insightCount: question.insightCount }
}

function blankDraft(): QuestionDraft {
  return { key: crypto.randomUUID(), text: '', insightCount: 0 }
}

// `classOptions` always contains the lesson's own class — the page unions it back in when
// the class is deactivated and so absent from getActiveClasses(). Without that, a select
// whose value matches no option silently falls back to the first one, which would move the
// lesson on the next save. A leader gets `fixedClass` and no selector at all.
export default function LessonForm({ lesson, classOptions, fixedClass }: { lesson: LessonEdit | null; classOptions: ActiveClass[]; fixedClass: ActiveClass | null }) {
  // The duplicate guard. createLesson may run at most once per component lifetime: after
  // the first success every submit updates instead, so a retry can never create a second
  // lesson. The URL is moved to the edit page at the same moment (see persist()).
  const lessonId = useRef<string | null>(lesson?.id ?? null)
  // Not state: a status change always reloads the page, which remounts this component with
  // a fresh server-fetched lesson.
  const status = lesson?.status ?? 'draft'
  const [classId, setClassId] = useState(lesson?.class_id ?? fixedClass?.id ?? classOptions[0]?.id ?? '')
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [week, setWeek] = useState(lesson?.week ?? '')
  const [number, setNumber] = useState(lesson?.number ?? '')
  const [excerpt, setExcerpt] = useState(lesson?.excerpt ?? '')
  const [duration, setDuration] = useState(lesson?.duration ?? '')
  const [sectionLabel, setSectionLabel] = useState(lesson?.section_label ?? '')
  const [quote, setQuote] = useState(lesson?.quote ?? '')
  const [reference, setReference] = useState(lesson?.reference ?? '')
  const [body, setBody] = useState((lesson?.paragraphs ?? []).join('\n\n'))
  const [marginNote, setMarginNote] = useState(lesson?.margin_note ?? '')
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => (lesson?.questions ?? []).map(toDraft))
  const [pendingKey, setPendingKey] = useState<'save' | 'publish' | 'unpublish' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Every thought on the lesson, from the server. Deliberately the lesson-level count and not a
  // sum of `questions[].insightCount`: insights.question_id is nullable, so thoughts written
  // without a question — and thoughts orphaned when their question was deleted — sit on no
  // question at all. Summing the per-question counts would miss them and leave Delete enabled on
  // a lesson deleteLesson refuses.
  const thoughtCount = lesson?.insightCount ?? 0
  // Delete exists only for a lesson that has already been saved and is not published. `lesson` is
  // null on /author/lessons/new, which is what keeps the create form free of a delete affordance,
  // and a published lesson is refused by the action, so offering the button would be a dead end.
  const draftLesson = lesson !== null && status === 'draft'
  const canDelete = draftLesson && thoughtCount === 0

  // Server-fetched state, so a successful mutation reloads rather than patching local
  // state — the approach class-manage-view and admin-classes-view take.
  function run(key: 'save' | 'publish' | 'unpublish', action: () => Promise<{ error: string | null }>) {
    setError(null)
    setPendingKey(key)
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setError(result.error)
        setPendingKey(null)
        return
      }
      window.location.reload()
    })
  }

  function readFields(): LessonInput {
    return {
      class_id: classId, title, week, number, excerpt, duration, section_label: sectionLabel,
      quote, reference,
      // Blank lines separate paragraphs. Lossless round trip: the textarea below is seeded
      // with the same join('\n\n').
      paragraphs: body.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean),
      margin_note: marginNote,
    }
  }

  // Saves the fields, then the questions, and stops at the first error — a failed field
  // save must never be followed by a question save, and a failed question save must never
  // be followed by a publish.
  async function persist(): Promise<{ error: string | null; id: string | null }> {
    const fields = readFields()
    let id = lessonId.current
    if (!id) {
      const created = await createLesson(fields)
      if (created.error || !created.id) return { error: created.error ?? 'Unable to create this lesson.', id: null }
      id = created.id
      lessonId.current = id
      // The lesson exists now, so the URL must say so before anything else runs. If a later
      // step fails, the author is left on the edit page holding a saved draft, rather than
      // on /new where a reload or retry would create a duplicate. replaceState rather than
      // router.replace because a Next navigation unmounts this component and would lose
      // both the in-flight steps and the error message below.
      window.history.replaceState(null, '', `/author/lessons/${id}`)
    } else {
      const updated = await updateLesson(id, fields)
      if (updated.error) return { error: updated.error, id }
    }
    const saved = await saveLessonQuestions(id, questions.map(question => ({ id: question.id, text: question.text })))
    if (saved.error) return { error: saved.error, id }
    return { error: null, id }
  }

  // Only a change of class on a PUBLISHED lesson needs confirming: it rewrites who can read
  // the lesson immediately — members of the old class lose it, members of the new class gain
  // it. A draft is visible to authors only.
  function classChangeAllowed() {
    if (!lesson || lesson.status !== 'published' || lesson.class_id === classId) return true
    return window.confirm('This lesson is published. Moving it to another class changes who can read it straight away — members of the current class will lose it, and members of the new class will gain it.')
  }

  function saveDraft() {
    if (!classChangeAllowed()) return
    run('save', async () => ({ error: (await persist()).error }))
  }

  function publish(event: MouseEvent<HTMLButtonElement>) {
    // Publish and Unpublish are type="button", so native validation runs only for Save
    // draft, the form's submit. Without this the confirm would fire on an empty form and
    // the problem would surface as a server error instead of pointing at the field. The
    // action stays the backstop.
    if (!event.currentTarget.form?.reportValidity()) return
    if (!classChangeAllowed()) return
    if (!window.confirm(`Publish "${title.trim() || 'this lesson'}"? It will become visible to every member of its class.`)) return
    run('publish', async () => {
      const saved = await persist()
      if (saved.error || !saved.id) return { error: saved.error ?? 'Unable to save this lesson.' }
      return await publishLesson(saved.id)
    })
  }

  function unpublish(event: MouseEvent<HTMLButtonElement>) {
    if (!event.currentTarget.form?.reportValidity()) return
    if (!classChangeAllowed()) return
    if (!window.confirm(`Move "${title.trim() || 'this lesson'}" back to draft? Members will no longer see it.`)) return
    run('unpublish', async () => {
      const saved = await persist()
      if (saved.error || !saved.id) return { error: saved.error ?? 'Unable to save this lesson.' }
      return await unpublishLesson(saved.id)
    })
  }

  // Deliberately NOT through persist(): re-saving every field and question first would be
  // pointless work on a row that is about to disappear, and persist()'s create branch is a
  // duplicate-lesson hazard this button must never reach. For the same reason it does not use
  // run(), whose success path reloads the current URL — after a delete that URL is a lesson that
  // no longer exists. The list is the honest destination, and window.location.assign is how the
  // other post-mutation navigations in this app move (there is no useRouter in any component).
  //
  // canDelete re-states the button's own condition because the action is the authority: the
  // server re-checks all three, and this guard only keeps a mistimed click from firing.
  function removeLesson() {
    if (!lesson || !canDelete) return
    if (!window.confirm(`Delete "${lesson.title}"? This can't be undone.`)) return
    setError(null)
    setPendingKey('delete')
    startTransition(async () => {
      const result = await deleteLesson(lesson.id)
      if (result.error) {
        setError(result.error)
        setPendingKey(null)
        return
      }
      window.location.assign('/author/lessons')
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveDraft()
  }

  function updateQuestion(key: string, text: string) {
    setQuestions(current => current.map(question => (question.key === key ? { ...question, text } : question)))
  }

  function moveQuestion(index: number, delta: -1 | 1) {
    setQuestions(current => {
      const target = index + delta
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      next[index] = current[target]
      next[target] = current[index]
      return next
    })
  }

  // Only a saved question can have thoughts attached, and only a count above zero is worth
  // interrupting for — a question added a minute ago has no id and no count. The wording
  // says "on save" deliberately: insights.question_id is ON DELETE SET NULL, so nothing is
  // detached until the save lands, and even then the thoughts themselves survive.
  function removeQuestion(question: QuestionDraft) {
    if (question.id && question.insightCount > 0) {
      const attached = question.insightCount === 1 ? '1 thought is' : `${question.insightCount} thoughts are`
      if (!window.confirm(`${attached} attached to this question. Saving will detach them from the question — the thoughts themselves are kept.`)) return
    }
    setQuestions(current => current.filter(item => item.key !== question.key))
  }

  return <div className="page-wrap"><Header /><main>
    <section className="page-intro"><h1>{lesson ? 'Edit lesson' : 'New lesson'}</h1><p>{lesson ? 'Change anything and save, or change the lesson’s status.' : 'Write a lesson, save it as a draft, and publish it when it is ready.'}</p></section>

    <form className="paper-card class-form" onSubmit={submit}>
      {fixedClass
        ? <div className="member-control"><Meta>Class</Meta><p className="muted-value">{fixedClass.name}</p></div>
        : <label className="member-control"><Meta>Class</Meta><select required value={classId} onChange={event => setClassId(event.target.value)}>{classOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}

      <label className="member-control"><Meta>Title</Meta><input required value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label className="member-control"><Meta>Week</Meta><input required value={week} onChange={event => setWeek(event.target.value)} placeholder="Week 3" /></label>
      <label className="member-control"><Meta>Number</Meta><input required type="number" min="1" max="99" step="1" value={number} onChange={event => setNumber(event.target.value)} /></label>
      <label className="member-control"><Meta>Excerpt</Meta><textarea value={excerpt} onChange={event => setExcerpt(event.target.value)} /></label>
      <label className="member-control"><Meta>Duration</Meta><input value={duration} onChange={event => setDuration(event.target.value)} placeholder="8 min read" /></label>
      <label className="member-control"><Meta>Section label</Meta><input value={sectionLabel} onChange={event => setSectionLabel(event.target.value)} placeholder="FOUNDATIONS" /></label>
      <label className="member-control"><Meta>Quote</Meta><textarea value={quote} onChange={event => setQuote(event.target.value)} /></label>
      <label className="member-control"><Meta>Reference</Meta><input value={reference} onChange={event => setReference(event.target.value)} placeholder="John 10:27" /></label>
      <label className="member-control"><Meta>Body</Meta><textarea className="body-field" required value={body} onChange={event => setBody(event.target.value)} /><span className="auth-note">Separate paragraphs with a blank line.</span></label>
      <label className="member-control"><Meta>Margin note</Meta><textarea value={marginNote} onChange={event => setMarginNote(event.target.value)} /></label>

      <div className="question-repeater">
        <Meta>Questions</Meta>
        {questions.map((question, index) => <div className="question-row" key={question.key}>
          <label className="member-control"><Meta>{`Question ${index + 1}`}</Meta><textarea value={question.text} onChange={event => updateQuestion(question.key, event.target.value)} /></label>
          <div className="question-row-actions">
            <button className="text-action" type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label={`Move question ${index + 1} up`}><ChevronUp size={16} /></button>
            <button className="text-action" type="button" disabled={index === questions.length - 1} onClick={() => moveQuestion(index, 1)} aria-label={`Move question ${index + 1} down`}><ChevronDown size={16} /></button>
            <button className="text-action" type="button" onClick={() => removeQuestion(question)}>Remove</button>
          </div>
        </div>)}
        {questions.length ? null : <p className="auth-note">No questions yet.</p>}
      </div>

      <div className="class-form-actions">
        <button className="primary-button" type="submit" disabled={isPending}>{pendingKey === 'save' ? 'Saving...' : status === 'published' ? 'Save changes' : 'Save draft'}</button>
        <button className="outline-button" type="button" disabled={isPending} onClick={publish}>{pendingKey === 'publish' ? 'Publishing...' : 'Publish'}</button>
        {status === 'published' && <button className="outline-button" type="button" disabled={isPending} onClick={unpublish}>{pendingKey === 'unpublish' ? 'Unpublishing...' : 'Unpublish'}</button>}
        <button className="outline-button" type="button" disabled={isPending} onClick={() => setQuestions(current => [...current, blankDraft()])}>Add question</button>
      </div>

      {/* Its own row, below the primary actions rather than a fifth button inside them. Delete used
          to sit directly after Add question, one slip away from Publish — and a confirm dialog is a
          safety net for a misclick, not a substitute for not putting the misclick there. The whole
          row is gated on draftLesson so /new and a published lesson render no empty bordered row.

          The reason is visible text beside the button, not a title or tooltip: a disabled button is
          not focusable, so anything attached to it would announce nothing, and a tooltip is
          unreachable on touch. The author has to be told why the button they can see is dead. */}
      {draftLesson && <div className="danger-row">
        <button className="danger-button" type="button" disabled={isPending || thoughtCount > 0} onClick={removeLesson}>{pendingKey === 'delete' ? 'Deleting...' : 'Delete lesson'}</button>
        {thoughtCount > 0 && <p className="auth-note">{LESSON_HAS_INSIGHTS}</p>}
      </div>}

      {error && <p className="field-message error" role="status">{error}</p>}
    </form>
  </main></div>
}
