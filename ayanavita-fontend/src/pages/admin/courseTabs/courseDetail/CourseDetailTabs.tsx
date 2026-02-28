import { useMemo, useState } from 'react'
import { type CourseDetailAdmin, type CourseTopic } from '../../../../api/adminCourses.api'
import { CourseDetailInfoTab } from './CourseDetailInfoTab'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  text: Record<string, string>
  topics: CourseTopic[]
  onCourseUpdated: () => Promise<void> | void
}

type DetailTabKey = 'info' | 'content'

export function CourseDetailTabs({ course, lang, text, topics, onCourseUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('info')

  const localizedContent = useMemo(() => ({
    objectives: course.objectives || [],
    targetAudience: course.targetAudience || [],
    benefits: course.benefits || [],
  }), [course])

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
        <button className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`} type='button' onClick={() => setActiveTab('content')}>
          <i className='fa-solid fa-list-check' /> {lang === 'vi' ? 'Nội dung mở rộng' : lang === 'en' ? 'Extended content' : 'Erweiterte Inhalte'}
        </button>
      </div>

      {activeTab === 'info' && <CourseDetailInfoTab course={course} text={text} lang={lang} topics={topics} onUpdated={onCourseUpdated} />}

      {activeTab === 'content' && (
        <div className='admin-row' style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div className='admin-card' style={{ flex: 1, minWidth: 240 }}>
            <h4>Objectives</h4>
            <ul>
              {localizedContent.objectives.length ? localizedContent.objectives.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>) : <li>--</li>}
            </ul>
          </div>
          <div className='admin-card' style={{ flex: 1, minWidth: 240 }}>
            <h4>Target audience</h4>
            <ul>
              {localizedContent.targetAudience.length ? localizedContent.targetAudience.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>) : <li>--</li>}
            </ul>
          </div>
          <div className='admin-card' style={{ flex: 1, minWidth: 240 }}>
            <h4>Benefits</h4>
            <ul>
              {localizedContent.benefits.length ? localizedContent.benefits.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>) : <li>--</li>}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
