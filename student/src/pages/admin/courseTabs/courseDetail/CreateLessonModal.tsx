import { useEffect, useMemo, useState } from 'react'
import { adminCoursesApi, type CourseManagementApi, type LessonDetailAdmin, type LessonI18n } from '../../../../api/adminCourses.api'
import { AlertJs } from '../../../../utils/alertJs'
import { autoTranslateFromVietnamese } from '../../tabs/i18nForm'

type Props = {
  open: boolean
  lang: 'vi' | 'en' | 'de'
  courseId: number
  editingLesson?: LessonDetailAdmin | null
  onClose: () => void
  onSaved: () => Promise<void> | void
  coursesApi?: CourseManagementApi
}

type AdminLang = 'vi' | 'en' | 'de'
type MediaType = 'VIDEO' | 'IMAGE'
type I18nText = Record<AdminLang, string>

type MediaForm = {
  id?: number
  title: I18nText
  description: I18nText
  mediaType: MediaType
  sourceUrl?: string
  order: number
  file: File | null
}

type ModuleForm = {
  id?: number
  title: I18nText
  description: I18nText
  order: number
  medias: MediaForm[]
}

type FormState = {
  title: I18nText
  slug: string
  description: I18nText
  order: number
  modules: ModuleForm[]
}

const emptyI18n = (): I18nText => ({ vi: '', en: '', de: '' })

