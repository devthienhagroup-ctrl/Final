import { useMemo, useState } from 'react'
import { autoTranslateFromVietnamese } from '../tabs/i18nForm'
import './CreateCourseModal.css'

type AdminLang = 'vi' | 'en' | 'de'
type MediaType = 'video' | 'image'

type TopicItem = { id: number; name: string; translations?: { vi?: { name?: string }; en?: { name?: string }; de?: { name?: string } } }

type Props = {
  open: boolean
  lang: AdminLang
  topics: TopicItem[]
  onClose: () => void
}

type I18nText = Record<AdminLang, string>
type I18nStringArray = Record<AdminLang, string[]>

type MediaForm = { type: MediaType; file?: File | null; orderIndex: number }
type ModuleForm = { title: I18nText; description: I18nText; orderIndex: number; medias: MediaForm[] }
type LessonForm = { title: I18nText; description: I18nText; orderIndex: number; modules: ModuleForm[] }

type CourseForm = {
  title: I18nText
  shortDescription: I18nText
  description: I18nText
  thumbnailFile?: File | null
  price: string
  published: boolean
  topicId?: number
  objectives: I18nStringArray
  targetAudience: I18nStringArray
  benefits: I18nStringArray
  lessons: LessonForm[]
}

const emptyI18n = (): I18nText => ({ vi: '', en: '', de: '' })
const emptyI18nArray = (): I18nStringArray => ({ vi: [''], en: [''], de: [''] })

const createMedia = (orderIndex = 1): MediaForm => ({ type: 'video', file: null, orderIndex })
const createModule = (orderIndex = 1): ModuleForm => ({ title: emptyI18n(), description: emptyI18n(), orderIndex, medias: [createMedia()] })
const createLesson = (orderIndex = 1): LessonForm => ({ title: emptyI18n(), description: emptyI18n(), orderIndex, modules: [createModule()] })

const initialForm = (): CourseForm => ({
  title: emptyI18n(),
  shortDescription: emptyI18n(),
  description: emptyI18n(),
  thumbnailFile: null,
  price: '',
  published: false,
  topicId: undefined,
  objectives: emptyI18nArray(),
  targetAudience: emptyI18nArray(),
  benefits: emptyI18nArray(),
  lessons: [createLesson()],
})

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

const textMap: Record<AdminLang, Record<string, string>> = {
  vi: {
    title: 'Thêm khóa học mới',
    close: 'Đóng',
    submit: 'Submit 1 lần',
    required: 'Vui lòng nhập đủ các trường bắt buộc.',
    invalidPrice: 'Giá phải là số hợp lệ và lớn hơn hoặc bằng 0.',
    langInput: 'Ngôn ngữ nhập liệu',
    courseInfo: 'I. Thông tin khóa học',
    lessons: 'II. Lesson',
    modules: 'III. Module',
    medias: 'IV. Media',
    topic: 'Chủ đề *',
    titleLabel: 'Tiêu đề *',
    shortDescription: 'Mô tả ngắn',
    description: 'Mô tả chi tiết',
    thumbnailUpload: 'Thumbnail (upload ảnh)',
    price: 'Giá',
    published: 'Xuất bản',
    addLesson: 'Thêm Lesson',
    addModule: 'Thêm Module',
    addMedia: 'Thêm Media',
    addItem: 'Thêm dòng',
    remove: 'Xóa',
    objective: 'Mục tiêu',
    audience: 'Đối tượng',
    benefits: 'Lợi ích',
    mediaType: 'Loại media',
    upload: 'Upload file',
    orderIndex: 'Thứ tự',
  },
  en: {
    title: 'Add new course',
    close: 'Close',
    submit: 'Submit once',
    required: 'Please fill required fields.',
    invalidPrice: 'Price must be a valid number and greater than or equal to 0.',
    langInput: 'Input language',
    courseInfo: 'I. Course information',
    lessons: 'II. Lesson',
    modules: 'III. Module',
    medias: 'IV. Media',
    topic: 'Topic *',
    titleLabel: 'Title *',
    shortDescription: 'Short description',
    description: 'Description',
    thumbnailUpload: 'Thumbnail (upload image)',
    price: 'Price',
    published: 'Published',
    addLesson: 'Add lesson',
    addModule: 'Add module',
    addMedia: 'Add media',
    addItem: 'Add row',
    remove: 'Remove',
    objective: 'Objectives',
    audience: 'Target audience',
    benefits: 'Benefits',
    mediaType: 'Media type',
    upload: 'Upload file',
    orderIndex: 'Order index',
  },
  de: {
    title: 'Neuen Kurs hinzufügen',
    close: 'Schließen',
    submit: 'Einmal senden',
    required: 'Bitte Pflichtfelder ausfüllen.',
    invalidPrice: 'Preis muss eine gültige Zahl und größer oder gleich 0 sein.',
    langInput: 'Eingabesprache',
    courseInfo: 'I. Kursinformationen',
    lessons: 'II. Lektion',
    modules: 'III. Modul',
    medias: 'IV. Medien',
    topic: 'Thema *',
    titleLabel: 'Titel *',
    shortDescription: 'Kurzbeschreibung',
    description: 'Beschreibung',
    thumbnailUpload: 'Thumbnail (Bild hochladen)',
    price: 'Preis',
    published: 'Veröffentlicht',
    addLesson: 'Lektion hinzufügen',
    addModule: 'Modul hinzufügen',
    addMedia: 'Medien hinzufügen',
    addItem: 'Zeile hinzufügen',
    remove: 'Löschen',
    objective: 'Ziele',
    audience: 'Zielgruppe',
    benefits: 'Vorteile',
    mediaType: 'Medientyp',
    upload: 'Datei hochladen',
    orderIndex: 'Reihenfolge',
  },
}

