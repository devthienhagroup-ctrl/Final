import { useState } from 'react'
import { type CourseAdmin, type CourseTopic } from '../../../api/adminCourses.api'
import { CreateCourseModal } from './CreateCourseModal'

type Props = {
  courses: CourseAdmin[]
  topics: CourseTopic[]
  text: Record<string, string>
  lang: 'vi' | 'en' | 'de'
  selectedTopicId: number | 'all'
  searchTerm: string
  page: number
  totalPages: number
  totalItems: number
  onChangeFilters: (patch: { selectedTopicId?: number | 'all'; searchTerm?: string }) => void
  onChangePage: (page: number) => void
  onCourseCreated: () => Promise<void> | void
}

export function CoursesTab({ courses, topics, text, lang, selectedTopicId, searchTerm, page, totalPages, totalItems, onChangeFilters, onChangePage, onCourseCreated }: Props) {
  const [openCreateModal, setOpenCreateModal] = useState(false)

  const displayTopicName = (topic: CourseTopic) => {
    if (lang === 'de') return topic.translations?.de?.name || topic.name
    if (lang === 'en') return topic.translations?.['en']?.name || topic.name
    return topic.translations?.vi?.name || topic.name
  }

  return (
    <section className='admin-card admin-card-glow admin-course-management-card'>
      <div className='admin-row' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className='admin-card-title'><i className='fa-solid fa-graduation-cap' /> {text.coursesTab}</h3>
        <button className='admin-btn admin-btn-save' type='button' onClick={() => setOpenCreateModal(true)}>
          <i className='fa-solid fa-circle-plus' /> {lang === 'vi' ? 'Thêm khóa học mới' : lang === 'en' ? 'Add new course' : 'Neuen Kurs hinzufügen'}
        </button>
      </div>

      <div className='admin-row' style={{ gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <label className='admin-field' style={{ marginBottom: 0, minWidth: 220 }}>
          <span className='admin-label'>{text.filterByTopic}</span>
          <select
            className='admin-input'
            value={selectedTopicId === 'all' ? 'all' : String(selectedTopicId)}
            onChange={(e) => {
              onChangeFilters({ selectedTopicId: e.target.value === 'all' ? 'all' : Number(e.target.value) })
            }}
          >
            <option value='all'>{text.allTopics}</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>{displayTopicName(topic)}</option>
            ))}
          </select>
        </label>

        <label className='admin-field' style={{ marginBottom: 0, minWidth: 280 }}>
          <span className='admin-label'>{text.searchByCourseName}</span>
          <input
            className='admin-input'
            value={searchTerm}
            placeholder={text.searchPlaceholder}
            onChange={(e) => {
              onChangeFilters({ searchTerm: e.target.value })
            }}
          />
        </label>
      </div>

      <div className='admin-table-wrap'>
        <table className='admin-table admin-table-courses-full no-scroll-table'>
          <thead>
            <tr>
              <th>ID</th><th>{text.titleCol}</th><th>{text.topicCol}</th><th>{text.priceCol}</th><th>{text.ratingCol}</th><th>{text.enrollmentCol}</th><th>{text.lessonCol}</th><th>{text.videoCountCol}</th><th>{text.createdAtCol}</th><th>{text.updatedAtCol}</th><th>{text.statusCol}</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td className='td-strong'>{c.title}</td>
                <td>{c.topic ? displayTopicName(c.topic as CourseTopic) : text.unassigned}</td>
                <td>{(c.price || 0).toLocaleString('vi-VN')}đ</td>
                <td>{c.ratingAvg ?? 0} ({c.ratingCount ?? 0})</td>
                <td>{c.enrollmentCount ?? 0}</td>
                <td>{c._count?.lessons ?? 0}</td>
                <td>{c.videoCount ?? 0}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : '--'}</td>
                <td>{c.updatedAt ? new Date(c.updatedAt).toLocaleString('vi-VN') : '--'}</td>
                <td><span className={`status-pill ${c.published ? 'is-published' : 'is-draft'}`}>{c.published ? text.publishedStatus : text.draftStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='admin-row' style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <span>{text.pageLabel} {Math.min(page, totalPages)} / {totalPages} • {text.totalCoursesLabel} {totalItems}</span>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-ghost' type='button' disabled={page <= 1} onClick={() => onChangePage(Math.max(1, page - 1))}>{text.prevPage}</button>
          <button className='admin-btn admin-btn-ghost' type='button' disabled={page >= totalPages} onClick={() => onChangePage(Math.min(totalPages, page + 1))}>{text.nextPage}</button>
        </div>
      </div>

      <CreateCourseModal open={openCreateModal} lang={lang} topics={topics} onClose={() => setOpenCreateModal(false)} onCreated={onCourseCreated} />
    </section>
  )
}
