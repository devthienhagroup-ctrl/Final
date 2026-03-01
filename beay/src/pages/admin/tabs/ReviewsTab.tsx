import type { ReviewsTabProps } from './types'

export function ReviewsTab({ services, appointments, selectedServiceReviews, reviewForm, onReviewFormChange, onCreateReview, onDeleteReview, onToggleAppointmentStatus, onShowAppointmentDetail, onDeleteAppointment }: ReviewsTabProps) {
  return (
    <div className='admin-grid'>
      <section className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'><i className='fa-solid fa-star' /> Thêm review</h3>
        <div className='admin-form-grid'>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-spa' /> Dịch vụ</span><select className='admin-input' value={reviewForm.serviceId} onChange={(e) => onReviewFormChange({ ...reviewForm, serviceId: Number(e.target.value) })}><option value={0}>Chọn dịch vụ</option>{services.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-star-half-stroke' /> Số sao</span><select className='admin-input' value={reviewForm.stars} onChange={(e) => onReviewFormChange({ ...reviewForm, stars: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}</select></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-user' /> Tên khách hàng</span><input className='admin-input' placeholder='Nhập tên khách hàng' value={reviewForm.customerName} onChange={(e) => onReviewFormChange({ ...reviewForm, customerName: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-comment-dots' /> Nội dung review</span><input className='admin-input' placeholder='Nội dung tiếng Việt thân thiện' value={reviewForm.comment} onChange={(e) => onReviewFormChange({ ...reviewForm, comment: e.target.value })} /></label>
        </div>
        <button className='admin-btn admin-btn-primary' onClick={onCreateReview}>Thêm review</button>

        <hr className='admin-divider' />
        <h3 className='admin-card-title'><i className='fa-solid fa-calendar-days' /> Lịch hẹn ({appointments.length})</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Chi nhánh</th>
                <th>Dịch vụ</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 10).map((appointment) => (
                <tr key={appointment.id}>
                  <td className='td-strong'>{appointment.customerName}</td>
                  <td>{appointment.branch?.name || '-'}</td>
                  <td>{appointment.service?.name || '-'}</td>
                  <td>
                    <span className={`admin-badge ${appointment.status === 'CONFIRMED' ? 'admin-badge-green' : 'admin-badge-orange'}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td>
                    <div className='admin-row'>
                      <button className='admin-btn admin-btn-ghost' onClick={() => onToggleAppointmentStatus(appointment)}>Đổi trạng thái</button>
                      <button className='admin-btn admin-btn-ghost' onClick={() => onShowAppointmentDetail(appointment)}>Chi tiết</button>
                      <button className='admin-btn admin-btn-danger' onClick={() => onDeleteAppointment(appointment)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'><i className='fa-solid fa-folder-open' /> Danh sách review ({selectedServiceReviews.length})</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Đánh giá</th>
                <th>Nội dung</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {selectedServiceReviews.map((review) => (
                <tr key={review.id}>
                  <td>#{review.serviceId}</td>
                  <td><span className='admin-badge admin-badge-yellow'>{'⭐'.repeat(review.stars)}</span></td>
                  <td>{review.comment || '-'}</td>
                  <td><button className='admin-btn admin-btn-danger' onClick={() => onDeleteReview(review)}>Xóa review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
