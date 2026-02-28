import { useMemo, useState } from 'react'
import { adminCoursesApi } from '../../../../api/adminCourses.api'
import { AlertJs } from '../../../../utils/alertJs'

type Props = {
  open: boolean
  lang: 'vi' | 'en' | 'de'
  courseId: number
  onClose: () => void
  onCreated: () => Promise<void> | void
}

type MediaType = 'VIDEO' | 'IMAGE'

type FormState = {
  title: string
  slug: string
  description: string
  moduleTitle: string
  moduleDescription: string
  mediaTitle: string
  mediaDescription: string
  mediaType: MediaType
  mediaSourceUrl: string
}

const textByLang = {
  vi: {
    title: 'Tạo bài học mới',
    lessonTitle: 'Tiêu đề bài học *',
    slug: 'Slug',
    lessonDescription: 'Mô tả bài học *',
    moduleTitle: 'Tên module *',
    moduleDescription: 'Mô tả module *',
    mediaTitle: 'Tiêu đề video/ảnh *',
    mediaDescription: 'Mô tả video/ảnh *',
    mediaType: 'Loại media *',
    mediaUrl: 'Đường dẫn video/ảnh *',
    save: 'Tạo bài học',
    close: 'Đóng',
    missing: 'Vui lòng nhập đầy đủ thông tin bài học, module và video/ảnh.',
    success: 'Đã tạo bài học mới.',
  },
  en: {
    title: 'Create new lesson',
    lessonTitle: 'Lesson title *',
    slug: 'Slug',
    lessonDescription: 'Lesson description *',
    moduleTitle: 'Module title *',
    moduleDescription: 'Module description *',
    mediaTitle: 'Video/Image title *',
    mediaDescription: 'Video/Image description *',
    mediaType: 'Media type *',
    mediaUrl: 'Video/Image URL *',
    save: 'Create lesson',
    close: 'Close',
    missing: 'Please complete lesson, module and media information.',
    success: 'Created lesson successfully.',
  },
  de: {
    title: 'Neue Lektion erstellen',
    lessonTitle: 'Lektionstitel *',
    slug: 'Slug',
    lessonDescription: 'Lektionsbeschreibung *',
    moduleTitle: 'Modulname *',
    moduleDescription: 'Modulbeschreibung *',
    mediaTitle: 'Video/Bild-Titel *',
    mediaDescription: 'Video/Bild-Beschreibung *',
    mediaType: 'Medientyp *',
    mediaUrl: 'Video/Bild-URL *',
    save: 'Lektion erstellen',
    close: 'Schließen',
    missing: 'Bitte Lektion-, Modul- und Medieninfos vollständig eingeben.',
    success: 'Lektion erfolgreich erstellt.',
  },
} as const

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

const initialForm: FormState = {
  title: '',
  slug: '',
  description: '',
  moduleTitle: '',
  moduleDescription: '',
  mediaTitle: '',
  mediaDescription: '',
  mediaType: 'VIDEO',
  mediaSourceUrl: '',
}

export function CreateLessonModal({ open, lang, courseId, onClose, onCreated }: Props) {
  const t = textByLang[lang]
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)

  const slug = useMemo(() => slugify(form.title), [form.title])

  if (!open) return null

  const submit = async () => {
    const requiredValues = [
      form.title,
      form.description,
      form.moduleTitle,
      form.moduleDescription,
      form.mediaTitle,
      form.mediaDescription,
      form.mediaSourceUrl,
    ]

    if (requiredValues.some((value) => !value.trim()) || !slug.trim()) {
      await AlertJs.error(t.missing)
      return
    }

    try {
      setSubmitting(true)
      await adminCoursesApi.createLesson(courseId, {
        title: form.title.trim(),
        slug,
        description: form.description.trim(),
        translations: {
          [lang]: { title: form.title.trim(), description: form.description.trim() },
        },
        modules: [
          {
            title: form.moduleTitle.trim(),
            description: form.moduleDescription.trim(),
            translations: {
              [lang]: { title: form.moduleTitle.trim(), description: form.moduleDescription.trim() },
            },
            videos: [
              {
                title: form.mediaTitle.trim(),
                description: form.mediaDescription.trim(),
                mediaType: form.mediaType,
                sourceUrl: form.mediaSourceUrl.trim(),
                translations: {
                  [lang]: { title: form.mediaTitle.trim(), description: form.mediaDescription.trim() },
                },
              },
            ],
          },
        ],
      } as any)

      await onCreated()
      await AlertJs.success(t.success)
      setForm(initialForm)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='admin-modal-backdrop' role='dialog' aria-modal='true'>
      <div className='admin-modal create-course-modal'>
        <div className='admin-modal-header'>
          <h4><i className='fa-solid fa-circle-plus' /> {t.title}</h4>
          <button type='button' className='admin-btn admin-btn-ghost' onClick={onClose}>{t.close}</button>
        </div>

        <div className='admin-form-grid admin-form-grid-2col'>
          <label className='admin-field'>
            <span className='admin-label'>{t.lessonTitle}</span>
            <input className='admin-input' value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value, slug: slugify(e.target.value) }))} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'>{t.slug}</span>
            <input className='admin-input' value={slug || form.slug} disabled />
          </label>

          <label className='admin-field admin-field-full'>
            <span className='admin-label'>{t.lessonDescription}</span>
            <textarea className='admin-input' rows={2} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>

          <label className='admin-field'>
            <span className='admin-label'>{t.moduleTitle}</span>
            <input className='admin-input' value={form.moduleTitle} onChange={(e) => setForm((prev) => ({ ...prev, moduleTitle: e.target.value }))} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'>{t.moduleDescription}</span>
            <input className='admin-input' value={form.moduleDescription} onChange={(e) => setForm((prev) => ({ ...prev, moduleDescription: e.target.value }))} />
          </label>

          <label className='admin-field'>
            <span className='admin-label'>{t.mediaTitle}</span>
            <input className='admin-input' value={form.mediaTitle} onChange={(e) => setForm((prev) => ({ ...prev, mediaTitle: e.target.value }))} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'>{t.mediaDescription}</span>
            <input className='admin-input' value={form.mediaDescription} onChange={(e) => setForm((prev) => ({ ...prev, mediaDescription: e.target.value }))} />
          </label>

          <label className='admin-field'>
            <span className='admin-label'>{t.mediaType}</span>
            <select className='admin-input' value={form.mediaType} onChange={(e) => setForm((prev) => ({ ...prev, mediaType: e.target.value as MediaType }))}>
              <option value='VIDEO'>Video</option>
              <option value='IMAGE'>Image</option>
            </select>
          </label>
          <label className='admin-field'>
            <span className='admin-label'>{t.mediaUrl}</span>
            <input className='admin-input' value={form.mediaSourceUrl} onChange={(e) => setForm((prev) => ({ ...prev, mediaSourceUrl: e.target.value }))} />
          </label>
        </div>

        <div className='admin-row create-course-footer'>
          <button type='button' className='admin-btn admin-btn-save' disabled={submitting} onClick={() => void submit()}>
            <i className='fa-solid fa-floppy-disk' /> {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
