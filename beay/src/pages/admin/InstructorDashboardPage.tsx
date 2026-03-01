import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../ui/toast'
import { useAuth } from '../../app/auth'
import { instructorCoursesApi } from '../../api/instructorCourses.api'
import type { CourseAdmin, CourseTopic } from '../../api/adminCourses.api'
import type { Course } from '../instructor/instructor.types'
import { InstructorHeader } from '../components/InstructorHeader'
import { KpiGrid } from '../components/KpiGrid'
import { CoursesGrid } from '../components/CoursesGrid'
import { QuickActions } from '../components/QuickActions'
import { CoursesTab } from './courseTabs/CoursesTab'

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT'
type AdminLang = 'vi' | 'en' | 'de'

const managerText: Record<string, string> = {
  coursesTab: 'Khóa học của tôi',
  filterByTopic: 'Lọc theo chủ đề',
  allTopics: 'Tất cả chủ đề',
  searchByCourseName: 'Tìm theo tên khóa học',
  searchPlaceholder: 'Nhập tên khóa học...',
  titleCol: 'Tiêu đề',
  topicCol: 'Chủ đề',
  creatorCol: 'Người tạo',
  priceCol: 'Giá',
  ratingCol: 'Rating',
  enrollmentCol: 'Đăng ký',
  lessonCol: 'Bài học',
  videoCountCol: 'Video',
  createdAtCol: 'Tạo lúc',
  updatedAtCol: 'Sửa lúc',
  statusCol: 'Trạng thái',
  actions: 'Chi tiết / chỉnh sửa',
  unassigned: 'Chưa gán',
  publishedStatus: 'Published',
  draftStatus: 'Draft',
  pageLabel: 'Trang',
  totalCoursesLabel: 'Tổng khóa học',
  prevPage: 'Trước',
  nextPage: 'Sau',
  loading: 'Đang tải...',
}

const mapToInstructorCard = (course: CourseAdmin): Course => ({
  id: course.id,
  title: course.title,
  status: course.published ? 'PUBLISHED' : 'DRAFT',
  lessons: course._count?.lessons || 0,
  drafts: course.published ? 0 : Math.max(1, course._count?.lessons || 0),
  students: course.enrollmentCount || 0,
})

export function InstructorDashboardPage() {
  const { toast } = useToast()
  const { logout } = useAuth()

  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('PUBLISHED')
  const [lang] = useState<AdminLang>('vi')
  const [courses, setCourses] = useState<CourseAdmin[]>([])
  const [topics, setTopics] = useState<CourseTopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [managerOpen, setManagerOpen] = useState(false)

  const loadCourses = async () => {
    const [topicRows, courseRows] = await Promise.all([
      instructorCoursesApi.listTopics(),
      instructorCoursesApi.listCourses({
        topicId: selectedTopicId === 'all' ? undefined : selectedTopicId,
        search: searchTerm,
        page,
        pageSize: 10,
        lang,
      }),
    ])
    setTopics(topicRows)
    setCourses(courseRows.items)
    setTotalItems(courseRows.total)
    setTotalPages(Math.max(1, Math.ceil(courseRows.total / Math.max(1, courseRows.pageSize))))
  }

  useEffect(() => {
    void loadCourses().catch(() => toast('Lỗi', 'Không thể tải dữ liệu khóa học giảng viên'))
  }, [selectedTopicId, searchTerm, page, lang])

  const filteredCourses = useMemo(() => {
    const list = courses.map(mapToInstructorCard)
    const kw = q.trim().toLowerCase()
    return list.filter((c) => {
      const okQ = !kw || c.title.toLowerCase().includes(kw)
      const okS = filter === 'ALL' || c.status === filter
      return okQ && okS
    })
  }, [courses, q, filter])

  const kpis = useMemo(() => {
    const list = courses.map(mapToInstructorCard)
    const total = list.length
    const published = list.filter((c) => c.status === 'PUBLISHED').length
    const students = list.reduce((a, b) => a + b.students, 0)
    const drafts = list.reduce((a, b) => a + b.drafts, 0)
    return { managedCourses: total, publishedCourses: published, students, draftLessons: drafts, ratingAvg: 4.7 }
  }, [courses])

  return (
    <div
      className='min-h-screen text-slate-900'
      style={{
        background:
          'radial-gradient(900px 450px at 15% 0%, rgba(79,70,229,0.14), transparent 60%), radial-gradient(700px 380px at 90% 10%, rgba(245,158,11,0.10), transparent 60%), linear-gradient(to bottom, #f8fafc, #f8fafc)',
      }}
    >
      <InstructorHeader
        onOpenStudent={() => toast('Học viên', 'Theo dõi học viên của các khóa học bạn tạo.')}
        onOpenRbac={() => toast('RBAC', 'Quyền giảng viên được giới hạn trên khóa học của chính mình.')}
        onNotif={() => toast('Thông báo', 'Thông báo giảng viên.')}
        onNewCourse={() => {
          setManagerOpen(true)
          toast('Tạo khóa học', 'Mở khu vực chi tiết / chỉnh sửa để tạo khóa học mới.')
        }}
        onLogout={logout}
      />

      <main className='px-4 md:px-8 py-6 space-y-6'>
        <KpiGrid kpis={kpis} />

        <section className='grid gap-4 lg:grid-cols-3'>
          <div className='rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6 lg:col-span-2'>
            <div className='flex items-start justify-between gap-4 flex-col md:flex-row'>
              <div>
                <div className='text-xs font-extrabold text-slate-500'>Khoá học</div>
                <div className='text-lg font-extrabold'>Quản lý nội dung</div>
                <div className='mt-1 text-sm text-slate-600'>
                  Giảng viên chỉ quản lý khóa học do chính mình tạo.
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <i className='fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                  <input
                    id='instructor-search'
                    className='rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 pl-11 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300'
                    placeholder='Tìm khoá... (phím /)'
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <select
                  className='rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300'
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as StatusFilter)}
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='PUBLISHED'>Đang bán</option>
                  <option value='DRAFT'>Draft</option>
                </select>
              </div>
            </div>

            <div className='mt-5'>
              <CoursesGrid
                courses={filteredCourses}
                onAddLesson={(_courseId) => {
                  setManagerOpen(true)
                  toast('Bài học', 'Vào Chi tiết / chỉnh sửa để tạo lesson giống Admin.')
                }}
                onManageCourse={(_courseId) => {
                  setManagerOpen(true)
                }}
              />
            </div>
          </div>

          <QuickActions
            onDetails={() => setManagerOpen(true)}
            onEdit={() => setManagerOpen(true)}
            onDelete={() => toast('Xóa khóa học', 'Nút xóa đã có trong danh sách khóa học.')}
            onProgress={() => toast('Theo dõi', 'Theo dõi tiến độ theo từng khóa học của bạn.')}
          />
        </section>

        {managerOpen && (
          <section>
            <CoursesTab
              courses={courses}
              topics={topics}
              text={managerText}
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
              onCourseCreated={loadCourses}
              coursesApi={instructorCoursesApi}
            />
          </section>
        )}

        <footer className='py-6 text-center text-sm text-slate-500'>
          © 2025 AYANAVITA • Instructor Dashboard
        </footer>
      </main>
    </div>
  )
}
