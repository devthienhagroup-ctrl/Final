import { useEffect, useMemo, useState } from 'react'
import {
  adminCoursesApi,
  type CourseDetailAdmin,
  type LessonDetailAdmin,
  type CourseTopic,
  type LessonOutlineAdmin,
  type LessonI18n,
} from '../../../../api/adminCourses.api'
import { CourseDetailInfoTab } from './CourseDetailInfoTab'
import { CreateLessonModal } from './CreateLessonModal'
import { AlertJs } from '../../../../utils/alertJs'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  text: Record<string, string>
  topics: CourseTopic[]
  onCourseUpdated: () => Promise<void> | void
  onCourseDeleted: () => Promise<void> | void
}

type DetailTabKey = 'info' | 'lessons'

const labels = {
  vi: {
    info: 'Thông tin khóa học',
    lessons: 'Danh sách bài học',
    add: 'Thêm bài học mới',
    edit: 'Sửa bài học',
    deleteLesson: 'Xóa bài học',
    deleteCourse: 'Xóa khóa học',
    noData: 'Chưa có bài học nào.',
    loading: 'Đang tải...',
    lessonOrder: 'Thứ tự bài',
    moduleOrder: 'Thứ tự module',
    mediaOrder: 'Thứ tự media',
    confirmDeleteLesson: 'Bạn có chắc muốn xóa bài học này?',
    confirmDeleteCourse: 'Bạn có chắc muốn xóa khóa học này?',
    lessonDeleted: 'Đã xóa bài học.',
    courseDeleted: 'Đã xóa khóa học.',
  },
  en: {
    info: 'Course Information',
    lessons: 'Lesson list',
    add: 'Add new lesson',
    edit: 'Edit lesson',
    deleteLesson: 'Delete lesson',
    deleteCourse: 'Delete course',
    noData: 'No lessons yet.',
    loading: 'Loading...',
    lessonOrder: 'Lesson order',
    moduleOrder: 'Module order',
    mediaOrder: 'Media order',
    confirmDeleteLesson: 'Are you sure you want to delete this lesson?',
    confirmDeleteCourse: 'Are you sure you want to delete this course?',
    lessonDeleted: 'Lesson deleted.',
    courseDeleted: 'Course deleted.',
  },
  de: {
    info: 'Kursinformationen',
    lessons: 'Lektionsliste',
    add: 'Neue Lektion',
    edit: 'Lektion bearbeiten',
    deleteLesson: 'Lektion löschen',
    deleteCourse: 'Kurs löschen',
    noData: 'Noch keine Lektionen.',
    loading: 'Wird geladen...',
    lessonOrder: 'Reihenfolge Lektion',
    moduleOrder: 'Reihenfolge Modul',
    mediaOrder: 'Reihenfolge Medien',
    confirmDeleteLesson: 'Möchten Sie diese Lektion wirklich löschen?',
    confirmDeleteCourse: 'Möchten Sie diesen Kurs wirklich löschen?',
    lessonDeleted: 'Lektion gelöscht.',
    courseDeleted: 'Kurs gelöscht.',
  },
} as const

const normalizeTranslations = (translations?: LessonI18n) => {
  if (!translations) return {}
  if (Array.isArray(translations)) {
    return translations.reduce<Record<string, { title?: string; description?: string }>>((acc, item) => {
      acc[item.locale] = { title: item.title, description: item.description }
      return acc
    }, {})
  }
  return translations
}

