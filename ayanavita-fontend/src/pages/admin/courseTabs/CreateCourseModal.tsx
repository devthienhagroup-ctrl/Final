import { useMemo, useState } from 'react'
import { autoTranslateFromVietnamese } from '../tabs/i18nForm'
import { adminCoursesApi } from '../../../api/adminCourses.api'
import { AlertJs } from '../../../utils/alertJs'
import './CreateCourseModal.css'

type AdminLang = 'vi' | 'en' | 'de'

type TopicItem = { id: number; name: string; translations?: { vi?: { name?: string }; en?: { name?: string }; de?: { name?: string } } }

type Props = {
  open: boolean
  lang: AdminLang
  topics: TopicItem[]
  onClose: () => void
  onCreated: () => Promise<void> | void
}

type I18nText = Record<AdminLang, string>
type I18nStringArray = Record<AdminLang, string[]>
type FormErrors = Partial<Record<'topicId' | 'title' | 'price', string>>

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
}

const emptyI18n = (): I18nText => ({ vi: '', en: '', de: '' })
const emptyI18nArray = (): I18nStringArray => ({ vi: [''], en: [''], de: [''] })

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
    submit: 'Lưu khóa học',
    required: 'Vui lòng nhập đủ các trường bắt buộc.',
    invalidPrice: 'Giá phải là số hợp lệ và lớn hơn hoặc bằng 0.',
    langInput: 'Ngôn ngữ nhập liệu',
    courseInfo: 'I. Thông tin khóa học',
    topic: 'Chủ đề *',
    titleLabel: 'Tiêu đề *',
    shortDescription: 'Mô tả ngắn',
    description: 'Mô tả chi tiết',
    thumbnailUpload: 'Thumbnail (upload ảnh)',
    price: 'Giá',
    published: 'Xuất bản',
    addItem: 'Thêm dòng',
    remove: 'Xóa',
    objective: 'Mục tiêu',
    audience: 'Đối tượng',
    benefits: 'Lợi ích',
    successTitle: 'Tạo khóa học thành công',
    successBody: 'Khóa học đã được tạo ở trạng thái bản nháp. Vui lòng tạo đầy đủ bài học trước khi xuất bản.',
    draftLockedNote: 'Sau khi tạo khóa học, bạn cần tạo đầy đủ các bài học thì mới có thể xuất bản.',
    topicRequired: 'Vui lòng chọn chủ đề cho khóa học.',
    titleRequired: 'Vui lòng nhập tiêu đề tiếng Việt cho khóa học.',
  },
  en: {
    title: 'Add new course',
    close: 'Close',
    submit: 'Save course',
    required: 'Please fill required fields.',
    invalidPrice: 'Price must be a valid number and greater than or equal to 0.',
    langInput: 'Input language',
    courseInfo: 'I. Course information',
    topic: 'Topic *',
    titleLabel: 'Title *',
    shortDescription: 'Short description',
    description: 'Description',
    thumbnailUpload: 'Thumbnail (upload image)',
    price: 'Price',
    published: 'Published',
    addItem: 'Add row',
    remove: 'Remove',
    objective: 'Objectives',
    audience: 'Target audience',
    benefits: 'Benefits',
    successTitle: 'Course created successfully',
    successBody: 'The course was created in draft mode. Please add all lessons before publishing.',
    draftLockedNote: 'After creating the course, you need to add all lessons before it can be published.',
    topicRequired: 'Please select a topic for this course.',
    titleRequired: 'Please enter the Vietnamese title for this course.',
  },
  de: {
    title: 'Neuen Kurs hinzufügen',
    close: 'Schließen',
    submit: 'Kurs speichern',
    required: 'Bitte Pflichtfelder ausfüllen.',
    invalidPrice: 'Preis muss eine gültige Zahl und größer oder gleich 0 sein.',
    langInput: 'Eingabesprache',
    courseInfo: 'I. Kursinformationen',
    topic: 'Thema *',
    titleLabel: 'Titel *',
    shortDescription: 'Kurzbeschreibung',
    description: 'Beschreibung',
    thumbnailUpload: 'Thumbnail (Bild hochladen)',
    price: 'Preis',
    published: 'Veröffentlicht',
    addItem: 'Zeile hinzufügen',
    remove: 'Löschen',
    objective: 'Ziele',
    audience: 'Zielgruppe',
    benefits: 'Vorteile',
    successTitle: 'Kurs erfolgreich erstellt',
    successBody: 'Der Kurs wurde als Entwurf erstellt. Bitte legen Sie alle Lektionen an, bevor Sie veröffentlichen.',
    draftLockedNote: 'Nach dem Erstellen des Kurses müssen zuerst alle Lektionen angelegt werden, bevor veröffentlicht werden kann.',
    topicRequired: 'Bitte wählen Sie ein Thema für diesen Kurs aus.',
    titleRequired: 'Bitte geben Sie den vietnamesischen Kurstitel ein.',
  },
}

