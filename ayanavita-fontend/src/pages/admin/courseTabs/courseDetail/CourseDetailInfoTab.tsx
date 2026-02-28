import { useMemo, useState } from 'react'
import { adminCoursesApi, type CourseDetailAdmin, type CourseTopic } from '../../../../api/adminCourses.api'
import { AlertJs } from '../../../../utils/alertJs'
import { autoTranslateFromVietnamese } from '../../tabs/i18nForm'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  text: Record<string, string>
  topics: CourseTopic[]
  onUpdated: () => Promise<void> | void
}

type AdminLang = 'vi' | 'en' | 'de'
type I18nText = Record<AdminLang, string>
type I18nStringArray = Record<AdminLang, string[]>

type EditForm = {
  topicId?: number
  title: I18nText
  shortDescription: I18nText
  description: I18nText
  price: string
  published: boolean
  thumbnailFile?: File | null
  objectives: I18nStringArray
  targetAudience: I18nStringArray
  benefits: I18nStringArray
}

type CourseTranslationItem = {
  locale: string
  title?: string
  shortDescription?: string
  description?: string
  objectives?: string[]
  targetAudience?: string[]
  benefits?: string[]
}

const emptyI18n = (): I18nText => ({ vi: '', en: '', de: '' })
const emptyI18nArray = (): I18nStringArray => ({ vi: [''], en: [''], de: [''] })

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

const normalizeTranslations = (value: CourseDetailAdmin['translations']): CourseTranslationItem[] => {
  if (!value) return []
  if (Array.isArray(value)) return value as CourseTranslationItem[]
  return Object.entries(value).map(([locale, item]) => ({ locale, ...item }))
}

const getCurrentImageName = (thumbnail?: string | null) => {
  if (!thumbnail) return ''
  try {
    const parsed = new URL(thumbnail)
    const parts = parsed.pathname.split('/').filter(Boolean)
    return decodeURIComponent(parts[parts.length - 1] || '')
  } catch {
    const parts = thumbnail.split('/').filter(Boolean)
    return decodeURIComponent(parts[parts.length - 1] || '')
  }
}

const i18n = {
  vi: {
    edit: 'Chỉnh sửa',
    editTitle: 'Chỉnh sửa khóa học',
    cancel: 'Hủy',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
    topic: 'Chủ đề *',
    slug: 'Slug',
    title: 'Tiêu đề *',
    shortDescription: 'Mô tả ngắn',
    description: 'Mô tả chi tiết',
    thumbnail: 'Thumbnail (upload ảnh)',
    currentFile: 'Ảnh hiện tại',
    noImage: 'Chưa có ảnh',
    chooseFile: 'Ảnh mới',
    price: 'Giá',
    published: 'Xuất bản',
    publishLocked: 'Chỉ bật khi có ít nhất 1 bài học và 1 video.',
    objective: 'Mục tiêu',
    audience: 'Đối tượng',
    benefits: 'Lợi ích',
    addItem: 'Thêm dòng',
    remove: 'Xóa',
    missingInfo: 'Thiếu thông tin',
    topicRequired: 'Vui lòng chọn chủ đề cho khóa học.',
    titleRequired: 'Vui lòng nhập tiêu đề tiếng Việt cho khóa học.',
    invalidPriceTitle: 'Giá không hợp lệ',
    invalidPriceBody: 'Giá phải là số hợp lệ và lớn hơn hoặc bằng 0.',
    updateSuccessTitle: 'Cập nhật thành công',
    updateSuccessBody: 'Khóa học đã được cập nhật.',
    translations: 'Nội dung ngôn ngữ hiện tại',
  },
  en: {
    edit: 'Edit',
    editTitle: 'Edit course',
    cancel: 'Cancel',
    save: 'Save changes',
    saving: 'Saving...',
    topic: 'Topic *',
    slug: 'Slug',
    title: 'Title *',
    shortDescription: 'Short description',
    description: 'Description',
    thumbnail: 'Thumbnail (upload image)',
    currentFile: 'Current image',
    noImage: 'No image yet',
    chooseFile: 'New image',
    price: 'Price',
    published: 'Published',
    publishLocked: 'Can only enable after at least 1 lesson and 1 video.',
    objective: 'Objectives',
    audience: 'Target audience',
    benefits: 'Benefits',
    addItem: 'Add row',
    remove: 'Remove',
    missingInfo: 'Missing information',
    topicRequired: 'Please select a topic for this course.',
    titleRequired: 'Please enter the Vietnamese title for this course.',
    invalidPriceTitle: 'Invalid price',
    invalidPriceBody: 'Price must be a valid number greater than or equal to 0.',
    updateSuccessTitle: 'Updated',
    updateSuccessBody: 'Course updated successfully.',
    translations: 'Current language content',
  },
  de: {
    edit: 'Bearbeiten',
    editTitle: 'Kurs bearbeiten',
    cancel: 'Abbrechen',
    save: 'Speichern',
    saving: 'Wird gespeichert...',
    topic: 'Thema *',
    slug: 'Slug',
    title: 'Titel *',
    shortDescription: 'Kurzbeschreibung',
    description: 'Beschreibung',
    thumbnail: 'Thumbnail (Bild hochladen)',
    currentFile: 'Aktuelles Bild',
    noImage: 'Noch kein Bild',
    chooseFile: 'Neues Bild',
    price: 'Preis',
    published: 'Veröffentlicht',
    publishLocked: 'Nur aktivierbar mit mindestens 1 Lektion und 1 Video.',
    objective: 'Ziele',
    audience: 'Zielgruppe',
    benefits: 'Vorteile',
    addItem: 'Zeile hinzufügen',
    remove: 'Löschen',
    missingInfo: 'Fehlende Informationen',
    topicRequired: 'Bitte wählen Sie ein Thema für diesen Kurs aus.',
    titleRequired: 'Bitte geben Sie den vietnamesischen Kurstitel ein.',
    invalidPriceTitle: 'Ungültiger Preis',
    invalidPriceBody: 'Preis muss eine gültige Zahl ≥ 0 sein.',
    updateSuccessTitle: 'Aktualisiert',
    updateSuccessBody: 'Kurs erfolgreich aktualisiert.',
    translations: 'Inhalt der aktuellen Sprache',
  },
} as const

