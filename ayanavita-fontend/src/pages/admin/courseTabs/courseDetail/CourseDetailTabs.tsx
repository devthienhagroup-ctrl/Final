import { useMemo, useState } from 'react'
import { type CourseDetailAdmin, type CourseTopic } from '../../../../api/adminCourses.api'
import { CourseDetailInfoTab } from './CourseDetailInfoTab'
import { CourseLessonListTab } from './CourseLessonListTab'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  text: Record<string, string>
  topics: CourseTopic[]
  onCourseUpdated: () => Promise<void> | void
}

type DetailTabKey = 'info' | 'lessons'

export function CourseDetailTabs({ course, lang, text, topics, onCourseUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('info')

  const lessonTabLabel = useMemo(() => (lang === 'vi' ? 'Danh sách bài học' : lang === 'en' ? 'Lesson list' : 'Lektionsliste'), [lang])

  return (
    <section>
      <div className='admin-tabs' style={{ marginBottom: 10 }}>
        <button className={`admin-tab ${activeTab === 'info' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('info')}>
          <i className='fa-solid fa-circle-info' />{' '}
          {lang === 'vi'
              ? 'Thông tin khóa học'
              : lang === 'en'
                  ? 'Course Information'
                  : 'Kursinformationen'}
        </button>
        <button className={`admin-tab ${activeTab === 'lessons' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('lessons')}>
          <i className='fa-solid fa-list-check' /> {lessonTabLabel}
        </button>
      </div>

      {activeTab === 'info' && <CourseDetailInfoTab course={course} text={text} lang={lang} topics={topics} onUpdated={onCourseUpdated} />}

      {activeTab === 'lessons' && <CourseLessonListTab course={course} lang={lang} onUpdated={onCourseUpdated} />}
    </section>
  )
}
