import { useMemo, useState } from 'react'
import {
  adminCoursesApi,
  type CourseAdmin,
  type CoursePayload,
  type CourseTopic,
  type LessonAdmin,
  type LessonDetailAdmin,
  type LessonModulePayload,
  type LessonPayload,
  type LessonVideoPayload,
  type LocalizedText,
} from '../../../api/adminCourses.api'
import { AlertJs } from '../../../utils/alertJs'
import { autoTranslateFromVietnamese } from '../tabs/i18nForm'

type Props = {
  courses: CourseAdmin[]
  topics: CourseTopic[]
  text: Record<string, string>
  onCreateCourse: (payload: CoursePayload) => Promise<void>
  onUpdateCourse: (id: number, payload: Partial<CoursePayload>) => Promise<void>
  onDeleteCourse: (course: CourseAdmin) => Promise<void>
}

type Lang = 'vi' | 'en-US' | 'de'

type CourseForm = {
  topicId?: number
  title: string
  slug: string
  description: string
  thumbnail: string
  price: number
  published: boolean
  titleI18n: LocalizedText
  descriptionI18n: LocalizedText
  objectivesText: string
  audienceText: string
  benefitsText: string
  ratingAvg: number
  ratingCount: number
  enrollmentCount: number
}

type VideoDraft = LessonVideoPayload & { id?: number }
type ModuleDraft = LessonModulePayload & { id?: number; videos: VideoDraft[] }
type LessonDraft = {
  id?: number
  title: string
  slug: string
  description?: string
  titleI18n: LocalizedText
  descriptionI18n: LocalizedText
  content?: string
  order: number
  published: boolean
  modules: ModuleDraft[]
}

const emptyCourseForm: CourseForm = {
  title: '', slug: '', description: '', thumbnail: '', price: 0, published: false,
  titleI18n: { vi: '', 'en-US': '', de: '' },
  descriptionI18n: { vi: '', 'en-US': '', de: '' },
  objectivesText: '', audienceText: '', benefitsText: '',
  ratingAvg: 0, ratingCount: 0, enrollmentCount: 0,
}

const emptyLessonDraft: LessonDraft = {
  title: '', slug: '', description: '', titleI18n: { vi: '', 'en-US': '', de: '' },
  descriptionI18n: { vi: '', 'en-US': '', de: '' },
  content: '', order: 1, published: true,
  modules: [{ title: '', description: '', titleI18n: { vi: '', 'en-US': '', de: '' }, descriptionI18n: { vi: '', 'en-US': '', de: '' }, order: 1, published: true, videos: [{ title: '', description: '', titleI18n: { vi: '', 'en-US': '', de: '' }, descriptionI18n: { vi: '', 'en-US': '', de: '' }, sourceUrl: '', durationSec: 0, order: 1, published: true }] }],
}

const linesToArray = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean)

function toCourseForm(course: CourseAdmin): CourseForm {
  return {
    topicId: course.topicId || undefined,
    title: course.title || '',
    slug: course.slug || '',
    description: course.description || '',
    thumbnail: course.thumbnail || '',
    price: Number(course.price) || 0,
    published: Boolean(course.published),
    titleI18n: {
      vi: course.titleI18n?.vi || course.title || '',
      'en-US': course.titleI18n?.['en-US'] || '',
      de: course.titleI18n?.de || '',
    },
    descriptionI18n: {
      vi: course.descriptionI18n?.vi || course.description || '',
      'en-US': course.descriptionI18n?.['en-US'] || '',
      de: course.descriptionI18n?.de || '',
    },
    objectivesText: (course.objectives || []).join('\n'),
    audienceText: (course.targetAudience || []).join('\n'),
    benefitsText: (course.benefits || []).join('\n'),
    ratingAvg: Number(course.ratingAvg) || 0,
    ratingCount: Number(course.ratingCount) || 0,
    enrollmentCount: Number(course.enrollmentCount) || 0,
  }
}

