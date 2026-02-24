import type { ServicesTabProps } from './types'

export function ServicesTab({ services, serviceForm, editingService, selectedImageName, onServiceFormChange, onSelectImage, onUploadImage, onDeleteCloudImage, onSaveService, onEditService, onDeleteService, onShowServiceDetail, onCancelEdit }: ServicesTabProps) {
  return (
    <div className='admin-grid'>
      <section className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'>🧴 {editingService ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ mới'}</h3>
        <div className='admin-form-grid'>
          <label className='admin-field'><span className='admin-label'>🆔 Mã dịch vụ</span><input className='admin-input' placeholder='SERVICE_CODE' value={serviceForm.code} onChange={(e) => onServiceFormChange({ ...serviceForm, code: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'>✨ Tên dịch vụ</span><input className='admin-input' placeholder='Tên dịch vụ nổi bật' value={serviceForm.name} onChange={(e) => onServiceFormChange({ ...serviceForm, name: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'>🎯 Mục tiêu</span><input className='admin-input' placeholder='Relax, Detox,...' value={serviceForm.goals} onChange={(e) => onServiceFormChange({ ...serviceForm, goals: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'>⏱️ Thời lượng (phút)</span><input className='admin-input' type='number' placeholder='60' value={serviceForm.durationMin} onChange={(e) => onServiceFormChange({ ...serviceForm, durationMin: Number(e.target.value) })} /></label>
          <label className='admin-field'><span className='admin-label'>💶 Giá</span><input className='admin-input' type='number' placeholder='1000000' value={serviceForm.price} onChange={(e) => onServiceFormChange({ ...serviceForm, price: Number(e.target.value) })} /></label>
          <label className='admin-field'><span className='admin-label'>📝 Mô tả</span><textarea className='admin-input' placeholder='Mô tả dịch vụ chi tiết' value={serviceForm.description} onChange={(e) => onServiceFormChange({ ...serviceForm, description: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'>🖼️ Image URL</span><input className='admin-input' placeholder='https://...' value={serviceForm.imageUrl} onChange={(e) => onServiceFormChange({ ...serviceForm, imageUrl: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'>📁 Upload ảnh</span><input type='file' accept='image/*' onChange={(e) => onSelectImage(e.target.files?.[0] || null)} /></label>
          {selectedImageName && <span className='admin-helper'>Đã chọn: {selectedImageName}</span>}
        </div>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-ghost' onClick={onUploadImage}>Upload cloud</button>
          <button className='admin-btn admin-btn-ghost' onClick={onDeleteCloudImage}>Xóa ảnh cloud</button>
        </div>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-primary' onClick={onSaveService}>{editingService ? 'Lưu thay đổi' : 'Thêm dịch vụ'}</button>
          {editingService && <button className='admin-btn admin-btn-ghost' onClick={onCancelEdit}>Hủy</button>}
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'>📋 Danh sách dịch vụ</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Code</th>
                <th>Thời lượng</th>
                <th>Giá</th>
                <th>Mục tiêu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td className='td-strong'>{service.name}</td>
                  <td><span className='admin-badge admin-badge-purple'>{service.code}</span></td>
                  <td>{service.durationMin} phút</td>
                  <td><span className='admin-badge admin-badge-blue'>{service.price.toLocaleString('vi-VN')}đ</span></td>
                  <td>
                    <div className='admin-badge-wrap'>
                      {(service.goals || []).slice(0, 3).map((goal) => <span key={goal} className='admin-badge admin-badge-pastel'>{goal}</span>)}
                    </div>
                  </td>
                  <td>
                    <div className='admin-row'>
                      <button className='admin-btn admin-btn-ghost' onClick={() => onEditService(service)}>Sửa</button>
                      <button className='admin-btn admin-btn-ghost' onClick={() => onShowServiceDetail(service)}>Chi tiết</button>
                      <button className='admin-btn admin-btn-danger' onClick={() => onDeleteService(service)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