export function CourseDetailTabs({ course, lang, text, topics, onCourseUpdated, onCourseDeleted }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('info')
  const [lessons, setLessons] = useState<LessonOutlineAdmin[]>([])
  const [lessonDetails, setLessonDetails] = useState<Record<number, LessonDetailAdmin>>({})
  const [loadingDetailIds, setLoadingDetailIds] = useState<Record<number, boolean>>({})
  const [openLessonModal, setOpenLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonDetailAdmin | null>(null)

  const t = labels[lang]

  const loadLessons = async () => {
    const data = await adminCoursesApi.listCourseLessons(course.id, lang)
    setLessons(data)
    setLessonDetails({})
    setLoadingDetailIds({})
  }

  const getLocalizedText = <T extends { title?: string; description?: string; translations?: LessonI18n; localizedTitle?: string; localizedDescription?: string }>(item: T) => {
    const map = normalizeTranslations(item.translations)
    const localeText = map[lang]
    return {
      title: item.localizedTitle || localeText?.title || item.title || '--',
      description: item.localizedDescription || localeText?.description || item.description || '--',
    }
  }

  const resolveMediaUrl = (value?: string) => {
    const raw = (value || '').trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return ''
  }

  const loadLessonDetail = async (lessonId: number) => {
    if (lessonDetails[lessonId] || loadingDetailIds[lessonId]) return
    setLoadingDetailIds((prev) => ({ ...prev, [lessonId]: true }))
    try {
      const detail = await adminCoursesApi.getLessonDetail(lessonId, lang)
      setLessonDetails((prev) => ({ ...prev, [lessonId]: detail }))
    } finally {
      setLoadingDetailIds((prev) => ({ ...prev, [lessonId]: false }))
    }
  }

  useEffect(() => {
    if (activeTab === 'lessons') {
      void loadLessons()
    }
  }, [activeTab, lang, course.id])

  const sortedLessons = useMemo(() => [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id), [lessons])

  return (
    <section>
      <div className='admin-tabs' style={{ marginBottom: 10 }}>
        <button className={`admin-tab ${activeTab === 'info' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('info')}>
          <i className='fa-solid fa-circle-info' /> {t.info}
        </button>
        <button className={`admin-tab ${activeTab === 'lessons' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('lessons')}>
          <i className='fa-solid fa-list-check' /> {t.lessons}
        </button>
      </div>

      {activeTab === 'info' && <CourseDetailInfoTab course={course} text={text} lang={lang} topics={topics} onUpdated={onCourseUpdated} onDeleted={onCourseDeleted} />}

      {activeTab === 'lessons' && (
        <div className='admin-card'>
          <div className='admin-row' style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}><i className='fa-solid fa-list' /> {t.lessons}</h4>
            <div className='admin-row' style={{ gap: 8 }}>
              <button className='admin-btn admin-btn-save' type='button' onClick={() => {
                setEditingLesson(null)
                setOpenLessonModal(true)
              }}>
                <i className='fa-solid fa-circle-plus' /> {t.add}
              </button>
            </div>
          </div>

          {!sortedLessons.length && <p className='admin-helper'>{t.noData}</p>}
          {!!sortedLessons.length && (
            <ul className='lesson-outline-list'>
              {sortedLessons.map((lesson) => (
                <li key={lesson.id} className='lesson-outline-item'>
                  <details className='lesson-outline-card' onToggle={(e) => {
                    const target = e.currentTarget
                    if (target.open) {
                      void loadLessonDetail(lesson.id)
                    }
                  }}>
                    <summary className='lesson-outline-summary'>
                      <div>
                        <div className='lesson-outline-title'>{lesson.localizedTitle || lesson.title}</div>
                        <div className='admin-helper'>{t.lessonOrder}: {lesson.order ?? 0}</div>
                      </div>
                      <div className='admin-row' style={{ gap: 8 }}>
                        <i className='fa-solid fa-chevron-down lesson-outline-chevron' aria-hidden='true' />
                        <button type='button' className='admin-btn admin-btn-ghost' onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const detail = lessonDetails[lesson.id] ?? await adminCoursesApi.getLessonDetail(lesson.id, lang)
                          setEditingLesson(detail)
                          setOpenLessonModal(true)
                        }}>
                          <i className='fa-solid fa-pen' /> {t.edit}
                        </button>
                        <button type='button' className='admin-btn admin-btn-danger' onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const confirmed = await AlertJs.confirm(t.confirmDeleteLesson)
                          if (!confirmed) return
                          await adminCoursesApi.deleteLesson(lesson.id)
                          await AlertJs.success(t.lessonDeleted)
                          await loadLessons()
                          await onCourseUpdated()
                        }}>
                          <i className='fa-solid fa-trash' /> {t.deleteLesson}
                        </button>
                      </div>
                    </summary>

                    <div>
                      <div className='admin-helper'>{lesson.localizedDescription || lesson.description || '--'}</div>

                      {loadingDetailIds[lesson.id] && <div className='admin-helper'>{t.loading}</div>}

                      {!loadingDetailIds[lesson.id] && lessonDetails[lesson.id]?.modules?.map((module) => {
                        const moduleText = getLocalizedText(module)
                        const moduleVideos = [...module.videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)
                        return (
                          <div key={module.id} className='lesson-module-card'>
                            <div style={{ fontWeight: 700 }}>{moduleText.title}</div>
                            <div className='admin-helper'>{t.moduleOrder}: {module.order ?? 0}</div>
                            <div className='admin-helper' style={{ marginBottom: 8 }}>{moduleText.description}</div>

                            <div className='lesson-media-grid'>
                              {moduleVideos.map((media) => {
                                const mediaText = getLocalizedText(media)
                                const mediaUrl = resolveMediaUrl(media.playbackUrl || media.sourceUrl || media.hlsPlaylistKey || '')
                                const isImage = media.mediaType === 'IMAGE'
                                return (
                                  <div key={media.id} className='lesson-media-card'>
                                    <strong style={{ display: 'block' }}>{mediaText.title}</strong>
                                    <div className='admin-helper'>{t.mediaOrder}: {media.order ?? 0}</div>
                                    <div className='admin-helper' style={{ marginBottom: 6 }}>{mediaText.description}</div>
                                    {mediaUrl ? (
                                      isImage ? (
                                        <img src={mediaUrl} alt={mediaText.title} style={{ width: '100%', maxWidth: 360, borderRadius: 8, marginTop: 6 }} />
                                      ) : (
                                        <video src={mediaUrl} controls style={{ width: '100%', maxWidth: 360, marginTop: 6 }} />
                                      )
                                    ) : (
                                      <div className='admin-helper'>--</div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <CreateLessonModal
        open={openLessonModal}
        lang={lang}
        courseId={course.id}
        editingLesson={editingLesson}
        onClose={() => {
          setOpenLessonModal(false)
          setEditingLesson(null)
        }}
        onSaved={async () => {
          await loadLessons()
          await onCourseUpdated()
        }}
      />
    </section>
  )
}
