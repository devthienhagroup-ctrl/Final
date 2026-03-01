type Props = {
  onDetails: () => void
  onEdit: () => void
  onDelete: () => void
  onProgress: () => void
}

export function QuickActions(props: Props) {
  return (
    <div className='rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6'>
      <div className='text-xs font-extrabold text-slate-500'>Chi tiết / chỉnh sửa</div>
      <div className='text-lg font-extrabold'>Theo dõi khóa học của tôi</div>
      <div className='mt-2 text-sm text-slate-600'>
        Mở chi tiết, chỉnh sửa nội dung và xóa khóa học do bạn tạo.
      </div>

      <div className='mt-4 space-y-3'>
        <label className='flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200'>
          <input type='checkbox' defaultChecked className='h-4 w-4' />
          <span className='text-sm font-extrabold'>Có thể tạo khóa học mới</span>
        </label>
        <label className='flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200'>
          <input type='checkbox' defaultChecked className='h-4 w-4' />
          <span className='text-sm font-extrabold'>Có thể chỉnh sửa khóa học của tôi</span>
        </label>
        <label className='flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200'>
          <input type='checkbox' defaultChecked className='h-4 w-4' />
          <span className='text-sm font-extrabold'>Có thể xóa khóa học của tôi</span>
        </label>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2'>
        <button className='btn btn-primary' onClick={props.onDetails}>
          <i className='fa-solid fa-circle-info mr-1' />
          Chi tiết
        </button>
        <button className='btn btn-accent' onClick={props.onEdit}>
          <i className='fa-solid fa-pen-to-square mr-1' />
          Chỉnh sửa
        </button>
        <button className='btn' onClick={props.onDelete}>
          <i className='fa-solid fa-trash mr-1' />
          Xóa khóa học
        </button>
        <button className='btn' onClick={props.onProgress}>
          <i className='fa-solid fa-chart-line mr-1' />
          Theo dõi
        </button>
      </div>
    </div>
  )
}
