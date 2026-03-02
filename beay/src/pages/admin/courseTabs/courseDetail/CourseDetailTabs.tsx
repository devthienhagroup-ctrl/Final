import { useEffect, useMemo, useState } from 'react'
import {
  adminCoursesApi,
  type CourseDetailAdmin,
  type CourseManagementApi,
  type CourseReviewAdmin,
  type CourseStudentAdmin,
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
  coursesApi?: CourseManagementApi
}

type DetailTabKey = 'info' | 'lessons' | 'reviews' | 'students'

const labels = {
  vi: {
    info: 'Thông tin khóa học',
    lessons: 'Danh sách bài học',
    reviews: 'Đánh giá',
    students: 'Học viên',
    add: 'Thêm bài học mới',
    edit: 'Sửa bài học',
    deleteLesson: 'Xóa bài học',
    deleteReview: 'Xóa đánh giá',
    noData: 'Chưa có dữ liệu.',
    loading: 'Đang tải...',
    lessonOrder: 'Thứ tự bài',
    moduleOrder: 'Thứ tự module',
    mediaOrder: 'Thứ tự media',
    confirmDeleteLesson: 'Bạn có chắc muốn xóa bài học này?',
    confirmDeleteReview: 'Bạn có chắc muốn xóa đánh giá này?',
    lessonDeleted: 'Đã xóa bài học.',
    reviewDeleted: 'Đã xóa đánh giá.',
    ratingFilter: 'Lọc theo số sao',
    allStars: 'Tất cả sao',
    stars: 'Số sao',
    content: 'Nội dung',
    reviewer: 'Người đánh giá',
    email: 'Email',
    phone: 'Số điện thoại',
    progress: 'Tiến độ',
    studentName: 'Tên học viên',
    prev: 'Trước',
    next: 'Sau',
    page: 'Trang',
  },
  en: {
    info: 'Course Information',
    lessons: 'Lesson list',
    reviews: 'Reviews',
    students: 'Students',
    add: 'Add new lesson',
    edit: 'Edit lesson',
    deleteLesson: 'Delete lesson',
    deleteReview: 'Delete review',
    noData: 'No data yet.',
    loading: 'Loading...',
    lessonOrder: 'Lesson order',
    moduleOrder: 'Module order',
    mediaOrder: 'Media order',
    confirmDeleteLesson: 'Are you sure you want to delete this lesson?',
    confirmDeleteReview: 'Are you sure you want to delete this review?',
    lessonDeleted: 'Lesson deleted.',
    reviewDeleted: 'Review deleted.',
    ratingFilter: 'Filter by stars',
    allStars: 'All stars',
    stars: 'Stars',
    content: 'Content',
    reviewer: 'Reviewer',
    email: 'Email',
    phone: 'Phone',
    progress: 'Progress',
    studentName: 'Student name',
    prev: 'Prev',
    next: 'Next',
    page: 'Page',
  },
  de: {
    info: 'Kursinformationen',
    lessons: 'Lektionsliste',
    reviews: 'Bewertungen',
    students: 'Lernende',
    add: 'Neue Lektion',
    edit: 'Lektion bearbeiten',
    deleteLesson: 'Lektion löschen',
    deleteReview: 'Bewertung löschen',
    noData: 'Noch keine Daten.',
    loading: 'Wird geladen...',
    lessonOrder: 'Reihenfolge Lektion',
    moduleOrder: 'Reihenfolge Modul',
    mediaOrder: 'Reihenfolge Medien',
    confirmDeleteLesson: 'Möchten Sie diese Lektion wirklich löschen?',
    confirmDeleteReview: 'Möchten Sie diese Bewertung wirklich löschen?',
    lessonDeleted: 'Lektion gelöscht.',
    reviewDeleted: 'Bewertung gelöscht.',
    ratingFilter: 'Nach Sternen filtern',
    allStars: 'Alle Sterne',
    stars: 'Sterne',
    content: 'Inhalt',
    reviewer: 'Bewerter',
    email: 'E-Mail',
    phone: 'Telefon',
    progress: 'Fortschritt',
    studentName: 'Name Lernender',
    prev: 'Zurück',
    next: 'Weiter',
    page: 'Seite',
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

export function CourseDetailTabs({ course, lang, text, topics, onCourseUpdated, onCourseDeleted, coursesApi = adminCoursesApi }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('info')
  const [lessons, setLessons] = useState<LessonOutlineAdmin[]>([])
  const [lessonDetails, setLessonDetails] = useState<Record<number, LessonDetailAdmin>>({})
  const [loadingDetailIds, setLoadingDetailIds] = useState<Record<number, boolean>>({})
  const [openLessonModal, setOpenLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonDetailAdmin | null>(null)

  const [reviews, setReviews] = useState<CourseReviewAdmin[]>([])
  const [students, setStudents] = useState<CourseStudentAdmin[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [starFilter, setStarFilter] = useState<'all' | number>('all')
  const [reviewPage, setReviewPage] = useState(1)
  const [studentPage, setStudentPage] = useState(1)

  const pageSize = 5
  const t = labels[lang]

  const loadLessons = async () => {
    const data = await coursesApi.listCourseLessons(course.id, lang)
    setLessons(data)
    setLessonDetails({})
    setLoadingDetailIds({})
  }

  const loadReviews = async () => {
    setLoadingReviews(true)
    try {
      const data = await coursesApi.listCourseReviews(course.id)
      setReviews(Array.isArray(data) ? data : [])
    } catch {
      setReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }

  const loadStudents = async () => {
    setLoadingStudents(true)
    try {
      const data = await coursesApi.listCourseStudents(course.id)
      setStudents(Array.isArray(data) ? data : [])
    } catch {
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
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
      const detail = await coursesApi.getLessonDetail(lessonId, lang)
      setLessonDetails((prev) => ({ ...prev, [lessonId]: detail }))
    } finally {
      setLoadingDetailIds((prev) => ({ ...prev, [lessonId]: false }))
    }
  }

  useEffect(() => {
    if (activeTab === 'lessons') void loadLessons()
    if (activeTab === 'reviews') void loadReviews()
    if (activeTab === 'students') void loadStudents()
  }, [activeTab, lang, course.id])

  const sortedLessons = useMemo(() => [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id), [lessons])
  const filteredReviews = useMemo(
    () => reviews.filter((item) => (starFilter === 'all' ? true : Number(item.stars) === Number(starFilter))),
    [reviews, starFilter],
  )

  const reviewTotalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize))
  const studentTotalPages = Math.max(1, Math.ceil(students.length / pageSize))

  const reviewRows = useMemo(
    () => filteredReviews.slice((reviewPage - 1) * pageSize, reviewPage * pageSize),
    [filteredReviews, reviewPage],
  )
  const studentRows = useMemo(
    () => students.slice((studentPage - 1) * pageSize, studentPage * pageSize),
    [students, studentPage],
  )

  return (
    <section>
      <div className='admin-tabs' style={{ marginBottom: 10 }}>
        <button className={`admin-tab ${activeTab === 'info' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('info')}>
          <i className='fa-solid fa-circle-info' /> {t.info}
        </button>
        <button className={`admin-tab ${activeTab === 'lessons' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('lessons')}>
          <i className='fa-solid fa-list-check' /> {t.lessons}
        </button>
        <button className={`admin-tab ${activeTab === 'reviews' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('reviews')}>
          <i className='fa-solid fa-star' /> {t.reviews}
        </button>
        <button className={`admin-tab ${activeTab === 'students' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('students')}>
          <i className='fa-solid fa-users' /> {t.students}
        </button>
      </div>

      {activeTab === 'info' && <CourseDetailInfoTab course={course} text={text} lang={lang} topics={topics} onUpdated={onCourseUpdated} onDeleted={onCourseDeleted} coursesApi={coursesApi} />}

      {activeTab === 'lessons' && (
        <div className='admin-card' style={{ border: '1px dashed rgba(148, 163, 184, 0.5)' }}>
          <div className='admin-row' style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <h4 className='admin-card-title' style={{ marginBottom: 0 }}><i className='fa-solid fa-list-check' /> {t.lessons}</h4>
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
                    if (e.currentTarget.open) void loadLessonDetail(lesson.id)
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
                          const detail = lessonDetails[lesson.id] ?? await coursesApi.getLessonDetail(lesson.id, lang)
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
                          await coursesApi.deleteLesson(lesson.id)
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
                                      isImage ? <img src={mediaUrl} alt={mediaText.title} style={{ width: '100%', maxWidth: 360, borderRadius: 8, marginTop: 6 }} /> : <video src={mediaUrl} controls style={{ width: '100%', maxWidth: 360, marginTop: 6 }} />
                                    ) : <div className='admin-helper'>--</div>}
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

      {activeTab === 'reviews' && (
        <div>
          <div className='admin-row' style={{ marginBottom: 12, justifyContent: 'space-between' }}>
            <label className='admin-field' style={{ marginBottom: 0, minWidth: 220 }}>
              <span className='admin-label'>{t.ratingFilter}</span>
              <select className='admin-input' value={String(starFilter)} onChange={(e) => {
                setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                setReviewPage(1)
              }}>
                <option value='all'>{t.allStars}</option>
                {[5, 4, 3, 2, 1].map((star) => <option key={star} value={star}>{star} ★</option>)}
              </select>
            </label>
          </div>
          {loadingReviews && <p className='admin-helper'>{t.loading}</p>}
          {!loadingReviews && (
            <div className='admin-table-wrap'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>{t.stars}</th><th>{t.content}</th><th>{t.reviewer}</th><th>{t.email}</th><th>{t.phone}</th><th>{text.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {!reviewRows.length && <tr><td colSpan={6}>{t.noData}</td></tr>}
                  {reviewRows.map((item) => (
                    <tr key={item.id}>
                      <td>{item.stars} ★</td>
                      <td>{item.comment || '--'}</td>
                      <td>{item.customerName || item.userName || '--'}</td>
                      <td>{item.email || '--'}</td>
                      <td>{item.phone || '--'}</td>
                      <td>
                        {coursesApi.deleteCourseReview ? (
                          <button type='button' className='admin-btn admin-btn-danger' onClick={async () => {
                            const confirmed = await AlertJs.confirm(t.confirmDeleteReview)
                            if (!confirmed) return
                            await coursesApi.deleteCourseReview?.(course.id, item.id)
                            await AlertJs.success(t.reviewDeleted)
                            await loadReviews()
                          }}>
                            <i className='fa-solid fa-trash' /> {t.deleteReview}
                          </button>
                        ) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className='admin-row' style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <span>{t.page} {Math.min(reviewPage, reviewTotalPages)} / {reviewTotalPages}</span>
            <div className='admin-row'>
              <button className='admin-btn admin-btn-ghost' type='button' disabled={reviewPage <= 1} onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}>{t.prev}</button>
              <button className='admin-btn admin-btn-ghost' type='button' disabled={reviewPage >= reviewTotalPages} onClick={() => setReviewPage((prev) => Math.min(reviewTotalPages, prev + 1))}>{t.next}</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          {loadingStudents && <p className='admin-helper'>{t.loading}</p>}
          {!loadingStudents && (
            <div className='admin-table-wrap'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>{t.studentName}</th><th>{t.email}</th><th>{t.phone}</th><th>{t.progress}</th>
                  </tr>
                </thead>
                <tbody>
                  {!studentRows.length && <tr><td colSpan={4}>{t.noData}</td></tr>}
                  {studentRows.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name || '--'}</td>
                      <td>{item.email || '--'}</td>
                      <td>{item.phone || '--'}</td>
                      <td>{Math.round(Number(item.progressPercent ?? item.progress ?? 0))}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className='admin-row' style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <span>{t.page} {Math.min(studentPage, studentTotalPages)} / {studentTotalPages}</span>
            <div className='admin-row'>
              <button className='admin-btn admin-btn-ghost' type='button' disabled={studentPage <= 1} onClick={() => setStudentPage((prev) => Math.max(1, prev - 1))}>{t.prev}</button>
              <button className='admin-btn admin-btn-ghost' type='button' disabled={studentPage >= studentTotalPages} onClick={() => setStudentPage((prev) => Math.min(studentTotalPages, prev + 1))}>{t.next}</button>
            </div>
          </div>
        </div>
      )}

      <CreateLessonModal
        coursesApi={coursesApi}
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
