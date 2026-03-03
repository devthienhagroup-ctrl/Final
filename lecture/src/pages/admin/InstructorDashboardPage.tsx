import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../ui/toast'
import { useAuth } from '../../app/auth'
import { instructorCoursesApi } from '../../api/instructorCourses.api'
import type { CourseAdmin, CourseDetailAdmin, CourseTopic } from '../../api/adminCourses.api'
import type { Course } from '../instructor/instructor.types'
import { InstructorHeader } from '../components/InstructorHeader'
import { KpiGrid } from '../components/KpiGrid'
import { QuickActions } from '../components/QuickActions'
import { CourseDetailTabs } from './courseTabs/courseDetail/CourseDetailTabs'
import { CreateCourseModal } from './courseTabs/CreateCourseModal'

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
  const { logout, can } = useAuth()
  const nav = useNavigate()

  const [lang] = useState<AdminLang>('vi')
  const canWriteCourse = can('courses.write')
  const canAccessDashboard = can('dashboard.admin')
  const [courses, setCourses] = useState<CourseAdmin[]>([])
  const [allCoursesCount, setAllCoursesCount] = useState(0)
  const [topics, setTopics] = useState<CourseTopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<CourseDetailAdmin | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [openCreateModal, setOpenCreateModal] = useState(false)

  const loadCourses = async () => {
    const [topicRows, allRows, courseRows] = await Promise.all([
      instructorCoursesApi.listTopics(),
      instructorCoursesApi.listCourses({ page: 1, pageSize: 1, lang }),
      instructorCoursesApi.listCourses({
        topicId: selectedTopicId === 'all' ? undefined : selectedTopicId,
        search: searchTerm,
        page,
        pageSize: 4,
        lang,
      }),
    ])
    setTopics(topicRows)
    setAllCoursesCount(allRows.total)
    setCourses(courseRows.items)
    setTotalItems(courseRows.total)
    setTotalPages(Math.max(1, Math.ceil(courseRows.total / Math.max(1, courseRows.pageSize))))
  }

  useEffect(() => {
    void loadCourses().catch(() => toast('Lỗi', 'Không thể tải dữ liệu khóa học giảng viên'))
  }, [selectedTopicId, searchTerm, page, lang])

  const refreshSelectedCourse = async (courseId: number) => {
    setLoadingDetail(true)
    try {
      const detail = await instructorCoursesApi.getCourseDetail(courseId, lang)
      setSelectedCourse(detail)
      setSelectedCourseId(courseId)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedCourse(null)
      return
    }
    void refreshSelectedCourse(selectedCourseId).catch(() => toast('Lỗi', 'Không thể tải chi tiết khóa học'))
  }, [selectedCourseId, lang])

  const kpis = useMemo(() => {
    const list = courses.map(mapToInstructorCard)
    const total = allCoursesCount
    const published = list.filter((c) => c.status === 'PUBLISHED').length
    const students = list.reduce((a, b) => a + b.students, 0)
    const drafts = list.reduce((a, b) => a + b.drafts, 0)
    return { managedCourses: total, publishedCourses: published, students, draftLessons: drafts, ratingAvg: 4.7 }
  }, [courses, allCoursesCount])

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
          if (!canWriteCourse) {
            toast('Không có quyền', 'Bạn không có quyền tạo khóa học.')
            return
          }
          setOpenCreateModal(true)
        }}
        onLogout={logout}
        canCreateCourse={canWriteCourse}
      />

      <main className='px-4 md:px-8 py-6 space-y-6'>
        <KpiGrid kpis={kpis} />

        <section className='grid gap-4 xl:grid-cols-[1.15fr_1.25fr]'>
          <div className='rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6'>
            <div className='flex items-start justify-between gap-4 flex-col md:flex-row'>
              <div>
                <div className='text-xs font-extrabold text-slate-500'>Khoá học</div>
                <div className='text-lg font-extrabold'>Quản lý nội dung</div>
                <div className='mt-1 text-sm text-slate-600'>
                  Giảng viên chỉ quản lý khóa học do chính mình tạo. Hiển thị 4 thẻ / trang.
                </div>
              </div>

              <div className='flex items-center gap-2 flex-wrap'>
                <select
                  className='rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300'
                  value={selectedTopicId === 'all' ? 'all' : String(selectedTopicId)}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    setPage(1)
                  }}
                >
                  <option value='all'>Tất cả chủ đề</option>
                  {topics.map((topic) => (<option key={topic.id} value={topic.id}>{topic.translations?.vi?.name || topic.name}</option>))}
                </select>

                <input
                  className='rounded-[14px] border border-slate-200/70 bg-white px-3 py-2 outline-none focus:shadow-[0_0_0_6px_rgba(79,70,229,0.12)] focus:border-indigo-300'
                  placeholder='Nhập tên khóa học...'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>

            <div className='mt-5 grid gap-3 sm:grid-cols-2'>
              {courses.map((course) => (
                <button
                  key={course.id}
                  type='button'
                  onClick={() => {
                    void refreshSelectedCourse(course.id)
                  }}
                  className={`text-left rounded-xl border p-4 transition ${selectedCourseId === course.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                >
                  <div className='font-bold line-clamp-2'>{course.title}</div>
                  <div className='mt-2 text-xs text-slate-500'>#{course.id} • {course.topic?.name || 'Chưa có chủ đề'}</div>
                  <div className='mt-2 flex gap-2 text-xs'>
                    <span className={`px-2 py-1 rounded-full ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{course.published ? 'Published' : 'Draft'}</span>
                    <span>{course._count?.lessons || 0} bài học</span>
                  </div>
                </button>
              ))}
              {!courses.length && <div className='text-sm text-slate-500'>Không có khóa học phù hợp bộ lọc.</div>}
            </div>

            <div className='mt-4 flex items-center justify-between text-sm text-slate-600'>
              <span>Trang {Math.min(page, totalPages)} / {totalPages} • Tổng {totalItems}</span>
              <div className='flex gap-2'>
                <button type='button' className='rounded-lg border px-3 py-1.5 disabled:opacity-50' disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Trước</button>
                <button type='button' className='rounded-lg border px-3 py-1.5 disabled:opacity-50' disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>Sau</button>
              </div>
            </div>
          </div>

          <QuickActions
            onDetails={() => selectedCourseId && void refreshSelectedCourse(selectedCourseId)}
            onEdit={() => selectedCourseId && void refreshSelectedCourse(selectedCourseId)}
            onDelete={() => toast('Xóa khóa học', 'Nút xóa đã có trong danh sách khóa học.')}
            onProgress={() => toast('Theo dõi', 'Theo dõi tiến độ theo từng khóa học của bạn.')}
            selectedCourse={selectedCourse}
            loadingDetail={loadingDetail}
          />
        </section>

        <section className='rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6'>
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='text-lg font-bold'>Chi tiết khóa học / bài học / module / video</h3>
            {canWriteCourse ? (
              <button type='button' className='rounded-lg bg-indigo-600 px-3 py-2 text-white' onClick={() => setOpenCreateModal(true)}>
                Thêm khóa học mới
              </button>
            ) : null}
          </div>
          {loadingDetail && <p className='text-sm text-slate-500'>Đang tải chi tiết...</p>}
          {!loadingDetail && selectedCourse && (
            <CourseDetailTabs
              course={selectedCourse}
              lang={lang}
              text={managerText}
              topics={topics}
              onCourseUpdated={async () => {
                await loadCourses()
                if (selectedCourseId) await refreshSelectedCourse(selectedCourseId)
              }}
              coursesApi={instructorCoursesApi}
              onCourseDeleted={async () => {
                await loadCourses()
                setSelectedCourseId(null)
                setSelectedCourse(null)
              }}
            />
          )}
          {!loadingDetail && !selectedCourse && <p className='text-sm text-slate-500'>Chọn khóa học ở cột trái để xem và quản lý chi tiết.</p>}
        </section>

        <CreateCourseModal open={canWriteCourse && openCreateModal} lang={lang} topics={topics} onClose={() => setOpenCreateModal(false)} onCreated={loadCourses} coursesApi={instructorCoursesApi} />

        <footer className='py-6 text-center text-sm text-slate-500'>
          © 2025 AYANAVITA • Instructor Dashboard
        </footer>
      </main>
    </div>
  )
}