function toLessonDraft(detail: LessonDetailAdmin): LessonDraft {
  return {
    id: detail.id,
    title: detail.title,
    slug: detail.slug,
    description: detail.description,
    titleI18n: detail.titleI18n || { vi: '', 'en-US': '', de: '' },
    descriptionI18n: detail.descriptionI18n || { vi: '', 'en-US': '', de: '' },
    content: detail.content,
    order: detail.order || 1,
    published: detail.published,
    modules: (detail.modules || []).map((m, mi) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      titleI18n: m.titleI18n || { vi: '', 'en-US': '', de: '' },
      descriptionI18n: m.descriptionI18n || { vi: '', 'en-US': '', de: '' },
      order: m.order ?? mi + 1,
      published: m.published ?? true,
      videos: (m.videos || []).map((v, vi) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        titleI18n: v.titleI18n || { vi: '', 'en-US': '', de: '' },
        descriptionI18n: v.descriptionI18n || { vi: '', 'en-US': '', de: '' },
        sourceUrl: v.sourceUrl,
        durationSec: v.durationSec,
        order: v.order ?? vi + 1,
        published: v.published ?? true,
      })),
    })),
  }
}

export function CoursesTab({ courses, topics, text, onCreateCourse, onUpdateCourse, onDeleteCourse }: Props) {
  const [langMode, setLangMode] = useState<Lang>('vi')
  const [form, setForm] = useState<CourseForm>(emptyCourseForm)
  const [editing, setEditing] = useState<CourseAdmin | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [lessons, setLessons] = useState<LessonAdmin[]>([])
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(emptyLessonDraft)
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string>('')

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => b.id - a.id), [courses])

  const loadLessons = async (courseId: number) => {
    try {
      setLessons(await adminCoursesApi.listCourseLessons(courseId))
    } catch (e: any) {
      AlertJs.error(e?.message || 'Không tải được bài học')
      setLessons([])
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCourseForm)
    setLessons([])
    setLessonDraft(emptyLessonDraft)
    setEditingLessonId(null)
    setLangMode('vi')
    setModalOpen(true)
  }

  const openEdit = async (course: CourseAdmin) => {
    setEditing(course)
    setForm(toCourseForm(course))
    setLessonDraft(emptyLessonDraft)
    setEditingLessonId(null)
    setLangMode('vi')
    setModalOpen(true)
    await loadLessons(course.id)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const autoTranslateCourse = (field: 'titleI18n' | 'descriptionI18n', value: string) => {
    setForm((prev) => ({ ...prev, [field]: { ...prev[field], vi: value } }))
    void Promise.all([autoTranslateFromVietnamese(value, 'en-US'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => {
      setForm((prev) => ({ ...prev, [field]: { ...prev[field], 'en-US': en, de } }))
    })
  }

  const submitCourse = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      AlertJs.error('Tiêu đề và slug là bắt buộc')
      return
    }

    const payload: CoursePayload = {
      topicId: form.topicId,
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      thumbnail: form.thumbnail.trim() || undefined,
      price: Number(form.price || 0),
      published: form.published,
      titleI18n: form.titleI18n,
      descriptionI18n: form.descriptionI18n,
      objectives: linesToArray(form.objectivesText),
      targetAudience: linesToArray(form.audienceText),
      benefits: linesToArray(form.benefitsText),
      ratingAvg: Number(form.ratingAvg || 0),
      ratingCount: Number(form.ratingCount || 0),
      enrollmentCount: Number(form.enrollmentCount || 0),
    }

    setSaving(true)
    try {
      if (editing) await onUpdateCourse(editing.id, payload)
      else await onCreateCourse(payload)
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const addModule = () => {
    setLessonDraft((prev) => ({
      ...prev,
      modules: [...prev.modules, { title: '', description: '', titleI18n: { vi: '', 'en-US': '', de: '' }, descriptionI18n: { vi: '', 'en-US': '', de: '' }, order: prev.modules.length + 1, published: true, videos: [] }],
    }))
  }

  const removeModule = (idx: number) => {
    setLessonDraft((prev) => ({ ...prev, modules: prev.modules.filter((_, i) => i !== idx) }))
  }

  const updateModule = (idx: number, patch: Partial<ModuleDraft>) => {
    setLessonDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }))
  }

  const addVideo = (moduleIdx: number) => {
    setLessonDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => i === moduleIdx
        ? { ...m, videos: [...m.videos, { title: '', description: '', titleI18n: { vi: '', 'en-US': '', de: '' }, descriptionI18n: { vi: '', 'en-US': '', de: '' }, sourceUrl: '', durationSec: 0, order: m.videos.length + 1, published: true }] }
        : m),
    }))
  }

  const removeVideo = (moduleIdx: number, videoIdx: number) => {
    setLessonDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => i === moduleIdx ? { ...m, videos: m.videos.filter((_, vi) => vi !== videoIdx) } : m),
    }))
  }

  const updateVideo = (moduleIdx: number, videoIdx: number, patch: Partial<VideoDraft>) => {
    setLessonDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) => i === moduleIdx
        ? { ...m, videos: m.videos.map((v, vi) => (vi === videoIdx ? { ...v, ...patch } : v)) }
        : m),
    }))
  }

  const autoTranslateLesson = (kind: 'lessonTitle' | 'lessonDesc' | 'moduleTitle' | 'moduleDesc' | 'videoTitle' | 'videoDesc', value: string, moduleIdx?: number, videoIdx?: number) => {
    const apply = (en: string, de: string) => {
      setLessonDraft((prev) => {
        if (kind === 'lessonTitle') return { ...prev, titleI18n: { ...prev.titleI18n, vi: value, 'en-US': en, de } }
        if (kind === 'lessonDesc') return { ...prev, descriptionI18n: { ...prev.descriptionI18n, vi: value, 'en-US': en, de } }
        if (moduleIdx === undefined) return prev
        if (kind === 'moduleTitle') {
          const modules = prev.modules.map((m, i) => i === moduleIdx ? { ...m, titleI18n: { ...m.titleI18n, vi: value, 'en-US': en, de } } : m)
          return { ...prev, modules }
        }
        if (kind === 'moduleDesc') {
          const modules = prev.modules.map((m, i) => i === moduleIdx ? { ...m, descriptionI18n: { ...m.descriptionI18n, vi: value, 'en-US': en, de } } : m)
          return { ...prev, modules }
        }
        if (videoIdx === undefined) return prev
        const modules = prev.modules.map((m, i) => i !== moduleIdx ? m : {
          ...m,
          videos: m.videos.map((v, vi) => {
            if (vi !== videoIdx) return v
            if (kind === 'videoTitle') return { ...v, titleI18n: { ...v.titleI18n, vi: value, 'en-US': en, de } }
            return { ...v, descriptionI18n: { ...v.descriptionI18n, vi: value, 'en-US': en, de } }
          }),
        })
        return { ...prev, modules }
      })
    }

    void Promise.all([autoTranslateFromVietnamese(value, 'en-US'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => apply(en, de))
  }

  const saveLesson = async () => {
    if (!editing) return
    if (!lessonDraft.title.trim() || !lessonDraft.slug.trim()) {
      AlertJs.error('Vui lòng nhập tiêu đề + slug bài học')
      return
    }

    const payload: LessonPayload = {
      title: lessonDraft.title.trim(),
      slug: lessonDraft.slug.trim(),
      description: lessonDraft.description,
      titleI18n: lessonDraft.titleI18n,
      descriptionI18n: lessonDraft.descriptionI18n,
      content: lessonDraft.content,
      order: lessonDraft.order,
      published: lessonDraft.published,
      modules: lessonDraft.modules.map((m) => ({
        title: m.title,
        description: m.description,
        titleI18n: m.titleI18n,
        descriptionI18n: m.descriptionI18n,
        order: m.order,
        published: m.published,
        videos: m.videos.map((v) => ({
          title: v.title,
          description: v.description,
          titleI18n: v.titleI18n,
          descriptionI18n: v.descriptionI18n,
          sourceUrl: v.sourceUrl,
          durationSec: Number(v.durationSec || 0),
          order: v.order,
          published: v.published,
        })),
      })),
    }

    try {
      if (editingLessonId) {
        await adminCoursesApi.updateLesson(editingLessonId, payload)
        AlertJs.success('Đã cập nhật bài học')
      } else {
        await adminCoursesApi.createLesson(editing.id, payload)
        AlertJs.success('Đã tạo bài học')
      }
      await loadLessons(editing.id)
      setLessonDraft(emptyLessonDraft)
      setEditingLessonId(null)
    } catch (e: any) {
      AlertJs.error(e?.message || 'Lưu bài học thất bại')
    }
  }

  const editLesson = async (lessonId: number) => {
    try {
      const detail = await adminCoursesApi.getLessonDetail(lessonId)
      setLessonDraft(toLessonDraft(detail))
      setEditingLessonId(lessonId)
    } catch (e: any) {
      AlertJs.error(e?.message || 'Không tải được chi tiết bài học')
    }
  }

  const deleteLesson = async (lessonId: number) => {
    if (!editing) return
    try {
      await adminCoursesApi.deleteLesson(lessonId)
      AlertJs.success('Đã xoá bài học')
      await loadLessons(editing.id)
      if (editingLessonId === lessonId) {
        setLessonDraft(emptyLessonDraft)
        setEditingLessonId(null)
      }
    } catch (e: any) {
      AlertJs.error(e?.message || 'Xoá bài học thất bại')
    }
  }

  const uploadVideo = async (lessonId: number, moduleId?: number, file?: File | null) => {
    if (!moduleId || !file) {
      AlertJs.error('Hãy lưu bài học trước để có module ID rồi mới upload video')
      return
    }
    const key = `${lessonId}-${moduleId}`
    setUploadingFor(key)
    try {
      await adminCoursesApi.uploadModuleVideo(lessonId, moduleId, file)
      AlertJs.success('Đã upload video, backend đang xử lý HLS + lưu private bucket')
    } catch (e: any) {
      AlertJs.error(e?.message || 'Upload video thất bại')
    } finally {
      setUploadingFor('')
    }
  }

  return (
    <section className='admin-card admin-card-glow admin-course-management-card'>
      <div className='admin-row' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className='admin-card-title'><i className='fa-solid fa-book' /> {text.coursesTab} ({courses.length})</h3>
        <button
            className="admin-btn admin-btn-save"
            type="button"
            style={{ marginBottom: '10px' }}
            onClick={openCreate}
        >
          <i className="fa-solid fa-circle-plus" /> Tạo khoá học
        </button>
      </div>

      <div className='admin-table-wrap'>
        <table className='admin-table admin-table-courses-full no-scroll-table'>
          <thead>
            <tr>
              <th>ID</th><th>Tiêu đề</th><th>Chủ đề</th><th>Giá</th><th>Rating</th><th>Đăng ký</th><th>Bài học</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td className='td-strong'>{c.title}</td>
                <td>{c.topic?.name || 'Chưa gán'}</td>
                <td>{(c.price || 0).toLocaleString('vi-VN')}đ</td>
                <td>{c.ratingAvg ?? 0} ({c.ratingCount ?? 0})</td>
                <td>{c.enrollmentCount ?? 0}</td>
                <td>{c._count?.lessons ?? 0}</td>
                <td><span className={`status-pill ${c.published ? 'is-published' : 'is-draft'}`}>{c.published ? 'Published' : 'Draft'}</span></td>
                <td>
                  <div className='admin-row'>
                    <button className='admin-btn admin-btn-primary' type='button' onClick={() => void openEdit(c)}><i className='fa-solid fa-pen' /></button>
                    <button className='admin-btn admin-btn-danger' type='button' onClick={() => void onDeleteCourse(c)}><i className='fa-solid fa-trash' /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className='admin-modal-backdrop' role='dialog' aria-modal='true'>
          <div className='admin-modal admin-modal-compact'>
            <div className='admin-modal-header'>
              <h4><i className='fa-solid fa-pen-ruler' /> {editing ? 'Chỉnh sửa khoá học' : 'Tạo khoá học mới'}</h4>
              <div className='admin-row'>
                {(['vi', 'en-US', 'de'] as Lang[]).map((l) => (
                  <button key={l} type='button' className={`admin-btn ${langMode === l ? 'admin-btn-primary' : 'admin-btn-ghost'}`} onClick={() => setLangMode(l)}>{l === 'en-US' ? 'EN' : l.toUpperCase()}</button>
                ))}
                <button type='button' className='admin-btn admin-btn-ghost' onClick={closeModal}>Đóng</button>
              </div>
            </div>

            <section className='admin-form-grid admin-form-grid-2col'>
              <label className='admin-field'><span className='admin-label'>Tiêu đề *</span><input className='admin-input' value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
              <label className='admin-field'><span className='admin-label'>Slug *</span><input className='admin-input' value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} /></label>
              <label className='admin-field'><span className='admin-label'>Chủ đề</span><select className='admin-input' value={form.topicId || ''} onChange={(e) => setForm((p) => ({ ...p, topicId: e.target.value ? Number(e.target.value) : undefined }))}><option value=''>-- Chưa gán --</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
              <label className='admin-field'><span className='admin-label'>Ảnh khoá học (public URL)</span><input className='admin-input' value={form.thumbnail} onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))} /></label>
              <label className='admin-field admin-field-full'><span className='admin-label'>Mô tả</span><textarea rows={2} className='admin-input' value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
              <label className='admin-field'><span className='admin-label'>Giá (VND)</span><input type='number' className='admin-input' value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} /></label>
              <label className='admin-field'><span className='admin-label'>Rating TB</span><input type='number' min={0} max={5} step={0.1} className='admin-input' value={form.ratingAvg} onChange={(e) => setForm((p) => ({ ...p, ratingAvg: Number(e.target.value) }))} /></label>
              <label className='admin-field'><span className='admin-label'>Lượt đánh giá</span><input type='number' className='admin-input' value={form.ratingCount} onChange={(e) => setForm((p) => ({ ...p, ratingCount: Number(e.target.value) }))} /></label>
              <label className='admin-field'><span className='admin-label'>Số đăng ký</span><input type='number' className='admin-input' value={form.enrollmentCount} onChange={(e) => setForm((p) => ({ ...p, enrollmentCount: Number(e.target.value) }))} /></label>

              <div className='admin-field admin-field-full'>
                <span className='admin-label'>Dữ liệu đa ngôn ngữ ({langMode})</span>
                <div className='admin-row'>
                  <input className='admin-input' placeholder='Title i18n' value={(form.titleI18n[langMode] || '') as string} onChange={(e) => {
                    const value = e.target.value
                    if (langMode === 'vi') autoTranslateCourse('titleI18n', value)
                    else setForm((p) => ({ ...p, titleI18n: { ...p.titleI18n, [langMode]: value } }))
                  }} />
                  <input className='admin-input' placeholder='Description i18n' value={(form.descriptionI18n[langMode] || '') as string} onChange={(e) => {
                    const value = e.target.value
                    if (langMode === 'vi') autoTranslateCourse('descriptionI18n', value)
                    else setForm((p) => ({ ...p, descriptionI18n: { ...p.descriptionI18n, [langMode]: value } }))
                  }} />
                </div>
              </div>

              <label className='admin-field'><span className='admin-label'>Mục tiêu (mỗi dòng 1)</span><textarea rows={2} className='admin-input' value={form.objectivesText} onChange={(e) => setForm((p) => ({ ...p, objectivesText: e.target.value }))} /></label>
              <label className='admin-field'><span className='admin-label'>Đối tượng phù hợp (mỗi dòng 1)</span><textarea rows={2} className='admin-input' value={form.audienceText} onChange={(e) => setForm((p) => ({ ...p, audienceText: e.target.value }))} /></label>
              <label className='admin-field admin-field-full'><span className='admin-label'>Lợi ích (mỗi dòng 1)</span><textarea rows={2} className='admin-input' value={form.benefitsText} onChange={(e) => setForm((p) => ({ ...p, benefitsText: e.target.value }))} /></label>
              <div className='admin-row admin-field-full' style={{ justifyContent: 'space-between' }}>
                <label className='admin-check'><input type='checkbox' checked={form.published} onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))} /><span>Xuất bản khoá học</span></label>
                <button className='admin-btn admin-btn-save' onClick={() => void submitCourse()} disabled={saving}><i className='fa-solid fa-floppy-disk' /> {editing ? 'Cập nhật khoá học' : 'Tạo khoá học'}</button>
              </div>
            </section>

            {editing && (
              <section className='admin-curriculum-grid' style={{ marginTop: 10 }}>
                <article className='admin-card'>
                  <h4 className='admin-card-title'><i className='fa-solid fa-list-check' /> Bài học / Module / Video</h4>
                  <div className='admin-table-wrap'>
                    <table className='admin-table'>
                      <thead><tr><th>ID</th><th>Tiêu đề</th><th>Slug</th><th>Order</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                      <tbody>
                        {lessons.map((l) => (
                          <tr key={l.id}>
                            <td>{l.id}</td><td>{l.title}</td><td>{l.slug}</td><td>{l.order}</td><td>{l.published ? 'Published' : 'Draft'}</td>
                            <td>
                              <div className='admin-row'>
                                <button className='admin-btn admin-btn-primary' type='button' onClick={() => void editLesson(l.id)}><i className='fa-solid fa-pen' /></button>
                                <button className='admin-btn admin-btn-danger' type='button' onClick={() => void deleteLesson(l.id)}><i className='fa-solid fa-trash' /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className='admin-card'>
                  <h4 className='admin-card-title'><i className='fa-solid fa-plus' /> {editingLessonId ? 'Sửa bài học' : 'Tạo bài học mới'}</h4>
                  <div className='admin-form-grid'>
                    <label className='admin-field'><span className='admin-label'>Tiêu đề</span><input className='admin-input' value={lessonDraft.title} onChange={(e) => setLessonDraft((p) => ({ ...p, title: e.target.value }))} /></label>
                    <label className='admin-field'><span className='admin-label'>Slug</span><input className='admin-input' value={lessonDraft.slug} onChange={(e) => setLessonDraft((p) => ({ ...p, slug: e.target.value }))} /></label>
                    <label className='admin-field'><span className='admin-label'>Thứ tự</span><input type='number' className='admin-input' value={lessonDraft.order} onChange={(e) => setLessonDraft((p) => ({ ...p, order: Number(e.target.value) }))} /></label>
                    <label className='admin-check'><input type='checkbox' checked={lessonDraft.published} onChange={(e) => setLessonDraft((p) => ({ ...p, published: e.target.checked }))} /><span>Published</span></label>
                    <label className='admin-field admin-field-full'><span className='admin-label'>Mô tả bài học</span><textarea rows={2} className='admin-input' value={lessonDraft.description || ''} onChange={(e) => setLessonDraft((p) => ({ ...p, description: e.target.value }))} /></label>
                    <label className='admin-field admin-field-full'><span className='admin-label'>Nội dung bài học</span><textarea rows={2} className='admin-input' value={lessonDraft.content || ''} onChange={(e) => setLessonDraft((p) => ({ ...p, content: e.target.value }))} /></label>

                    <div className='admin-field admin-field-full'>
                      <span className='admin-label'>Lesson i18n ({langMode})</span>
                      <div className='admin-row'>
                        <input className='admin-input' placeholder='Lesson title i18n' value={(lessonDraft.titleI18n[langMode] || '') as string} onChange={(e) => {
                          const value = e.target.value
                          if (langMode === 'vi') autoTranslateLesson('lessonTitle', value)
                          else setLessonDraft((p) => ({ ...p, titleI18n: { ...p.titleI18n, [langMode]: value } }))
                        }} />
                        <input className='admin-input' placeholder='Lesson desc i18n' value={(lessonDraft.descriptionI18n[langMode] || '') as string} onChange={(e) => {
                          const value = e.target.value
                          if (langMode === 'vi') autoTranslateLesson('lessonDesc', value)
                          else setLessonDraft((p) => ({ ...p, descriptionI18n: { ...p.descriptionI18n, [langMode]: value } }))
                        }} />
                      </div>
                    </div>

                    {lessonDraft.modules.map((m, mi) => (
                      <div className='admin-card admin-field-full' key={`m-${mi}`}>
                        <div className='admin-row' style={{ justifyContent: 'space-between' }}>
                          <strong>Module #{mi + 1}</strong>
                          <button className='admin-btn admin-btn-danger' type='button' onClick={() => removeModule(mi)}><i className='fa-solid fa-trash' /></button>
                        </div>
                        <div className='admin-form-grid'>
                          <label className='admin-field'><span className='admin-label'>Tiêu đề module</span><input className='admin-input' value={m.title || ''} onChange={(e) => updateModule(mi, { title: e.target.value })} /></label>
                          <label className='admin-field'><span className='admin-label'>Mô tả module</span><input className='admin-input' value={m.description || ''} onChange={(e) => updateModule(mi, { description: e.target.value })} /></label>
                          <div className='admin-field admin-field-full'>
                            <span className='admin-label'>Module i18n ({langMode})</span>
                            <div className='admin-row'>
                              <input className='admin-input' placeholder='Module title i18n' value={(m.titleI18n?.[langMode] || '') as string} onChange={(e) => {
                                const value = e.target.value
                                if (langMode === 'vi') autoTranslateLesson('moduleTitle', value, mi)
                                else updateModule(mi, { titleI18n: { ...m.titleI18n, [langMode]: value } })
                              }} />
                              <input className='admin-input' placeholder='Module desc i18n' value={(m.descriptionI18n?.[langMode] || '') as string} onChange={(e) => {
                                const value = e.target.value
                                if (langMode === 'vi') autoTranslateLesson('moduleDesc', value, mi)
                                else updateModule(mi, { descriptionI18n: { ...m.descriptionI18n, [langMode]: value } })
                              }} />
                            </div>
                          </div>

                          {m.videos.map((v, vi) => (
                            <div className='admin-card admin-field-full' key={`v-${mi}-${vi}`}>
                              <div className='admin-row' style={{ justifyContent: 'space-between' }}>
                                <strong>Video #{vi + 1}</strong>
                                <button className='admin-btn admin-btn-danger' type='button' onClick={() => removeVideo(mi, vi)}><i className='fa-solid fa-trash' /></button>
                              </div>
                              <div className='admin-row'>
                                <input className='admin-input' placeholder='Tiêu đề video' value={v.title || ''} onChange={(e) => updateVideo(mi, vi, { title: e.target.value })} />
                                <input className='admin-input' placeholder='Mô tả video' value={v.description || ''} onChange={(e) => updateVideo(mi, vi, { description: e.target.value })} />
                                <input type='number' className='admin-input' placeholder='Duration sec' value={v.durationSec || 0} onChange={(e) => updateVideo(mi, vi, { durationSec: Number(e.target.value) })} />
                              </div>
                              <div className='admin-row'>
                                <input className='admin-input' placeholder='Video title i18n' value={(v.titleI18n?.[langMode] || '') as string} onChange={(e) => {
                                  const value = e.target.value
                                  if (langMode === 'vi') autoTranslateLesson('videoTitle', value, mi, vi)
                                  else updateVideo(mi, vi, { titleI18n: { ...v.titleI18n, [langMode]: value } })
                                }} />
                                <input className='admin-input' placeholder='Video desc i18n' value={(v.descriptionI18n?.[langMode] || '') as string} onChange={(e) => {
                                  const value = e.target.value
                                  if (langMode === 'vi') autoTranslateLesson('videoDesc', value, mi, vi)
                                  else updateVideo(mi, vi, { descriptionI18n: { ...v.descriptionI18n, [langMode]: value } })
                                }} />
                              </div>
                              <div className='admin-row'>
                                <label className='admin-btn admin-btn-ghost' style={{ cursor: 'pointer' }}>
                                  <i className='fa-solid fa-upload' /> {uploadingFor === `${editingLessonId}-${m.id}` ? 'Đang xử lý...' : 'Upload video -> HLS'}
                                  <input type='file' accept='video/*' style={{ display: 'none' }} onChange={(e) => void uploadVideo(editingLessonId || 0, m.id, e.target.files?.[0])} />
                                </label>
                              </div>
                            </div>
                          ))}

                          <button className='admin-btn admin-btn-ghost' type='button' onClick={() => addVideo(mi)}><i className='fa-solid fa-plus' /> Thêm video</button>
                        </div>
                      </div>
                    ))}

                    <div className='admin-row'>
                      <button className='admin-btn admin-btn-ghost' type='button' onClick={addModule}><i className='fa-solid fa-plus' /> Thêm module</button>
                      <button className='admin-btn admin-btn-save' type='button' onClick={() => void saveLesson()}><i className='fa-solid fa-floppy-disk' /> {editingLessonId ? 'Cập nhật bài học' : 'Tạo bài học'}</button>
                    </div>
                  </div>
                </article>
              </section>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
