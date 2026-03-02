import type { CourseDetailAdmin } from '../../api/adminCourses.api'

type Props = {
  onDetails: () => void
  onEdit: () => void
  onDelete: () => void
  onProgress: () => void
  selectedCourse: CourseDetailAdmin | null
  loadingDetail: boolean
}

export function QuickActions(props: Props) {
  const lessonCount = props.selectedCourse?._count?.lessons || 0
  const topicName = props.selectedCourse?.topic?.name || 'Chưa có chủ đề'

  return (
    <div className='rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6'>
      <div className='text-xs font-extrabold text-slate-500'>Chi tiết / chỉnh sửa</div>
      <div className='text-lg font-extrabold'>Chi tiết khóa học đã chọn</div>
      <div className='mt-2 text-sm text-slate-600'>
        Xem nhanh thông tin khóa học trước khi chuyển sang chỉnh sửa hoặc theo dõi tiến độ.
      </div>

      {props.loadingDetail && <div className='mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500'>Đang tải chi tiết khóa học...</div>}

      {!props.loadingDetail && !props.selectedCourse && (
        <div className='mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500'>
          Chọn một khóa học từ danh sách bên trái để hiển thị thông tin chi tiết.
        </div>
      )}

      {!props.loadingDetail && props.selectedCourse && (
        <div className='mt-4 space-y-3'>
          <div className='rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200'>
            <div className='text-xs font-semibold text-slate-500'>Khóa học #{props.selectedCourse.id}</div>
            <div className='mt-1 text-sm font-extrabold text-slate-900 line-clamp-2'>{props.selectedCourse.title}</div>
            <div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
              <span className={`rounded-full px-2 py-1 font-bold ${props.selectedCourse.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {props.selectedCourse.published ? 'Published' : 'Draft'}
              </span>
              <span className='text-slate-500'>{topicName}</span>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div className='rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200'>
              <div className='text-xs text-slate-500'>Bài học</div>
              <div className='font-extrabold text-slate-900'>{lessonCount}</div>
            </div>
            <div className='rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200'>
              <div className='text-xs text-slate-500'>Học viên</div>
              <div className='font-extrabold text-slate-900'>{props.selectedCourse.enrollmentCount || 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className='mt-4 grid grid-cols-2 gap-2'>
      </div>
    </div>
  )
}
