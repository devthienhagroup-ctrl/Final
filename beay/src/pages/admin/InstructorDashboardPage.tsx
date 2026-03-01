import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../app/auth'
import { instructorCoursesApi } from '../../api/instructorCourses.api'
import type { CourseAdmin, CourseTopic } from '../../api/adminCourses.api'
import { AlertJs } from '../../utils/alertJs'
import { CoursesTab } from './courseTabs/CoursesTab'
import './AdminSpaPage.css'
import './AdminCoursesPage.css'

type AdminLang = 'vi' | 'en' | 'de'

const text: Record<AdminLang, Record<string, string>> = {
  vi: {
    coursesTab: 'Khóa học của tôi',
    filterByTopic: 'Lọc theo chủ đề', allTopics: 'Tất cả chủ đề', searchByCourseName: 'Tìm theo tên khóa học', searchPlaceholder: 'Nhập tên khóa học...',
    titleCol: 'Tiêu đề', topicCol: 'Chủ đề', creatorCol: 'Người tạo', priceCol: 'Giá', ratingCol: 'Rating', enrollmentCol: 'Đăng ký', lessonCol: 'Bài học', videoCountCol: 'Video', createdAtCol: 'Tạo lúc', updatedAtCol: 'Sửa lúc', statusCol: 'Trạng thái', actions: 'Chi tiết / chỉnh sửa', unassigned: 'Chưa gán', publishedStatus: 'Published', draftStatus: 'Draft', pageLabel: 'Trang', totalCoursesLabel: 'Tổng khóa học', prevPage: 'Trước', nextPage: 'Sau', loading: 'Đang tải...'
  },
  en: { coursesTab: 'My courses', filterByTopic: 'Filter by topic', allTopics: 'All topics', searchByCourseName: 'Search by course name', searchPlaceholder: 'Enter course name...', titleCol: 'Title', topicCol: 'Topic', creatorCol: 'Created by', priceCol: 'Price', ratingCol: 'Rating', enrollmentCol: 'Enrollments', lessonCol: 'Lessons', videoCountCol: 'Videos', createdAtCol: 'Created at', updatedAtCol: 'Updated at', statusCol: 'Status', actions: 'Details / edit', unassigned: 'Unassigned', publishedStatus: 'Published', draftStatus: 'Draft', pageLabel: 'Page', totalCoursesLabel: 'Total courses', prevPage: 'Prev', nextPage: 'Next', loading: 'Loading...' },
  de: { coursesTab: 'Meine Kurse', filterByTopic: 'Nach Thema filtern', allTopics: 'Alle Themen', searchByCourseName: 'Nach Kursname suchen', searchPlaceholder: 'Kursname eingeben...', titleCol: 'Titel', topicCol: 'Thema', creatorCol: 'Ersteller', priceCol: 'Preis', ratingCol: 'Bewertung', enrollmentCol: 'Anmeldungen', lessonCol: 'Lektionen', videoCountCol: 'Videos', createdAtCol: 'Erstellt am', updatedAtCol: 'Aktualisiert am', statusCol: 'Status', actions: 'Details / bearbeiten', unassigned: 'Nicht zugeordnet', publishedStatus: 'Published', draftStatus: 'Draft', pageLabel: 'Seite', totalCoursesLabel: 'Gesamtkurse', prevPage: 'Zurück', nextPage: 'Weiter', loading: 'Wird geladen...' },
}

export function InstructorDashboardPage() {
  const { logout } = useAuth()
  const [lang] = useState<AdminLang>('vi')
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseAdmin[]>([])
  const [topics, setTopics] = useState<CourseTopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const loadData = async () => {
    setLoading(true)
    try {
      const [topicRows, courseRows] = await Promise.all([
        instructorCoursesApi.listTopics(),
        instructorCoursesApi.listCourses({ topicId: selectedTopicId === 'all' ? undefined : selectedTopicId, search: searchTerm, page, pageSize: 10, lang }),
      ])
      setTopics(topicRows)
      setCourses(courseRows.items)
      setTotalItems(courseRows.total)
      setTotalPages(Math.max(1, Math.ceil(courseRows.total / Math.max(1, courseRows.pageSize))))
    } catch {
      await AlertJs.error('Không thể tải khóa học của giảng viên')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [selectedTopicId, searchTerm, page, lang])

  const title = useMemo(() => lang === 'vi' ? 'Bảng điều khiển giảng viên' : lang === 'en' ? 'Instructor dashboard' : 'Dozenten-Dashboard', [lang])

  return (
    <div className='admin-shell'>
      <header className='admin-card admin-card-glow' style={{ marginBottom: 16 }}>
        <div className='admin-row' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className='admin-kicker'>{title}</div>
            <h2 className='admin-title' style={{ margin: 0 }}>Quản lý khóa học cá nhân</h2>
          </div>
          <button className='admin-btn admin-btn-ghost' onClick={logout}><i className='fa-solid fa-right-from-bracket' /> Đăng xuất</button>
        </div>
      </header>

      {loading ? <div className='admin-card'>{text[lang].loading}</div> : (
        <CoursesTab
          courses={courses}
          topics={topics}
          text={text[lang]}
          lang={lang}
          selectedTopicId={selectedTopicId}
          searchTerm={searchTerm}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onChangeFilters={(patch) => {
            if (patch.selectedTopicId !== undefined) setSelectedTopicId(patch.selectedTopicId)
            if (patch.searchTerm !== undefined) setSearchTerm(patch.searchTerm)
            setPage(1)
          }}
          onChangePage={setPage}
          onCourseCreated={loadData}
          coursesApi={instructorCoursesApi}
        />
      )}
    </div>
  )
}
