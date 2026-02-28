import { useEffect, useState } from 'react'
import {
  adminCoursesApi,
  type CourseDetailAdmin,
  type LessonDetailAdmin,
  type CourseTopic,
  type LessonOutlineAdmin,
} from '../../../../api/adminCourses.api'
import { CourseDetailInfoTab } from './CourseDetailInfoTab'
import { CreateLessonModal } from './CreateLessonModal'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  text: Record<string, string>
  topics: CourseTopic[]
  onCourseUpdated: () => Promise<void> | void
}

type DetailTabKey = 'info' | 'lessons'

const labels = {
  vi: {
    info: 'Thông tin khóa học',
    lessons: 'Danh sách bài học',
    add: 'Thêm bài học mới',
    noData: 'Chưa có bài học nào.',
  },
  en: {
    info: 'Course Information',
    lessons: 'Lesson list',
    add: 'Add new lesson',
    noData: 'No lessons yet.',
  },
  de: {
    info: 'Kursinformationen',
    lessons: 'Lektionsliste',
    add: 'Neue Lektion',
    noData: 'Noch keine Lektionen.',
  },
} as const

export function CourseDetailTabs({ course, lang, text, topics, onCourseUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('info')
  const [lessons, setLessons] = useState<LessonOutlineAdmin[]>([])
  const [lessonDetails, setLessonDetails] = useState<Record<number, LessonDetailAdmin>>({})
  const [loadingDetailIds, setLoadingDetailIds] = useState<Record<number, boolean>>({})
  const [openCreateLesson, setOpenCreateLesson] = useState(false)

  const t = labels[lang]

  const loadLessons = async () => {
    const data = await adminCoursesApi.listCourseLessons(course.id, lang)
    setLessons(data)
    setLessonDetails({})
    setLoadingDetailIds({})
  }

  const getLocalizedText = <T extends { title?: string; description?: string; translations?: Record<string, { title?: string; description?: string }> }>(item: T) => {
    const localeText = item.translations?.[lang]
    return {
      title: localeText?.title || item.title || '--',
      description: localeText?.description || item.description || '--',
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
      const detail = await adminCoursesApi.getLessonDetail(lessonId)
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

      {activeTab === 'info' && <CourseDetailInfoTab course={course} text={text} lang={lang} topics={topics} onUpdated={onCourseUpdated} />}

      {activeTab === 'lessons' && (
        <div className='admin-card'>
          <div className='admin-row' style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}><i className='fa-solid fa-list' /> {t.lessons}</h4>
            <button className='admin-btn admin-btn-save' type='button' onClick={() => setOpenCreateLesson(true)}>
              <i className='fa-solid fa-circle-plus' /> {t.add}
            </button>
          </div>

          {!lessons.length && <p className='admin-helper'>{t.noData}</p>}
          {!!lessons.length && (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {lessons.map((lesson) => (
                <li key={lesson.id} style={{ marginBottom: 10 }}>
                  <details className='admin-card' onToggle={(e) => {
                    const target = e.currentTarget
                    if (target.open) {
                      void loadLessonDetail(lesson.id)
                    }
                  }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                      {lesson.localizedTitle || lesson.title}
                    </summary>

                    <div style={{ marginTop: 8 }}>
                      <div className='admin-helper'>{lesson.localizedDescription || lesson.description || '--'}</div>

                      {loadingDetailIds[lesson.id] && <div className='admin-helper'>Loading...</div>}

                      {!loadingDetailIds[lesson.id] && lessonDetails[lesson.id]?.modules?.map((module) => {
                        const moduleText = getLocalizedText(module)
                        return (
                          <div key={module.id} style={{ marginTop: 12, border: '1px solid #23335f', borderRadius: 12, padding: 12 }}>
                            <div style={{ fontWeight: 700 }}>{moduleText.title}</div>
                            <div className='admin-helper' style={{ marginBottom: 8 }}>{moduleText.description}</div>

                            <div style={{ display: 'grid', gap: 10 }}>
                              {module.videos.map((media) => {
                                const mediaText = getLocalizedText(media)
                                const mediaUrl = resolveMediaUrl(media.playbackUrl || media.sourceUrl || media.hlsPlaylistKey || '')
                                const isImage = media.mediaType === 'IMAGE'
                                return (
                                  <div key={media.id} style={{ border: '1px solid #1d2a52', borderRadius: 10, padding: 10 }}>
                                    <strong style={{ display: 'block' }}>{mediaText.title}</strong>
                                    <div className='admin-helper' style={{ marginBottom: 6 }}>{mediaText.description}</div>
                                    {mediaUrl ? (
                                      <>
                                        {isImage ? (
                                          <img src={mediaUrl} alt={mediaText.title} style={{ width: '100%', maxWidth: 360, borderRadius: 8, marginTop: 6 }} />
                                        ) : (
                                          <video src={mediaUrl} controls style={{ width: '100%', maxWidth: 360, marginTop: 6 }} />
                                        )}
                                      </>
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
        open={openCreateLesson}
        lang={lang}
        courseId={course.id}
        onClose={() => setOpenCreateLesson(false)}
        onCreated={async () => {
          await loadLessons()
          await onCourseUpdated()
        }}
      />
    </section>
  )
}