const createEditForm = (course: CourseDetailAdmin): EditForm => {
  const form: EditForm = {
    topicId: course.topicId ?? undefined,
    title: emptyI18n(),
    shortDescription: emptyI18n(),
    description: emptyI18n(),
    price: String(course.price ?? 0),
    published: !!course.published,
    thumbnailFile: null,
    objectives: emptyI18nArray(),
    targetAudience: emptyI18nArray(),
    benefits: emptyI18nArray(),
  }

  form.title.vi = course.title || ''
  form.shortDescription.vi = course.shortDescription || ''
  form.description.vi = course.description || ''
  form.objectives.vi = course.objectives?.length ? [...course.objectives] : ['']
  form.targetAudience.vi = course.targetAudience?.length ? [...course.targetAudience] : ['']
  form.benefits.vi = course.benefits?.length ? [...course.benefits] : ['']

  normalizeTranslations(course.translations).forEach((translation) => {
    if (translation.locale === 'vi' || translation.locale === 'en' || translation.locale === 'de') {
      form.title[translation.locale] = translation.title || form.title[translation.locale]
      form.shortDescription[translation.locale] = translation.shortDescription || form.shortDescription[translation.locale]
      form.description[translation.locale] = translation.description || form.description[translation.locale]
    }
  })

  normalizeTranslations(course.translations).forEach((translation) => {
    if (translation.locale === 'vi' || translation.locale === 'en' || translation.locale === 'de') {
      form.objectives[translation.locale] = translation.objectives?.length ? [...translation.objectives] : form.objectives[translation.locale]
      form.targetAudience[translation.locale] = translation.targetAudience?.length ? [...translation.targetAudience] : form.targetAudience[translation.locale]
      form.benefits[translation.locale] = translation.benefits?.length ? [...translation.benefits] : form.benefits[translation.locale]
    }
  })

  const contentTranslations = course.contentTranslations
  if (contentTranslations) {
    const legacyContent = Array.isArray(contentTranslations)
      ? contentTranslations
      : Object.entries(contentTranslations).map(([locale, item]) => ({ locale, ...item }))
    legacyContent.forEach((translation: any) => {
      if (translation.locale === 'vi' || translation.locale === 'en' || translation.locale === 'de') {
        form.objectives[translation.locale] = translation.objectives?.length ? [...translation.objectives] : form.objectives[translation.locale]
        form.targetAudience[translation.locale] = translation.targetAudience?.length ? [...translation.targetAudience] : form.targetAudience[translation.locale]
        form.benefits[translation.locale] = translation.benefits?.length ? [...translation.benefits] : form.benefits[translation.locale]
      }
    })
  }

  return form
}


