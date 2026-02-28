import { useMemo, useState } from 'react'
import { adminCoursesApi, type LessonPayload } from '../../../../api/adminCourses.api'

type AdminLang = 'vi' | 'en' | 'de'

type Props = {
  open: boolean
  lang: AdminLang
  courseId: number
  onClose: () => void
  onCreated: () => Promise<void> | void
}

type I18n = Record<AdminLang, string>

const emptyI18n = (): I18n => ({ vi: '', en: '', de: '' })
const slugify = (input: string) => input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')

export function CreateLessonModal({ open, lang, courseId, onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lessonStt, setLessonStt] = useState('1')
  const [lessonTitle, setLessonTitle] = useState<I18n>(() => emptyI18n())
  const [lessonDescription, setLessonDescription] = useState<I18n>(() => emptyI18n())
  const [moduleStt, setModuleStt] = useState('1')
  const [moduleTitle, setModuleTitle] = useState<I18n>(() => emptyI18n())
  const [moduleDescription, setModuleDescription] = useState<I18n>(() => emptyI18n())
  const [videoStt, setVideoStt] = useState('1')
  const [videoTitle, setVideoTitle] = useState<I18n>(() => emptyI18n())
  const [videoDescription, setVideoDescription] = useState<I18n>(() => emptyI18n())
  const [videoSource, setVideoSource] = useState('')

  const t = useMemo(() => {
    if (lang === 'en') return { title: 'Create lesson', create: 'Create', close: 'Close', invalid: 'Please fill all required fields for lesson, module, and video/image.' }
    if (lang === 'de') return { title: 'Lektion erstellen', create: 'Erstellen', close: 'Schließen', invalid: 'Bitte alle Pflichtfelder für Lektion, Modul und Video/Bild ausfüllen.' }
    return { title: 'Tạo bài học', create: 'Tạo mới', close: 'Đóng', invalid: 'Vui lòng nhập đầy đủ thông tin bài học, module và video/ảnh.' }
  }, [lang])

  const reset = () => {
    setError('')
    setLessonStt('1'); setModuleStt('1'); setVideoStt('1')
    setLessonTitle(emptyI18n()); setLessonDescription(emptyI18n())
    setModuleTitle(emptyI18n()); setModuleDescription(emptyI18n())
    setVideoTitle(emptyI18n()); setVideoDescription(emptyI18n())
    setVideoSource('')
  }

  if (!open) return null

  const submit = async () => {
    if (!lessonTitle.vi.trim() || !moduleTitle.vi.trim() || !videoTitle.vi.trim() || !videoSource.trim()) {
      setError(t.invalid)
      return
    }
    const sttLesson = Number(lessonStt)
    const sttModule = Number(moduleStt)
    const sttVideo = Number(videoStt)
    if (!Number.isFinite(sttLesson) || !Number.isFinite(sttModule) || !Number.isFinite(sttVideo)) {
      setError(t.invalid)
      return
    }

    const payload: LessonPayload = {
      title: lessonTitle.vi,
      slug: slugify(lessonTitle.vi),
      description: lessonDescription.vi || undefined,
      stt: sttLesson,
      translations: {
        vi: { title: lessonTitle.vi, description: lessonDescription.vi || undefined },
        en: { title: lessonTitle.en || lessonTitle.vi, description: lessonDescription.en || undefined },
        de: { title: lessonTitle.de || lessonTitle.vi, description: lessonDescription.de || undefined },
      },
      modules: [{
        title: moduleTitle.vi,
        description: moduleDescription.vi || undefined,
        stt: sttModule,
        translations: {
          vi: { title: moduleTitle.vi, description: moduleDescription.vi || undefined },
          en: { title: moduleTitle.en || moduleTitle.vi, description: moduleDescription.en || undefined },
          de: { title: moduleTitle.de || moduleTitle.vi, description: moduleDescription.de || undefined },
        },
        videos: [{
          title: videoTitle.vi,
          description: videoDescription.vi || undefined,
          stt: sttVideo,
          sourceUrl: videoSource,
          translations: {
            vi: { title: videoTitle.vi, description: videoDescription.vi || undefined },
            en: { title: videoTitle.en || videoTitle.vi, description: videoDescription.en || undefined },
            de: { title: videoTitle.de || videoTitle.vi, description: videoDescription.de || undefined },
          },
        }],
      }],
    }

    setSubmitting(true)
    try {
      await adminCoursesApi.createLesson(courseId, payload)
      await onCreated()
      reset()
      onClose()
    } catch (e: any) {
      setError(e?.message || t.invalid)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='admin-modal-backdrop' role='dialog' aria-modal='true' onClick={() => { reset(); onClose() }}>
      <div className='admin-modal create-course-modal' onClick={(e) => e.stopPropagation()}>
        <div className='admin-modal-header'><h3>{t.title}</h3></div>
        <div className='admin-modal-body'>
          {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
          <div className='admin-grid-2'>
            <input className='admin-input' placeholder='STT lesson *' value={lessonStt} onChange={(e) => setLessonStt(e.target.value)} />
            <input className='admin-input' placeholder='Lesson title VI *' value={lessonTitle.vi} onChange={(e) => setLessonTitle((p) => ({ ...p, vi: e.target.value }))} />
            <input className='admin-input' placeholder='Lesson title EN' value={lessonTitle.en} onChange={(e) => setLessonTitle((p) => ({ ...p, en: e.target.value }))} />
            <input className='admin-input' placeholder='Lesson title DE' value={lessonTitle.de} onChange={(e) => setLessonTitle((p) => ({ ...p, de: e.target.value }))} />
            <input className='admin-input' placeholder='STT module *' value={moduleStt} onChange={(e) => setModuleStt(e.target.value)} />
            <input className='admin-input' placeholder='Module title VI *' value={moduleTitle.vi} onChange={(e) => setModuleTitle((p) => ({ ...p, vi: e.target.value }))} />
            <input className='admin-input' placeholder='STT video/image *' value={videoStt} onChange={(e) => setVideoStt(e.target.value)} />
            <input className='admin-input' placeholder='Video/Image title VI *' value={videoTitle.vi} onChange={(e) => setVideoTitle((p) => ({ ...p, vi: e.target.value }))} />
            <input className='admin-input' placeholder='Video/Image source URL *' value={videoSource} onChange={(e) => setVideoSource(e.target.value)} />
          </div>
        </div>
        <div className='admin-modal-footer'>
          <button type='button' className='admin-btn secondary' onClick={() => { reset(); onClose() }}>{t.close}</button>
          <button type='button' className='admin-btn' onClick={submit} disabled={submitting}>{submitting ? '...' : t.create}</button>
        </div>
      </div>
    </div>
  )
}