export function CreateCourseModal({ open, lang, topics, onClose }: Props) {
  const [form, setForm] = useState<CourseForm>(() => initialForm())
  const [inputLang, setInputLang] = useState<AdminLang>('vi')
  const t = textMap[lang]

  const displayTopicName = (topic: TopicItem) => {
    if (lang === 'en') return topic.translations?.en?.name || topic.name
    if (lang === 'de') return topic.translations?.de?.name || topic.name
    return topic.translations?.vi?.name || topic.name
  }

  const slug = useMemo(() => slugify(form.title.vi || ''), [form.title.vi])

  const translateVietnameseToOthers = async (value: string, updater: (en: string, de: string) => void) => {
    const [en, de] = await Promise.all([autoTranslateFromVietnamese(value, 'en-US'), autoTranslateFromVietnamese(value, 'de')])
    updater(en, de)
  }

  const updateI18nField = (field: 'title' | 'shortDescription' | 'description', value: string) => {
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [inputLang]: value } }))
    if (inputLang !== 'vi') return
    void translateVietnameseToOthers(value, (en, de) => setForm((prev) => ({ ...prev, [field]: { ...prev[field], en, de } })))
  }

  const updateI18nListItem = (field: 'objectives' | 'targetAudience' | 'benefits', index: number, value: string) => {
    setForm((prev) => {
      const localList = [...prev[field][inputLang]]
      localList[index] = value
      return { ...prev, [field]: { ...prev[field], [inputLang]: localList } }
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
    setForm((prev) => ({ ...prev, [field]: { vi: [...prev[field].vi, ''], en: [...prev[field].en, ''], de: [...prev[field].de, ''] } }))
  }

  const removeI18nListItem = (field: 'objectives' | 'targetAudience' | 'benefits', index: number) => {
    setForm((prev) => ({
      ...prev,
      [field]: {
        vi: prev[field].vi.filter((_, i) => i !== index),
        en: prev[field].en.filter((_, i) => i !== index),
        de: prev[field].de.filter((_, i) => i !== index),
      },
    }))
  }

  const updateLesson = (lessonIdx: number, updater: (lesson: LessonForm) => LessonForm) => {
    setForm((prev) => ({ ...prev, lessons: prev.lessons.map((lesson, idx) => (idx === lessonIdx ? updater(lesson) : lesson)) }))
  }

  const updateModule = (lessonIdx: number, moduleIdx: number, updater: (module: ModuleForm) => ModuleForm) => {
    updateLesson(lessonIdx, (lesson) => ({ ...lesson, modules: lesson.modules.map((module, idx) => (idx === moduleIdx ? updater(module) : module)) }))
  }

  const updateMedia = (lessonIdx: number, moduleIdx: number, mediaIdx: number, updater: (media: MediaForm) => MediaForm) => {
    updateModule(lessonIdx, moduleIdx, (module) => ({ ...module, medias: module.medias.map((media, idx) => (idx === mediaIdx ? updater(media) : media)) }))
  }

  const addLesson = () => setForm((prev) => ({ ...prev, lessons: [...prev.lessons, createLesson(prev.lessons.length + 1)] }))
  const removeLesson = (lessonIdx: number) => setForm((prev) => ({ ...prev, lessons: prev.lessons.filter((_, idx) => idx !== lessonIdx) }))
  const addModule = (lessonIdx: number) => updateLesson(lessonIdx, (lesson) => ({ ...lesson, modules: [...lesson.modules, createModule(lesson.modules.length + 1)] }))
  const removeModule = (lessonIdx: number, moduleIdx: number) => updateLesson(lessonIdx, (lesson) => ({ ...lesson, modules: lesson.modules.filter((_, idx) => idx !== moduleIdx) }))
  const addMedia = (lessonIdx: number, moduleIdx: number) => updateModule(lessonIdx, moduleIdx, (module) => ({ ...module, medias: [...module.medias, createMedia(module.medias.length + 1)] }))
  const removeMedia = (lessonIdx: number, moduleIdx: number, mediaIdx: number) => updateModule(lessonIdx, moduleIdx, (module) => ({ ...module, medias: module.medias.filter((_, idx) => idx !== mediaIdx) }))

  const updateLessonText = (lessonIdx: number, field: 'title' | 'description', value: string) => {
    updateLesson(lessonIdx, (lesson) => ({ ...lesson, [field]: { ...lesson[field], [inputLang]: value } }))
    if (inputLang !== 'vi') return
    void translateVietnameseToOthers(value, (en, de) => updateLesson(lessonIdx, (lesson) => ({ ...lesson, [field]: { ...lesson[field], en, de } })))
  }

  const updateModuleText = (lessonIdx: number, moduleIdx: number, field: 'title' | 'description', value: string) => {
    updateModule(lessonIdx, moduleIdx, (module) => ({ ...module, [field]: { ...module[field], [inputLang]: value } }))
    if (inputLang !== 'vi') return
    void translateVietnameseToOthers(value, (en, de) => updateModule(lessonIdx, moduleIdx, (module) => ({ ...module, [field]: { ...module[field], en, de } })))
  }

  const getPrice = () => Number(form.price)

  const validate = () => {
    if (!form.topicId || !form.title.vi.trim()) return false
    if (!Number.isFinite(getPrice()) || getPrice() < 0) {
      window.alert(t.invalidPrice)
      return false
    }
    for (const lesson of form.lessons) {
      if (!lesson.title.vi.trim()) return false
      for (const module of lesson.modules) {
        if (!module.title.vi.trim()) return false
      }
    }
    return true
  }

  const toLanguageVersion = (locale: AdminLang) => ({
    title: form.title[locale],
    shortDescription: form.shortDescription[locale],
    description: form.description[locale],
    objectives: form.objectives[locale].filter((v) => v.trim()),
    targetAudience: form.targetAudience[locale].filter((v) => v.trim()),
    benefits: form.benefits[locale].filter((v) => v.trim()),
    lessons: form.lessons.map((lesson) => ({
      title: lesson.title[locale],
      description: lesson.description[locale],
      orderIndex: lesson.orderIndex,
      modules: lesson.modules.map((module) => ({
        title: module.title[locale],
        description: module.description[locale],
        orderIndex: module.orderIndex,
        medias: module.medias.map((media) => ({
          type: media.type,
          uploadFileName: media.file?.name,
          orderIndex: media.orderIndex,
        })),
      })),
    })),
  })

  const submit = () => {
    if (!validate()) {
      if (Number.isFinite(getPrice()) && getPrice() >= 0) window.alert(t.required)
      return
    }

    const now = new Date().toISOString()
    const payload = {
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      thumbnail: { uploadFileName: form.thumbnailFile?.name },
      price: getPrice(),
      published: form.published,
      topicId: form.topicId,
      objectives: form.objectives,
      targetAudience: form.targetAudience,
      benefits: form.benefits,
      slug,
      createdAt: now,
      updatedAt: now,
      lessons: form.lessons.map((lesson) => ({
        title: lesson.title,
        description: lesson.description,
        orderIndex: lesson.orderIndex,
        modules: lesson.modules.map((module) => ({
          title: module.title,
          description: module.description,
          orderIndex: module.orderIndex,
          medias: module.medias.map((media) => ({ type: media.type, uploadFileName: media.file?.name, orderIndex: media.orderIndex })),
        })),
      })),
      languageVersions: {
        vi: toLanguageVersion('vi'),
        en: toLanguageVersion('en'),
        de: toLanguageVersion('de'),
      },
    }

    console.log('NEW_COURSE_PAYLOAD', payload)
    onClose()
    setForm(initialForm())
    setInputLang('vi')
  }

  if (!open) return null

  return (
    <div className='admin-modal-backdrop' role='dialog' aria-modal='true'>
      <div className='admin-modal create-course-modal'>
        <div className='admin-modal-header'>
          <h4><i className='fa-solid fa-circle-plus create-course-icon-orange' /> {t.title}</h4>
          <div className='admin-row'>
            <span className='create-course-muted'>{t.langInput}:</span>
            {(['vi', 'en', 'de'] as AdminLang[]).map((code) => (
              <button key={code} type='button' className={`admin-btn ${inputLang === code ? 'admin-btn-primary' : 'admin-btn-ghost'}`} onClick={() => setInputLang(code)}>{code.toUpperCase()}</button>
            ))}
            <button type='button' className='admin-btn admin-btn-ghost' onClick={onClose}>{t.close}</button>
          </div>
        </div>

        <section className='admin-card create-course-section'>
          <h5><i className='fa-solid fa-book create-course-icon-orange' /> {t.courseInfo}</h5>
          <div className='admin-form-grid admin-form-grid-2col'>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-tags create-course-icon-orange' /> {t.topic}</span><select className='admin-input' value={form.topicId || ''} onChange={(e) => setForm((prev) => ({ ...prev, topicId: Number(e.target.value) || undefined }))}><option value=''>--</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{displayTopicName(topic)}</option>)}</select></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-link create-course-icon-orange' /> Slug</span><input className='admin-input' value={slug} disabled /></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-heading create-course-icon-orange' /> {t.titleLabel}</span><input className='admin-input' value={form.title[inputLang]} onChange={(e) => updateI18nField('title', e.target.value)} /></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-note-sticky create-course-icon-orange' /> {t.shortDescription}</span><input className='admin-input' value={form.shortDescription[inputLang]} onChange={(e) => updateI18nField('shortDescription', e.target.value)} /></label>
            <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-align-left create-course-icon-orange' /> {t.description}</span><textarea className='admin-input' rows={2} value={form.description[inputLang]} onChange={(e) => updateI18nField('description', e.target.value)} /></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-image create-course-icon-orange' /> {t.thumbnailUpload}</span><input type='file' accept='image/*' onChange={(e) => setForm((prev) => ({ ...prev, thumbnailFile: e.target.files?.[0] || null }))} /></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-money-bill-wave create-course-icon-green' /> {t.price}</span><input type='number' min={0} className='admin-input' value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} /></label>
            <label className='create-course-switch'>
              <span className='admin-label'><i className='fa-solid fa-circle-check create-course-icon-green' /> {t.published}</span>
              <button type='button' className={`create-course-toggle ${form.published ? 'is-on' : ''}`} onClick={() => setForm((prev) => ({ ...prev, published: !prev.published }))} aria-pressed={form.published}>
                <span className='create-course-toggle-thumb' />
              </button>
            </label>
          </div>

          {(['objectives', 'targetAudience', 'benefits'] as const).map((field) => (
            <div key={field} className='admin-field admin-field-full create-course-list-wrap'>
              <span className='admin-label'><i className='fa-solid fa-list-check create-course-icon-green' /> {field === 'objectives' ? t.objective : field === 'targetAudience' ? t.audience : t.benefits}</span>
              {form[field][inputLang].map((item, index) => (
                <div className='admin-row create-course-list-item' key={`${field}-${index}`}>
                  <input className='admin-input' value={item} onChange={(e) => updateI18nListItem(field, index, e.target.value)} />
                  <button type='button' className='admin-btn admin-btn-danger' onClick={() => removeI18nListItem(field, index)}><i className='fa-solid fa-trash' /> {t.remove}</button>
                </div>
              ))}
              <button type='button' className='admin-btn create-course-btn-add create-course-btn-inline' onClick={() => addI18nListItem(field)}><i className='fa-solid fa-plus' /> {t.addItem}</button>
            </div>
          ))}
        </section>

        {form.lessons.map((lesson, lessonIdx) => (
          <section className='admin-card create-course-section' key={`lesson-${lessonIdx}`}>
            <div className='admin-row create-course-title-row'>
              <h5><i className='fa-solid fa-book-open create-course-icon-green' /> {t.lessons} #{lessonIdx + 1}</h5>
              <button type='button' className='admin-btn admin-btn-danger' onClick={() => removeLesson(lessonIdx)}><i className='fa-solid fa-trash' /> {t.remove}</button>
            </div>
            <div className='admin-form-grid admin-form-grid-2col'>
              <label className='admin-field'><span className='admin-label'>{t.titleLabel}</span><input className='admin-input' value={lesson.title[inputLang]} onChange={(e) => updateLessonText(lessonIdx, 'title', e.target.value)} /></label>
              <label className='admin-field'><span className='admin-label'>{t.orderIndex}</span><input type='number' className='admin-input' value={lesson.orderIndex} onChange={(e) => updateLesson(lessonIdx, (old) => ({ ...old, orderIndex: Number(e.target.value) }))} /></label>
              <label className='admin-field admin-field-full'><span className='admin-label'>{t.description}</span><textarea className='admin-input' rows={2} value={lesson.description[inputLang]} onChange={(e) => updateLessonText(lessonIdx, 'description', e.target.value)} /></label>
            </div>

            {lesson.modules.map((module, moduleIdx) => (
              <div className='admin-card create-course-inner-card' key={`module-${moduleIdx}`}>
                <div className='admin-row create-course-title-row'>
                  <h6><i className='fa-solid fa-layer-group create-course-icon-orange' /> {t.modules} #{moduleIdx + 1}</h6>
                  <button type='button' className='admin-btn admin-btn-danger' onClick={() => removeModule(lessonIdx, moduleIdx)}><i className='fa-solid fa-trash' /> {t.remove}</button>
                </div>
                <div className='admin-form-grid admin-form-grid-2col'>
                  <label className='admin-field'><span className='admin-label'>{t.titleLabel}</span><input className='admin-input' value={module.title[inputLang]} onChange={(e) => updateModuleText(lessonIdx, moduleIdx, 'title', e.target.value)} /></label>
                  <label className='admin-field'><span className='admin-label'>{t.orderIndex}</span><input type='number' className='admin-input' value={module.orderIndex} onChange={(e) => updateModule(lessonIdx, moduleIdx, (old) => ({ ...old, orderIndex: Number(e.target.value) }))} /></label>
                  <label className='admin-field admin-field-full'><span className='admin-label'>{t.description}</span><textarea className='admin-input' rows={2} value={module.description[inputLang]} onChange={(e) => updateModuleText(lessonIdx, moduleIdx, 'description', e.target.value)} /></label>
                </div>

                {module.medias.map((media, mediaIdx) => (
                  <div key={`media-${mediaIdx}`} className='admin-card create-course-inner-card'>
                    <div className='admin-row create-course-title-row'>
                      <strong><i className='fa-solid fa-photo-film create-course-icon-green' /> {t.medias} #{mediaIdx + 1}</strong>
                      <button type='button' className='admin-btn admin-btn-danger' onClick={() => removeMedia(lessonIdx, moduleIdx, mediaIdx)}><i className='fa-solid fa-trash' /> {t.remove}</button>
                    </div>
                    <div className='admin-form-grid admin-form-grid-2col'>
                      <label className='admin-field'><span className='admin-label'>{t.mediaType}</span><select className='admin-input' value={media.type} onChange={(e) => updateMedia(lessonIdx, moduleIdx, mediaIdx, (old) => ({ ...old, type: e.target.value as MediaType }))}><option value='video'>video</option><option value='image'>image</option></select></label>
                      <label className='admin-field'><span className='admin-label'>{t.orderIndex}</span><input type='number' className='admin-input' value={media.orderIndex} onChange={(e) => updateMedia(lessonIdx, moduleIdx, mediaIdx, (old) => ({ ...old, orderIndex: Number(e.target.value) }))} /></label>
                      <label className='admin-field admin-field-full'><span className='admin-label'>{t.upload}</span><input type='file' accept={media.type === 'image' ? 'image/*' : 'video/*'} onChange={(e) => updateMedia(lessonIdx, moduleIdx, mediaIdx, (old) => ({ ...old, file: e.target.files?.[0] || null }))} /></label>
                    </div>
                  </div>
                ))}

                <button type='button' className='admin-btn create-course-btn-add' onClick={() => addMedia(lessonIdx, moduleIdx)}><i className='fa-solid fa-plus' /> {t.addMedia}</button>
              </div>
            ))}

            <button type='button' className='admin-btn create-course-btn-add' onClick={() => addModule(lessonIdx)}><i className='fa-solid fa-plus' /> {t.addModule}</button>
          </section>
        ))}

        <div className='admin-row create-course-footer'>
          <button type='button' className='admin-btn create-course-btn-add' onClick={addLesson}><i className='fa-solid fa-plus' /> {t.addLesson}</button>
          <button type='button' className='admin-btn admin-btn-save' onClick={submit}><i className='fa-solid fa-paper-plane' /> {t.submit}</button>
        </div>
      </div>
    </div>
  )
}
