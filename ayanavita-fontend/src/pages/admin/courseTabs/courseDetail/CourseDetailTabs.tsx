import { useEffect, useState } from 'react'
import {
  adminCoursesApi,
  type CourseDetailAdmin,
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
  const [openCreateLesson, setOpenCreateLesson] = useState(false)

  const t = labels[lang]

  const loadLessons = async () => {
    const data = await adminCoursesApi.listCourseLessons(course.id, lang)
    setLessons(data)
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
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {lessons.map((lesson) => (
                <li key={lesson.id} style={{ marginBottom: 8 }}>
                  <strong>{lesson.localizedTitle || lesson.title}</strong>
                  <div className='admin-helper'>{lesson.localizedDescription || lesson.description || '--'}</div>
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
