import { useMemo, useState } from 'react'
import { adminCoursesApi } from '../../../../api/adminCourses.api'
import { AlertJs } from '../../../../utils/alertJs'
import { autoTranslateFromVietnamese } from '../../tabs/i18nForm'

type Props = {
  open: boolean
  lang: 'vi' | 'en' | 'de'
  courseId: number
  onClose: () => void
  onCreated: () => Promise<void> | void
}

type AdminLang = 'vi' | 'en' | 'de'
type MediaType = 'VIDEO' | 'IMAGE'
type I18nText = Record<AdminLang, string>

type MediaForm = {
  title: I18nText
  description: I18nText
  mediaType: MediaType
  file: File | null
}

type ModuleForm = {
  title: I18nText
  description: I18nText
  medias: MediaForm[]
}

type FormState = {
  title: I18nText
  slug: string
  description: I18nText
  modules: ModuleForm[]
}

const emptyI18n = (): I18nText => ({ vi: '', en: '', de: '' })

const textByLang = {
  vi: {
    title: 'Tạo bài học mới',
    inputLang: 'Ngôn ngữ nhập liệu',
    lessonTitle: 'Tiêu đề bài học *',
    slug: 'Slug',
    lessonDescription: 'Mô tả bài học *',
    moduleTitle: 'Tên module *',
    moduleDescription: 'Mô tả module *',
    mediaTitle: 'Tiêu đề video/ảnh *',
    mediaDescription: 'Mô tả video/ảnh *',
    mediaType: 'Loại media *',
    mediaFile: 'File video/ảnh *',
    addModule: 'Thêm module',
    removeModule: 'Xóa module',
    addMedia: 'Thêm media',
    removeMedia: 'Xóa media',
    save: 'Tạo bài học',
    close: 'Đóng',
    missing: 'Vui lòng nhập đầy đủ thông tin tiếng Việt cho bài học, module và media.',
    moduleMissingMedia: 'Mỗi module cần ít nhất 1 media (ảnh hoặc video).',
    invalidFile: 'Vui lòng chọn đúng file ảnh/video cho từng media.',
    creating: 'Đang tạo bài học...',
    success: 'Đã tạo bài học mới.',
  },
  en: {
    title: 'Create new lesson',
    inputLang: 'Input language',
    lessonTitle: 'Lesson title *',
    slug: 'Slug',
    lessonDescription: 'Lesson description *',
    moduleTitle: 'Module title *',
    moduleDescription: 'Module description *',
    mediaTitle: 'Video/Image title *',
    mediaDescription: 'Video/Image description *',
    mediaType: 'Media type *',
    mediaFile: 'Video/Image file *',
    addModule: 'Add module',
    removeModule: 'Remove module',
    addMedia: 'Add media',
    removeMedia: 'Remove media',
    save: 'Create lesson',
    close: 'Close',
    missing: 'Please complete Vietnamese content for lesson, module, and media.',
    moduleMissingMedia: 'Each module must include at least one media file.',
    invalidFile: 'Please attach a valid image/video file for each media item.',
    creating: 'Creating lesson...',
    success: 'Created lesson successfully.',
  },
  de: {
    title: 'Neue Lektion erstellen',
    inputLang: 'Eingabesprache',
    lessonTitle: 'Lektionstitel *',
    slug: 'Slug',
    lessonDescription: 'Lektionsbeschreibung *',
    moduleTitle: 'Modulname *',
    moduleDescription: 'Modulbeschreibung *',
    mediaTitle: 'Video/Bild-Titel *',
    mediaDescription: 'Video/Bild-Beschreibung *',
    mediaType: 'Medientyp *',
    mediaFile: 'Video/Bild-Datei *',
    addModule: 'Modul hinzufügen',
    removeModule: 'Modul löschen',
    addMedia: 'Medium hinzufügen',
    removeMedia: 'Medium löschen',
    save: 'Lektion erstellen',
    close: 'Schließen',
    missing: 'Bitte füllen Sie die vietnamesischen Inhalte für Lektion, Modul und Medien aus.',
    moduleMissingMedia: 'Jedes Modul muss mindestens eine Mediendatei enthalten.',
    invalidFile: 'Bitte wählen Sie für jedes Medium eine gültige Bild-/Videodatei aus.',
    creating: 'Lektion wird erstellt...',
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

const createEmptyMedia = (): MediaForm => ({
  title: emptyI18n(),
  description: emptyI18n(),
  mediaType: 'VIDEO',
  file: null,
})

const createEmptyModule = (): ModuleForm => ({
  title: emptyI18n(),
  description: emptyI18n(),
  medias: [createEmptyMedia()],
})

const initialForm: FormState = {
  title: emptyI18n(),
  slug: '',
  description: emptyI18n(),
  modules: [createEmptyModule()],
}

const inferMediaTypeFromFile = (file: File | null): MediaType => {
  if (!file) return 'VIDEO'
  return file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO'
}

export function CreateLessonModal({ open, lang, courseId, onClose, onCreated }: Props) {
  const t = textByLang[lang]
  const [submitting, setSubmitting] = useState(false)
  const [inputLang, setInputLang] = useState<AdminLang>('vi')
  const [form, setForm] = useState<FormState>(initialForm)

  const slug = useMemo(() => slugify(form.title.vi), [form.title.vi])

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

  const addModule = () => setForm((prev) => ({ ...prev, modules: [...prev.modules, createEmptyModule()] }))

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

  const addMedia = (moduleIndex: number) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((module, idx) => idx === moduleIndex ? { ...module, medias: [...module.medias, createEmptyMedia()] } : module),
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
      await AlertJs.error(t.missing)
      return false
    }

    for (const module of form.modules) {
      if (!module.title.vi.trim() || !module.description.vi.trim()) {
        await AlertJs.error(t.missing)
        return false
      }
      if (!module.medias.length) {
        await AlertJs.error(t.moduleMissingMedia)
        return false
      }
      for (const media of module.medias) {
        if (!media.title.vi.trim() || !media.description.vi.trim() || !media.file) {
          await AlertJs.error(t.missing)
          return false
        }
        const isImage = media.file.type.startsWith('image/')
        const isVideo = media.file.type.startsWith('video/')
        if (!isImage && !isVideo) {
          await AlertJs.error(t.invalidFile)
          return false
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

      const createdLesson = await adminCoursesApi.createLesson(courseId, {
        title: form.title.vi.trim(),
        slug,
        description: form.description.vi.trim(),
        translations: {
          vi: { title: form.title.vi.trim(), description: form.description.vi.trim() },
          en: { title: form.title.en.trim(), description: form.description.en.trim() },
          de: { title: form.title.de.trim(), description: form.description.de.trim() },
        },
        modules: form.modules.map((module, moduleIndex) => ({
          title: module.title.vi.trim(),
          description: module.description.vi.trim(),
          order: moduleIndex,
          translations: {
            vi: { title: module.title.vi.trim(), description: module.description.vi.trim() },
            en: { title: module.title.en.trim(), description: module.description.en.trim() },
            de: { title: module.title.de.trim(), description: module.description.de.trim() },
          },
          videos: module.medias.map((media, mediaIndex) => ({
            title: media.title.vi.trim(),
            description: media.description.vi.trim(),
            mediaType: media.mediaType,
            sourceUrl: `pending-upload-${moduleIndex}-${mediaIndex}`,
            order: mediaIndex,
            translations: {
              vi: { title: media.title.vi.trim(), description: media.description.vi.trim() },
              en: { title: media.title.en.trim(), description: media.description.en.trim() },
              de: { title: media.title.de.trim(), description: media.description.de.trim() },
            },
          })),
        })),
      })

      const detail = await adminCoursesApi.getLessonDetail(createdLesson.id)

      for (let moduleIndex = 0; moduleIndex < form.modules.length; moduleIndex += 1) {
        const inputModule = form.modules[moduleIndex]
        const createdModule = detail.modules[moduleIndex]
        if (!createdModule) continue

        for (let mediaIndex = 0; mediaIndex < inputModule.medias.length; mediaIndex += 1) {
          const media = inputModule.medias[mediaIndex]
          if (!media.file) continue
          const uploadType = media.mediaType === 'IMAGE' ? 'image' : 'video'
          await adminCoursesApi.uploadModuleMedia(createdLesson.id, createdModule.id, media.file, uploadType, mediaIndex)
        }
      }

      await AlertJs.success(t.success)
      setForm(initialForm)
      setInputLang('vi')
      onClose()
      await onCreated()
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
                        <span className='admin-label'>{t.mediaFile}</span>
                        <input
                          className='admin-input'
                          type='file'
                          accept={media.mediaType === 'IMAGE' ? 'image/*' : 'video/*'}
                          onChange={(e) => updateMediaFile(moduleIndex, mediaIndex, e.target.files?.[0] || null)}
                        />
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
            <i className='fa-solid fa-floppy-disk' /> {submitting ? t.creating : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