const textByLang = {
  vi: {
    createTitle: 'Tạo bài học mới',
    editTitle: 'Chỉnh sửa bài học',
    inputLang: 'Ngôn ngữ nhập liệu',
    lessonTitle: 'Tiêu đề bài học *',
    slug: 'Slug',
    lessonDescription: 'Mô tả bài học *',
    lessonOrder: 'Số thứ tự bài học *',
    moduleTitle: 'Tên module *',
    moduleDescription: 'Mô tả module *',
    moduleOrder: 'Số thứ tự module *',
    mediaTitle: 'Tiêu đề video/ảnh *',
    mediaDescription: 'Mô tả video/ảnh *',
    mediaType: 'Loại media *',
    mediaOrder: 'Số thứ tự media *',
    mediaFile: 'File video/ảnh',
    keepCurrentMedia: 'Giữ media hiện tại nếu không chọn file mới.',
    addModule: 'Thêm module',
    removeModule: 'Xóa module',
    addMedia: 'Thêm media',
    removeMedia: 'Xóa media',
    create: 'Tạo bài học',
    save: 'Lưu bài học',
    close: 'Đóng',
    missing: 'Vui lòng nhập đầy đủ thông tin tiếng Việt cho bài học, module và media.',
    moduleMissingMedia: 'Mỗi module cần ít nhất 1 media (ảnh hoặc video).',
    invalidFile: 'Vui lòng chọn đúng file ảnh/video cho từng media.',
    creating: 'Đang xử lý bài học...',
    uploadingMedia: 'Đang tải media {current}/{total}...',
    createSuccess: 'Đã tạo bài học mới.',
    updateSuccess: 'Đã cập nhật bài học.',
  },
  en: {
    createTitle: 'Create new lesson',
    editTitle: 'Edit lesson',
    inputLang: 'Input language',
    lessonTitle: 'Lesson title *',
    slug: 'Slug',
    lessonDescription: 'Lesson description *',
    lessonOrder: 'Lesson order *',
    moduleTitle: 'Module title *',
    moduleDescription: 'Module description *',
    moduleOrder: 'Module order *',
    mediaTitle: 'Video/Image title *',
    mediaDescription: 'Video/Image description *',
    mediaType: 'Media type *',
    mediaOrder: 'Media order *',
    mediaFile: 'Video/Image file',
    keepCurrentMedia: 'Keep current media if no file is selected.',
    addModule: 'Add module',
    removeModule: 'Remove module',
    addMedia: 'Add media',
    removeMedia: 'Remove media',
    create: 'Create lesson',
    save: 'Save lesson',
    close: 'Close',
    missing: 'Please complete Vietnamese content for lesson, module, and media.',
    moduleMissingMedia: 'Each module must include at least one media file.',
    invalidFile: 'Please attach a valid image/video file for each media item.',
    creating: 'Processing lesson...',
    uploadingMedia: 'Uploading media {current}/{total}...',
    createSuccess: 'Created lesson successfully.',
    updateSuccess: 'Lesson updated successfully.',
  },
  de: {
    createTitle: 'Neue Lektion erstellen',
    editTitle: 'Lektion bearbeiten',
    inputLang: 'Eingabesprache',
    lessonTitle: 'Lektionstitel *',
    slug: 'Slug',
    lessonDescription: 'Lektionsbeschreibung *',
    lessonOrder: 'Reihenfolge Lektion *',
    moduleTitle: 'Modulname *',
    moduleDescription: 'Modulbeschreibung *',
    moduleOrder: 'Reihenfolge Modul *',
    mediaTitle: 'Video/Bild-Titel *',
    mediaDescription: 'Video/Bild-Beschreibung *',
    mediaType: 'Medientyp *',
    mediaOrder: 'Reihenfolge Medien *',
    mediaFile: 'Video/Bild-Datei',
    keepCurrentMedia: 'Behalten Sie das aktuelle Medium, wenn keine neue Datei ausgewählt wird.',
    addModule: 'Modul hinzufügen',
    removeModule: 'Modul löschen',
    addMedia: 'Medium hinzufügen',
    removeMedia: 'Medium löschen',
    create: 'Lektion erstellen',
    save: 'Lektion speichern',
    close: 'Schließen',
    missing: 'Bitte füllen Sie die vietnamesischen Inhalte für Lektion, Modul und Medien aus.',
    moduleMissingMedia: 'Jedes Modul muss mindestens eine Mediendatei enthalten.',
    invalidFile: 'Bitte wählen Sie für jedes Medium eine gültige Bild-/Videodatei aus.',
    creating: 'Lektion wird verarbeitet...',
    uploadingMedia: 'Medien werden hochgeladen {current}/{total}...',
    createSuccess: 'Lektion erfolgreich erstellt.',
    updateSuccess: 'Lektion erfolgreich aktualisiert.',
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

const normalizeTranslations = (translations?: LessonI18n): I18nText => {
  const base = emptyI18n()
  if (!translations) return base
  if (Array.isArray(translations)) {
    translations.forEach((item) => {
      if (item.locale === 'vi' || item.locale === 'en' || item.locale === 'de') {
        base[item.locale] = item.title || ''
      }
    })
    return base
  }
  return {
    vi: translations.vi?.title || '',
    en: translations.en?.title || '',
    de: translations.de?.title || '',
  }
}

const normalizeDescriptions = (translations?: LessonI18n): I18nText => {
  const base = emptyI18n()
  if (!translations) return base
  if (Array.isArray(translations)) {
    translations.forEach((item) => {
      if (item.locale === 'vi' || item.locale === 'en' || item.locale === 'de') {
        base[item.locale] = item.description || ''
      }
    })
    return base
  }
  return {
    vi: translations.vi?.description || '',
    en: translations.en?.description || '',
    de: translations.de?.description || '',
  }
}

const createEmptyMedia = (): MediaForm => ({
  title: emptyI18n(),
  description: emptyI18n(),
  mediaType: 'VIDEO',
  order: 0,
  file: null,
})

const createEmptyModule = (): ModuleForm => ({
  title: emptyI18n(),
  description: emptyI18n(),
  order: 0,
  medias: [createEmptyMedia()],
})

const initialForm: FormState = {
  title: emptyI18n(),
  slug: '',
  description: emptyI18n(),
  order: 0,
  modules: [createEmptyModule()],
}

const inferMediaTypeFromFile = (file: File | null): MediaType => {
  if (!file) return 'VIDEO'
  return file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO'
}

const toNumber = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const buildFormFromLesson = (lesson: LessonDetailAdmin): FormState => ({
  title: {
    vi: normalizeTranslations(lesson.translations).vi || lesson.title || '',
    en: normalizeTranslations(lesson.translations).en,
    de: normalizeTranslations(lesson.translations).de,
  },
  slug: lesson.slug,
  description: {
    vi: normalizeDescriptions(lesson.translations).vi || lesson.description || '',
    en: normalizeDescriptions(lesson.translations).en,
    de: normalizeDescriptions(lesson.translations).de,
  },
  order: lesson.order ?? 0,
  modules: lesson.modules.length
    ? lesson.modules.map((module) => ({
      id: module.id,
      title: {
        vi: normalizeTranslations(module.translations).vi || module.title || '',
        en: normalizeTranslations(module.translations).en,
        de: normalizeTranslations(module.translations).de,
      },
      description: {
        vi: normalizeDescriptions(module.translations).vi || module.description || '',
        en: normalizeDescriptions(module.translations).en,
        de: normalizeDescriptions(module.translations).de,
      },
      order: module.order ?? 0,
      medias: module.videos.length
        ? module.videos.map((media) => ({
          id: media.id,
          title: {
            vi: normalizeTranslations(media.translations).vi || media.title || '',
            en: normalizeTranslations(media.translations).en,
            de: normalizeTranslations(media.translations).de,
          },
          description: {
            vi: normalizeDescriptions(media.translations).vi || media.description || '',
            en: normalizeDescriptions(media.translations).en,
            de: normalizeDescriptions(media.translations).de,
          },
          mediaType: media.mediaType || 'VIDEO',
          sourceUrl: media.sourceUrl || media.playbackUrl || media.hlsPlaylistKey || '',
          order: media.order ?? 0,
          file: null,
        }))
        : [createEmptyMedia()],
    }))
    : [createEmptyModule()],
})

export function CreateLessonModal({ open, lang, courseId, editingLesson, onClose, onSaved, coursesApi = adminCoursesApi }: Props) {
  const t = textByLang[lang]
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [inputLang, setInputLang] = useState<AdminLang>('vi')
  const [form, setForm] = useState<FormState>(initialForm)

  useEffect(() => {
    if (!open) return
    setInputLang('vi')
    setForm(editingLesson ? buildFormFromLesson(editingLesson) : initialForm)
  }, [open, editingLesson])

  const slug = useMemo(() => slugify(form.title.vi), [form.title.vi])
  const isEditMode = Boolean(editingLesson)

  if (!open) return null

  const translateVietnameseToOthers = async (value: string, updater: (en: string, de: string) => void) => {
    const [en, de] = await Promise.all([
      autoTranslateFromVietnamese(value, 'en-US').catch(() => ''),
      autoTranslateFromVietnamese(value, 'de').catch(() => ''),
    ])
    updater(en || '', de || '')
  }

  const updateLessonField = (field: 'title' | 'description', value: string) => {
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], [inputLang]: value }, ...(field === 'title' ? { slug: slugify(value) } : {}) }))
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

  const updateLessonOrder = (value: string) => {
    setForm((prev) => ({ ...prev, order: toNumber(value) }))
  }

  const addModule = () => {
    setForm((prev) => ({ ...prev, modules: [...prev.modules, { ...createEmptyModule(), order: prev.modules.length }] }))
  }

  const removeModule = (moduleIndex: number) => {
    setForm((prev) => {
      const nextModules = prev.modules.filter((_, idx) => idx !== moduleIndex)
      return { ...prev, modules: nextModules.length ? nextModules : [createEmptyModule()] }
    })
  }

  const updateModuleField = (moduleIndex: number, field: 'title' | 'description', value: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => idx === moduleIndex ? { ...module, [field]: { ...module[field], [inputLang]: value } } : module),
    }))

    if (inputLang !== 'vi') return
    void translateVietnameseToOthers(value, (en, de) => {
      setForm((prev) => ({
        ...prev,
        modules: prev.modules.map((module, idx) => idx === moduleIndex ? { ...module, [field]: { ...module[field], en, de } } : module),
      }))
    })
  }

  const updateModuleOrder = (moduleIndex: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => idx === moduleIndex ? { ...module, order: toNumber(value) } : module),
    }))
  }

  const addMedia = (moduleIndex: number) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => idx === moduleIndex ? { ...module, medias: [...module.medias, { ...createEmptyMedia(), order: module.medias.length }] } : module),
    }))
  }

  const removeMedia = (moduleIndex: number, mediaIndex: number) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => {
        if (idx !== moduleIndex) return module
        const nextMedias = module.medias.filter((_, mIdx) => mIdx !== mediaIndex)
        return { ...module, medias: nextMedias.length ? nextMedias : [createEmptyMedia()] }
      }),
    }))
  }

  const updateMediaField = (moduleIndex: number, mediaIndex: number, field: 'title' | 'description', value: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => {
        if (idx !== moduleIndex) return module
        return {
          ...module,
          medias: module.medias.map((media, mIdx) => mIdx === mediaIndex ? { ...media, [field]: { ...media[field], [inputLang]: value } } : media),
        }
      }),
    }))

    if (inputLang !== 'vi') return
    void translateVietnameseToOthers(value, (en, de) => {
      setForm((prev) => ({
        ...prev,
        modules: prev.modules.map((module, idx) => {
          if (idx !== moduleIndex) return module
          return {
            ...module,
            medias: module.medias.map((media, mIdx) => mIdx === mediaIndex ? { ...media, [field]: { ...media[field], en, de } } : media),
          }
        }),
      }))
    })
  }

  const updateMediaType = (moduleIndex: number, mediaIndex: number, mediaType: MediaType) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => {
        if (idx !== moduleIndex) return module
        return {
          ...module,
          medias: module.medias.map((media, mIdx) => (mIdx === mediaIndex ? { ...media, mediaType } : media)),
        }
      }),
    }))
  }

  const updateMediaOrder = (moduleIndex: number, mediaIndex: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => {
        if (idx !== moduleIndex) return module
        return {
          ...module,
          medias: module.medias.map((media, mIdx) => mIdx === mediaIndex ? { ...media, order: toNumber(value) } : media),
        }
      }),
    }))
  }

  const updateMediaFile = (moduleIndex: number, mediaIndex: number, file: File | null) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => {
        if (idx !== moduleIndex) return module
        return {
          ...module,
          medias: module.medias.map((media, mIdx) => {
            if (mIdx !== mediaIndex) return media
            return { ...media, file, mediaType: inferMediaTypeFromFile(file) }
          }),
        }
      }),
    }))
  }

  const validate = async () => {
    if (!form.title.vi.trim() || !form.description.vi.trim() || !slug.trim()) {
      await AlertJs.error(t.missing, '')
      return false
    }

    for (const module of form.modules) {
      if (!module.title.vi.trim() || !module.description.vi.trim()) {
        await AlertJs.error(t.missing, '')
        return false
      }
      if (!module.medias.length) {
        await AlertJs.error(t.moduleMissingMedia, '')
        return false
      }
      for (const media of module.medias) {
        if (!media.title.vi.trim() || !media.description.vi.trim()) {
          await AlertJs.error(t.missing, '')
          return false
        }
        if (!media.file && !media.sourceUrl) {
          await AlertJs.error(t.missing, '')
          return false
        }
        if (media.file) {
          const isImage = media.file.type.startsWith('image/')
          const isVideo = media.file.type.startsWith('video/')
          if (!isImage && !isVideo) {
            await AlertJs.error(t.invalidFile, '')
            return false
          }
        }
      }
    }

    return true
  }

  const submit = async () => {
    const ok = await validate()
    if (!ok) return

    try {
      setSubmitting(true)

      const payload = {
        title: form.title.vi.trim(),
        slug,
        description: form.description.vi.trim(),
        order: form.order,
        translations: {
          vi: { title: form.title.vi.trim(), description: form.description.vi.trim() },
          en: { title: form.title.en.trim(), description: form.description.en.trim() },
          de: { title: form.title.de.trim(), description: form.description.de.trim() },
        },
        modules: form.modules.map((module, moduleIndex) => ({
          title: module.title.vi.trim(),
          description: module.description.vi.trim(),
          order: module.order,
          translations: {
            vi: { title: module.title.vi.trim(), description: module.description.vi.trim() },
            en: { title: module.title.en.trim(), description: module.description.en.trim() },
            de: { title: module.title.de.trim(), description: module.description.de.trim() },
          },
          videos: module.medias.map((media, mediaIndex) => ({
            title: media.title.vi.trim(),
            description: media.description.vi.trim(),
            mediaType: media.mediaType,
            sourceUrl: media.sourceUrl || `pending-upload-${moduleIndex}-${mediaIndex}`,
            order: media.order,
            translations: {
              vi: { title: media.title.vi.trim(), description: media.description.vi.trim() },
              en: { title: media.title.en.trim(), description: media.description.en.trim() },
              de: { title: media.title.de.trim(), description: media.description.de.trim() },
            },
          })),
        })),
      }

      const persistedLesson = isEditMode && editingLesson
        ? await coursesApi.updateLesson(editingLesson.id, payload)
        : await coursesApi.createLesson(courseId, payload)

      const detail = await coursesApi.getLessonDetail(persistedLesson.id, lang)
      const totalMediaCount = form.modules.reduce((sum, module) => sum + module.medias.filter((media) => Boolean(media.file)).length, 0)
      setUploadProgress(totalMediaCount > 0 ? { current: 0, total: totalMediaCount } : null)
      let uploadedCount = 0

      for (let moduleIndex = 0; moduleIndex < form.modules.length; moduleIndex += 1) {
        const inputModule = form.modules[moduleIndex]
        const createdModule = detail.modules[moduleIndex]
        if (!createdModule) continue

        for (let mediaIndex = 0; mediaIndex < inputModule.medias.length; mediaIndex += 1) {
          const media = inputModule.medias[mediaIndex]
          if (!media.file) continue
          const uploadType = media.mediaType === 'IMAGE' ? 'image' : 'video'
          await coursesApi.uploadModuleMedia(detail.id, createdModule.id, media.file, uploadType, media.order)
          uploadedCount += 1
          setUploadProgress(totalMediaCount > 0 ? { current: uploadedCount, total: totalMediaCount } : null)
        }
      }

      await AlertJs.success(isEditMode ? t.updateSuccess : t.createSuccess)
      setForm(initialForm)
      setInputLang('vi')
      onClose()
      await onSaved()
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  const uploadProgressText = uploadProgress
    ? t.uploadingMedia
      .replace('{current}', String(uploadProgress.current))
      .replace('{total}', String(uploadProgress.total))
    : t.creating

  return (
    <div className='admin-modal-backdrop' role='dialog' aria-modal='true'>
      <div className='admin-modal create-course-modal'>
        <div className='admin-modal-header'>
          <h4><i className={`fa-solid ${isEditMode ? 'fa-pen-to-square' : 'fa-circle-plus'}`} /> {isEditMode ? t.editTitle : t.createTitle}</h4>
          <button type='button' className='admin-btn admin-btn-ghost' onClick={onClose}>{t.close}</button>
        </div>

        <div className='admin-row' style={{ marginBottom: 8, justifyContent: 'space-between' }}>
          <span className='admin-label'>{t.inputLang}</span>
          <div className='admin-row' style={{ gap: 8 }}>
            {(['vi', 'en', 'de'] as AdminLang[]).map((code) => (
              <button key={code} type='button' className={`admin-btn ${inputLang === code ? 'admin-btn-primary' : 'admin-btn-ghost'}`} onClick={() => setInputLang(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className='admin-form-grid admin-form-grid-2col'>
          <label className='admin-field'>
            <span className='admin-label'>{t.lessonTitle}</span>
            <input className='admin-input' value={form.title[inputLang]} onChange={(e) => updateLessonField('title', e.target.value)} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'>{t.slug}</span>
            <input className='admin-input' value={slug || form.slug} disabled />
          </label>

          <label className='admin-field'>
            <span className='admin-label'>{t.lessonOrder}</span>
            <input className='admin-input' type='number' min={0} value={form.order} onChange={(e) => updateLessonOrder(e.target.value)} />
          </label>

          <label className='admin-field admin-field-full'>
            <span className='admin-label'>{t.lessonDescription}</span>
            <textarea className='admin-input' rows={2} value={form.description[inputLang]} onChange={(e) => updateLessonField('description', e.target.value)} />
          </label>

          {form.modules.map((module, moduleIndex) => (
            <div className='admin-field admin-card admin-field-full' key={`module-${moduleIndex}`} style={{ marginBottom: 0 }}>
              <div className='admin-row' style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>Module {moduleIndex + 1}</strong>
                <button type='button' className='admin-btn admin-btn-danger' onClick={() => removeModule(moduleIndex)}>
                  <i className='fa-solid fa-trash' /> {t.removeModule}
                </button>
              </div>

              <div className='admin-form-grid admin-form-grid-2col'>
                <label className='admin-field'>
                  <span className='admin-label'>{t.moduleTitle}</span>
                  <input className='admin-input' value={module.title[inputLang]} onChange={(e) => updateModuleField(moduleIndex, 'title', e.target.value)} />
                </label>
                <label className='admin-field'>
                  <span className='admin-label'>{t.moduleDescription}</span>
                  <input className='admin-input' value={module.description[inputLang]} onChange={(e) => updateModuleField(moduleIndex, 'description', e.target.value)} />
                </label>

                <label className='admin-field admin-field-full'>
                  <span className='admin-label'>{t.moduleOrder}</span>
                  <input className='admin-input' type='number' min={0} value={module.order} onChange={(e) => updateModuleOrder(moduleIndex, e.target.value)} />
                </label>

                {module.medias.map((media, mediaIndex) => (
                  <div className='admin-card admin-field-full' key={`module-${moduleIndex}-media-${mediaIndex}`}>
                    <div className='admin-row' style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Media {mediaIndex + 1}</span>
                      <button type='button' className='admin-btn admin-btn-danger' onClick={() => removeMedia(moduleIndex, mediaIndex)}>
                        <i className='fa-solid fa-trash' /> {t.removeMedia}
                      </button>
                    </div>

                    <div className='admin-form-grid admin-form-grid-2col'>
                      <label className='admin-field'>
                        <span className='admin-label'>{t.mediaTitle}</span>
                        <input className='admin-input' value={media.title[inputLang]} onChange={(e) => updateMediaField(moduleIndex, mediaIndex, 'title', e.target.value)} />
                      </label>
                      <label className='admin-field'>
                        <span className='admin-label'>{t.mediaDescription}</span>
                        <input className='admin-input' value={media.description[inputLang]} onChange={(e) => updateMediaField(moduleIndex, mediaIndex, 'description', e.target.value)} />
                      </label>

                      <label className='admin-field'>
                        <span className='admin-label'>{t.mediaType}</span>
                        <select className='admin-input' value={media.mediaType} onChange={(e) => updateMediaType(moduleIndex, mediaIndex, e.target.value as MediaType)}>
                          <option value='VIDEO'>Video</option>
                          <option value='IMAGE'>Image</option>
                        </select>
                      </label>
                      <label className='admin-field'>
                        <span className='admin-label'>{t.mediaOrder}</span>
                        <input className='admin-input' type='number' min={0} value={media.order} onChange={(e) => updateMediaOrder(moduleIndex, mediaIndex, e.target.value)} />
                      </label>

                      <label className='admin-field admin-field-full'>
                        <span className='admin-label'>{t.mediaFile}</span>
                        <input
                          className='admin-input'
                          type='file'
                          accept={media.mediaType === 'IMAGE' ? 'image/*' : 'video/*'}
                          onChange={(e) => updateMediaFile(moduleIndex, mediaIndex, e.target.files?.[0] || null)}
                        />
                        {media.sourceUrl && <small className='admin-helper'>{t.keepCurrentMedia}</small>}
                      </label>
                    </div>
                  </div>
                ))}

                <div className='admin-field admin-field-full'>
                  <button type='button' className='admin-btn admin-btn-ghost' onClick={() => addMedia(moduleIndex)}>
                    <i className='fa-solid fa-plus' /> {t.addMedia}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className='admin-field admin-field-full'>
            <button type='button' className='admin-btn admin-btn-ghost' onClick={addModule}>
              <i className='fa-solid fa-plus' /> {t.addModule}
            </button>
          </div>
        </div>

        <div className='admin-row create-course-footer'>
          <button type='button' className='admin-btn admin-btn-save' disabled={submitting} onClick={() => void submit()}>
            <i className={`fa-solid ${submitting ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} /> {submitting ? uploadProgressText : isEditMode ? t.save : t.create}
          </button>
        </div>
      </div>
    </div>
  )
}