const cloneEditForm = (form: EditForm): EditForm => ({
  ...form,
  title: { ...form.title },
  shortDescription: { ...form.shortDescription },
  description: { ...form.description },
  objectives: {
    vi: [...form.objectives.vi],
    en: [...form.objectives.en],
    de: [...form.objectives.de],
  },
  targetAudience: {
    vi: [...form.targetAudience.vi],
    en: [...form.targetAudience.en],
    de: [...form.targetAudience.de],
  },
  benefits: {
    vi: [...form.benefits.vi],
    en: [...form.benefits.en],
    de: [...form.benefits.de],
  },
  thumbnailFile: null,
})

export function CourseDetailInfoTab({ course, lang, text, topics, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [inputLang, setInputLang] = useState<AdminLang>('vi')
  const [submitting, setSubmitting] = useState(false)
  const [loadingEditData, setLoadingEditData] = useState(false)
  const [form, setForm] = useState<EditForm>(() => createEditForm(course))
  const [initialEditForm, setInitialEditForm] = useState<EditForm | null>(null)
  const [initialEditCourseId, setInitialEditCourseId] = useState<number | null>(null)

  const t = i18n[lang]
  const canPublish = (course._count?.lessons ?? 0) > 0 && (course.videoCount ?? 0) > 0
  const currentImageName = getCurrentImageName(course.thumbnail)

  const displayTopicName = (topic: CourseTopic) => {
    if (lang === 'de') return topic.translations?.de?.name || topic.name
    if (lang === 'en') return topic.translations?.en?.name || topic.name
    return topic.translations?.vi?.name || topic.name
  }

  const localizedTitle = (() => {
    const tr = normalizeTranslations(course.translations).find((item) => item.locale === lang)
    return tr?.title || course.title || '--'
  })()
  const localizedShortDescription = (() => {
    const tr = normalizeTranslations(course.translations).find((item) => item.locale === lang)
    return tr?.shortDescription || course.shortDescription || '--'
  })()

  const startEdit = async () => {
    setInputLang('vi')

    if (initialEditForm && initialEditCourseId === course.id) {
      setForm(cloneEditForm(initialEditForm))
      setEditing(true)
      return
    }

    try {
      setLoadingEditData(true)
      const detail = await adminCoursesApi.getCourseDetail(course.id)
      const prepared = createEditForm(detail)
      setInitialEditForm(prepared)
      setInitialEditCourseId(course.id)
      setForm(cloneEditForm(prepared))
    } catch {
      setForm(createEditForm(course))
    } finally {
      setLoadingEditData(false)
      setEditing(true)
    }
  }

  const slug = useMemo(() => slugify(form.title.vi || ''), [form.title.vi])

  const translateVietnameseToOthers = async (value: string, updater: (en: string, de: string) => void) => {
    const [en, de] = await Promise.all([
      autoTranslateFromVietnamese(value, 'en-US').catch(() => ''),
      autoTranslateFromVietnamese(value, 'de').catch(() => ''),
    ])
    updater(en || '', de || '')
  }

  const updateI18nField = (field: 'title' | 'shortDescription' | 'description', value: string) => {
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [inputLang]: value } }))
    if (inputLang !== 'vi') return
    void translateVietnameseToOthers(value, (en, de) => {
      setForm((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          en,
          de,
        },
      }))
    })
  }

  const updateI18nListItem = (field: 'objectives' | 'targetAudience' | 'benefits', index: number, value: string) => {
    setForm((prev) => {
      const list = [...prev[field][inputLang]]
      list[index] = value
      return { ...prev, [field]: { ...prev[field], [inputLang]: list } }
    })

    if (inputLang !== 'vi') return
    void translateVietnameseToOthers(value, (en, de) => {
      setForm((prev) => {
        const nextEn = [...prev[field].en]
        const nextDe = [...prev[field].de]
        nextEn[index] = en
        nextDe[index] = de
        return { ...prev, [field]: { ...prev[field], en: nextEn, de: nextDe } }
      })
    })
  }

  const addI18nListItem = (field: 'objectives' | 'targetAudience' | 'benefits') => {
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [inputLang]: [...prev[field][inputLang], ''] } }))
  }

  const removeI18nListItem = (field: 'objectives' | 'targetAudience' | 'benefits', index: number) => {
    setForm((prev) => {
      const list = [...prev[field][inputLang]]
      list.splice(index, 1)
      return { ...prev, [field]: { ...prev[field], [inputLang]: list.length ? list : [''] } }
    })
  }

  const submitUpdate = async () => {
    if (!form.topicId) {
      await AlertJs.error(t.missingInfo, t.topicRequired)
      return
    }
    if (!form.title.vi.trim()) {
      await AlertJs.error(t.missingInfo, t.titleRequired)
      return
    }
    if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      await AlertJs.error(t.invalidPriceTitle, t.invalidPriceBody)
      return
    }

    try {
      setSubmitting(true)
      const payload = new FormData()
      payload.append('topicId', String(form.topicId))
      payload.append('slug', slug)
      payload.append('title', form.title.vi.trim())
      payload.append('shortDescription', form.shortDescription.vi.trim())
      payload.append('description', form.description.vi.trim())
      payload.append('price', String(Number(form.price)))
      payload.append('published', String(canPublish ? form.published : false))
      payload.append('objectives', JSON.stringify(form.objectives.vi.filter((v) => v.trim())))
      payload.append('targetAudience', JSON.stringify(form.targetAudience.vi.filter((v) => v.trim())))
      payload.append('benefits', JSON.stringify(form.benefits.vi.filter((v) => v.trim())))
      payload.append('translations', JSON.stringify({
        vi: {
          title: form.title.vi.trim(),
          shortDescription: form.shortDescription.vi.trim(),
          description: form.description.vi.trim(),
          objectives: form.objectives.vi.filter((v) => v.trim()),
          targetAudience: form.targetAudience.vi.filter((v) => v.trim()),
          benefits: form.benefits.vi.filter((v) => v.trim()),
        },
        en: {
          title: form.title.en.trim(),
          shortDescription: form.shortDescription.en.trim(),
          description: form.description.en.trim(),
          objectives: form.objectives.en.filter((v) => v.trim()),
          targetAudience: form.targetAudience.en.filter((v) => v.trim()),
          benefits: form.benefits.en.filter((v) => v.trim()),
        },
        de: {
          title: form.title.de.trim(),
          shortDescription: form.shortDescription.de.trim(),
          description: form.description.de.trim(),
          objectives: form.objectives.de.filter((v) => v.trim()),
          targetAudience: form.targetAudience.de.filter((v) => v.trim()),
          benefits: form.benefits.de.filter((v) => v.trim()),
        },
      }))
      payload.append('contentTranslations', JSON.stringify({
        vi: {
          objectives: form.objectives.vi.filter((v) => v.trim()),
          targetAudience: form.targetAudience.vi.filter((v) => v.trim()),
          benefits: form.benefits.vi.filter((v) => v.trim()),
        },
        en: {
          objectives: form.objectives.en.filter((v) => v.trim()),
          targetAudience: form.targetAudience.en.filter((v) => v.trim()),
          benefits: form.benefits.en.filter((v) => v.trim()),
        },
        de: {
          objectives: form.objectives.de.filter((v) => v.trim()),
          targetAudience: form.targetAudience.de.filter((v) => v.trim()),
          benefits: form.benefits.de.filter((v) => v.trim()),
        },
      }))
      if (form.thumbnailFile) payload.append('thumbnail', form.thumbnailFile)

      await adminCoursesApi.updateCourse(course.id, payload)
      await onUpdated()
      await AlertJs.success(t.updateSuccessTitle, t.updateSuccessBody)
      setInitialEditForm(null)
      setInitialEditCourseId(null)
      setEditing(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (editing) {
    return (
      <div className='admin-row' style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className='admin-row' style={{ width: '100%', justifyContent: 'space-between' }}>
          <h4 style={{ margin: 0 }}><i className='fa-solid fa-pen-to-square' /> {t.editTitle}</h4>
          <div className='admin-row' style={{ gap: 8 }}>
            {(['vi', 'en', 'de'] as AdminLang[]).map((code) => (
              <button key={code} type='button' className={`admin-btn ${inputLang === code ? 'admin-btn-primary' : 'admin-btn-ghost'}`} onClick={() => setInputLang(code)}>{code.toUpperCase()}</button>
            ))}
            <button type='button' className='admin-btn admin-btn-ghost' onClick={() => setEditing(false)} disabled={submitting}>{t.cancel}</button>
            <button type='button' className='admin-btn admin-btn-save' onClick={submitUpdate} disabled={submitting}>{submitting ? t.saving : t.save}</button>
          </div>
        </div>

        <label className='admin-field' style={{ flex: '1 1 300px' }}><span className='admin-label'>{t.topic}</span><select className='admin-input' value={form.topicId || ''} onChange={(e) => setForm((prev) => ({ ...prev, topicId: Number(e.target.value) || undefined }))}><option value=''>--</option>{topics.map((item) => <option key={item.id} value={item.id}>{displayTopicName(item)}</option>)}</select></label>
        <label className='admin-field' style={{ flex: '1 1 300px' }}><span className='admin-label'>{t.slug}</span><input className='admin-input' disabled value={slug} /></label>
        <label className='admin-field' style={{ flex: '1 1 300px' }}><span className='admin-label'>{t.title}</span><input className='admin-input' value={form.title[inputLang]} onChange={(e) => updateI18nField('title', e.target.value)} /></label>
        <label className='admin-field' style={{ flex: '1 1 300px' }}><span className='admin-label'>{t.shortDescription}</span><input className='admin-input' value={form.shortDescription[inputLang]} onChange={(e) => updateI18nField('shortDescription', e.target.value)} /></label>
        <label className='admin-field' style={{ flex: '1 1 100%' }}><span className='admin-label'>{t.description}</span><textarea className='admin-input' rows={2} value={form.description[inputLang]} onChange={(e) => updateI18nField('description', e.target.value)} /></label>

        <div className='admin-field' style={{ flex: '1 1 320px' }}>
          <span className='admin-label'>{t.thumbnail}</span>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
            {t.currentFile}: <b>{form.thumbnailFile?.name || currentImageName || t.noImage}</b>
          </div>
          <input type='file' accept='image/*' onChange={(e) => setForm((prev) => ({ ...prev, thumbnailFile: e.target.files?.[0] || null }))} />
        </div>

        <label className='admin-field' style={{ flex: '0 0 220px' }}><span className='admin-label'>{t.price}</span><input type='number' min={0} className='admin-input' value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} /></label>

        <label className='admin-field' style={{ flex: '0 0 280px' }}>
          <span className='admin-label'>{t.published}</span>
          <div className='create-course-switch' style={{ marginTop: 4 }}>
            <button
              type='button'
              className={`create-course-toggle ${form.published ? 'is-on' : ''}`}
              aria-pressed={form.published}
              onClick={() => canPublish && setForm((prev) => ({ ...prev, published: !prev.published }))}
              disabled={!canPublish}
            >
              <span className='create-course-toggle-thumb' />
            </button>
            {!canPublish ? <span className='create-course-note'>{t.publishLocked}</span> : null}
          </div>
        </label>

        <div className='admin-row' style={{ width: '100%', gap: 12, alignItems: 'stretch' }}>
          {([
            ['objectives', t.objective],
            ['targetAudience', t.audience],
            ['benefits', t.benefits],
          ] as const).map(([field, label]) => (
            <div key={field} className='admin-field admin-card' style={{ flex: '1 1 320px', marginBottom: 0 }}>
              <span className='admin-label'>{label}</span>
              {form[field][inputLang].map((item, index) => (
                <div className='admin-row' key={`${field}-${index}`} style={{ gap: 8, marginBottom: 8 }}>
                  <input className='admin-input' value={item} onChange={(e) => updateI18nListItem(field, index, e.target.value)} />
                  <button type='button' className='admin-btn admin-btn-danger' onClick={() => removeI18nListItem(field, index)}><i className='fa-solid fa-trash' /> {t.remove}</button>
                </div>
              ))}
              <button type='button' className='admin-btn admin-btn-ghost' onClick={() => addI18nListItem(field)}><i className='fa-solid fa-plus' /> {t.addItem}</button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const topic = topics.find((item) => item.id === course.topicId)
  const currentTranslation = normalizeTranslations(course.translations).find((item) => item.locale === lang)
  const listItems = (items?: string[]) => (
    items?.length ? <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>{items.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}</ul> : '--'
  )

  return (
    <div className='admin-row' style={{ gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end' }}>
        <button type='button' className='admin-btn admin-btn-ghost' onClick={() => void startEdit()} disabled={loadingEditData}>
          <i className='fa-solid fa-pen' /> {loadingEditData ? t.saving : t.edit}
        </button>
      </div>
      <div style={{ flex: '1 1 100%', borderBottom: '1px dashed rgba(148, 163, 184, 0.35)', paddingBottom: 12 }}>
        <div className='admin-row' style={{ gap: 12, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              style={{ width: 250, height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(148, 163, 184, 0.35)', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 250, height: 150, borderRadius: 8, border: '1px dashed rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12, flexShrink: 0 }}>{t.noImage}</div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}><i className='fa-solid fa-heading' style={{ width: 16, color: '#22d3ee' }} /><span style={{ fontSize: 13, color: '#94a3b8' }}>{text.titleCol}</span></div>
            <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.25, marginBottom: 8, color: '#22c55e' }}>{localizedTitle}</div>
            <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}><i className='fa-solid fa-align-left' style={{ width: 16, color: '#22d3ee' }} /><span style={{ fontSize: 13, color: '#94a3b8' }}>{t.shortDescription}</span></div>
            <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4, wordBreak: 'break-word' }}>{localizedShortDescription}</div>
          </div>
        </div>
      </div>

      {[
        ['ID', course.id || '--', 'fa-hashtag'],
        ['Topic', topic ? displayTopicName(topic) : text.unassigned, 'fa-folder-tree'],
        ['Slug', course.slug || '--', 'fa-link'],
        [text.priceCol, `${(course.price || 0).toLocaleString('vi-VN')}đ`, 'fa-money-bill-wave'],
        [text.ratingCol, `${course.ratingAvg ?? 0} (${course.ratingCount ?? 0})`, 'fa-star'],
        [text.enrollmentCol, course.enrollmentCount ?? 0, 'fa-user-graduate'],
        [text.lessonCol, course._count?.lessons ?? 0, 'fa-book-open'],
        [text.videoCountCol, course.videoCount ?? 0, 'fa-video'],
        [text.statusCol, course.published ? text.publishedStatus : text.draftStatus, 'fa-circle-check'],
      ].map(([label, value, icon]) => (
        <div key={String(label)} style={{ flex: '1 1 260px', minWidth: 240, borderBottom: '1px dashed rgba(148, 163, 184, 0.35)', paddingBottom: 10 }}>
          <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <i className={`fa-solid ${icon}`} style={{ width: 16, color: '#22d3ee' }} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.4, wordBreak: 'break-word' }}>{String(value)}</div>
        </div>
      ))}

      <div style={{ flex: '1 1 100%', borderBottom: '1px dashed rgba(148, 163, 184, 0.35)', paddingBottom: 10 }}>
        <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <i className='fa-solid fa-language' style={{ width: 16, color: '#22d3ee' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{t.translations}</span>
        </div>
        <div className='admin-row' style={{ gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 100%' }}><b>{t.description}:</b> {currentTranslation?.description || course.description || '--'}</div>
          <div style={{ flex: '1 1 320px' }}><b>{t.objective}:</b>{listItems(currentTranslation?.objectives || course.objectives || [])}</div>
          <div style={{ flex: '1 1 320px' }}><b>{t.audience}:</b>{listItems(currentTranslation?.targetAudience || course.targetAudience || [])}</div>
          <div style={{ flex: '1 1 320px' }}><b>{t.benefits}:</b>{listItems(currentTranslation?.benefits || course.benefits || [])}</div>
        </div>
      </div>
    </div>
  )
}
