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
  const shortDescription = props.selectedCourse?.shortDescription?.trim() || 'Chưa có mô tả ngắn cho khóa học này.'
  const description = props.selectedCourse?.description?.trim() || 'Chưa có mô tả chi tiết. Hãy cập nhật để học viên hiểu rõ giá trị khóa học.'
  const thumbnail = props.selectedCourse?.thumbnail?.trim() || 'https://placehold.co/720x400/e2e8f0/334155?text=Course+Thumbnail'

  const formatPrice = (price?: number) => new Intl.NumberFormat('vi-VN').format(price || 0)

  return (
    <div className='rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6'>
      <div className='text-xs font-extrabold text-slate-500'>Sơ bộ khóa học</div>
      <div className='text-lg font-extrabold'>Thông tin khái quát khóa học đã chọn</div>
      <div className='mt-2 text-sm text-slate-600'>
        Hiển thị nhanh các thông số chính để giảng viên nắm tổng quan trước khi đi vào chi tiết.
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
            <img src={thumbnail} alt={props.selectedCourse.title} className='h-40 w-full rounded-xl object-cover ring-1 ring-slate-200' />

            <div className='mt-3 text-xs font-semibold text-slate-500'>Khóa học #{props.selectedCourse.id}</div>
            <div className='mt-1 text-sm font-extrabold text-slate-900 line-clamp-2'>{props.selectedCourse.title}</div>

            <div className='mt-2 text-xs font-bold text-slate-500'>Mô tả ngắn</div>
            <p className='mt-1 text-sm text-slate-700 line-clamp-2'>{shortDescription}</p>

            <div className='mt-2 text-xs font-bold text-slate-500'>Mô tả chi tiết</div>
            <p className='mt-1 text-sm text-slate-700 line-clamp-3'>{description}</p>

            <div className='mt-3 flex flex-wrap items-center gap-2 text-xs'>
              <span className={`rounded-full px-2.5 py-1 font-bold ${props.selectedCourse.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {props.selectedCourse.published ? 'Published' : 'Draft'}
              </span>
              <span className='rounded-full px-2.5 py-1 font-bold bg-violet-100 text-violet-700'>{topicName}</span>
              <span className='rounded-full px-2.5 py-1 font-bold bg-cyan-100 text-cyan-700'>{lessonCount} bài học</span>
              <span className='rounded-full px-2.5 py-1 font-bold bg-indigo-100 text-indigo-700'>{props.selectedCourse.enrollmentCount || 0} học viên</span>
              <span className='rounded-full px-2.5 py-1 font-bold bg-rose-100 text-rose-700'>{formatPrice(props.selectedCourse.price)}đ</span>
              <span className='rounded-full px-2.5 py-1 font-bold bg-orange-100 text-orange-700'>⭐ {props.selectedCourse.ratingAvg?.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