export function CreateCourseModal({ open, lang, topics, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CourseForm>(() => initialForm())
  const [errors, setErrors] = useState<FormErrors>({})
  const [inputLang, setInputLang] = useState<AdminLang>('vi')
  const [submitting, setSubmitting] = useState(false)
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

  const getPrice = () => Number(form.price)

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!form.topicId) nextErrors.topicId = t.topicRequired
    if (!form.title.vi.trim()) nextErrors.title = t.titleRequired
    if (!Number.isFinite(getPrice()) || getPrice() < 0) nextErrors.price = t.invalidPrice

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title.vi)
      payload.append('shortDescription', form.shortDescription.vi)
      payload.append('description', form.description.vi)
      payload.append('price', String(getPrice()))
      payload.append('published', 'false')
      if (form.topicId) payload.append('topicId', String(form.topicId))
      payload.append('slug', slug)
      payload.append('objectives', JSON.stringify({
        vi: form.objectives.vi.filter((v) => v.trim()),
        en: form.objectives.en.filter((v) => v.trim()),
        de: form.objectives.de.filter((v) => v.trim()),
      }))
      payload.append('targetAudience', JSON.stringify({
        vi: form.targetAudience.vi.filter((v) => v.trim()),
        en: form.targetAudience.en.filter((v) => v.trim()),
        de: form.targetAudience.de.filter((v) => v.trim()),
      }))
      payload.append('benefits', JSON.stringify({
        vi: form.benefits.vi.filter((v) => v.trim()),
        en: form.benefits.en.filter((v) => v.trim()),
        de: form.benefits.de.filter((v) => v.trim()),
      }))
      payload.append('translations', JSON.stringify({
        vi: { title: form.title.vi, shortDescription: form.shortDescription.vi, description: form.description.vi },
        en: { title: form.title.en, shortDescription: form.shortDescription.en, description: form.description.en },
        de: { title: form.title.de, shortDescription: form.shortDescription.de, description: form.description.de },
      }))
      payload.append('contentTranslations', JSON.stringify({
        vi: { objectives: form.objectives.vi.filter((v) => v.trim()), targetAudience: form.targetAudience.vi.filter((v) => v.trim()), benefits: form.benefits.vi.filter((v) => v.trim()) },
        en: { objectives: form.objectives.en.filter((v) => v.trim()), targetAudience: form.targetAudience.en.filter((v) => v.trim()), benefits: form.benefits.en.filter((v) => v.trim()) },
        de: { objectives: form.objectives.de.filter((v) => v.trim()), targetAudience: form.targetAudience.de.filter((v) => v.trim()), benefits: form.benefits.de.filter((v) => v.trim()) },
      }))
      if (form.thumbnailFile) payload.append('thumbnail', form.thumbnailFile)

      await adminCoursesApi.createCourse(payload)
      await onCreated()
      await AlertJs.success(t.successTitle, t.successBody)

      onClose()
      setForm(initialForm())
      setErrors({})
      setInputLang('vi')
    } finally {
      setSubmitting(false)
    }
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
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-tags create-course-icon-orange' /> {t.topic}</span><select className='admin-input' value={form.topicId || ''} onChange={(e) => {
              setForm((prev) => ({ ...prev, topicId: Number(e.target.value) || undefined }))
              setErrors((prev) => ({ ...prev, topicId: undefined }))
            }}><option value=''>--</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{displayTopicName(topic)}</option>)}</select>{errors.topicId ? <span className='create-course-error'>{errors.topicId}</span> : null}</label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-link create-course-icon-orange' /> Slug</span><input className='admin-input' value={slug} disabled /></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-heading create-course-icon-orange' /> {t.titleLabel}</span><input className='admin-input' value={form.title[inputLang]} onChange={(e) => {
              updateI18nField('title', e.target.value)
              if (inputLang === 'vi') setErrors((prev) => ({ ...prev, title: undefined }))
            }} />{errors.title ? <span className='create-course-error'>{errors.title}</span> : null}</label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-note-sticky create-course-icon-orange' /> {t.shortDescription}</span><input className='admin-input' value={form.shortDescription[inputLang]} onChange={(e) => updateI18nField('shortDescription', e.target.value)} /></label>
            <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-align-left create-course-icon-orange' /> {t.description}</span><textarea className='admin-input' rows={2} value={form.description[inputLang]} onChange={(e) => updateI18nField('description', e.target.value)} /></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-image create-course-icon-orange' /> {t.thumbnailUpload}</span><input type='file' accept='image/*' onChange={(e) => setForm((prev) => ({ ...prev, thumbnailFile: e.target.files?.[0] || null }))} /></label>
            <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-money-bill-wave create-course-icon-green' /> {t.price}</span><input type='number' min={0} className='admin-input' value={form.price} onChange={(e) => {
              setForm((prev) => ({ ...prev, price: e.target.value }))
              setErrors((prev) => ({ ...prev, price: undefined }))
            }} />{errors.price ? <span className='create-course-error'>{errors.price}</span> : null}</label>
            <label className='create-course-switch'>
              <span className='admin-label'><i className='fa-solid fa-circle-check create-course-icon-green' /> {t.published}</span>
              <button type='button' className='create-course-toggle' aria-pressed={false} disabled>
                <span className='create-course-toggle-thumb' />
              </button>
              <span className='create-course-note'>{t.draftLockedNote}</span>
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

        <div className='admin-row create-course-footer'>
          <button type='button' className='admin-btn admin-btn-save' onClick={() => void submit()} disabled={submitting}><i className='fa-solid fa-paper-plane' /> {t.submit}</button>
        </div>
      </div>
    </div>
  )
}
