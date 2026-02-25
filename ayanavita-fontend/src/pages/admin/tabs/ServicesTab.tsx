import type { ServicesTabProps } from './types'

export function ServicesTab({ services, serviceForm, editingService, selectedImageName, onServiceFormChange, onSelectImage, onSaveService, onEditService, onDeleteService, onCancelEdit }: ServicesTabProps) {
  return (
    <div className='admin-grid'>
      <section className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'><i className='fa-solid fa-spa' /> {editingService ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ mới'}</h3>
        <div className='admin-form-grid'>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-id-card' /> Mã dịch vụ (tự sinh)</span><input className='admin-input' placeholder='Tự sinh theo tên dịch vụ' value={serviceForm.code} disabled /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-sparkles' /> Tên dịch vụ</span><input className='admin-input' placeholder='Tên dịch vụ nổi bật' value={serviceForm.name} onChange={(e) => onServiceFormChange({ ...serviceForm, name: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-bullseye' /> Mục tiêu</span><input className='admin-input' placeholder='Relax, Detox,...' value={serviceForm.goals} onChange={(e) => onServiceFormChange({ ...serviceForm, goals: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-users' /> Những ai phù hợp (JSON)</span><input className='admin-input' placeholder='Nhập như goals, ví dụ: Người stress, Mất ngủ' value={serviceForm.suitableFor} onChange={(e) => onServiceFormChange({ ...serviceForm, suitableFor: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-clock' /> Thời lượng (phút)</span><input className='admin-input' type='number' placeholder='60' value={serviceForm.durationMin} onChange={(e) => onServiceFormChange({ ...serviceForm, durationMin: Number(e.target.value) })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-coins' /> Giá</span><input className='admin-input' type='number' placeholder='1000000' value={serviceForm.price} onChange={(e) => onServiceFormChange({ ...serviceForm, price: Number(e.target.value) })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-pen-to-square' /> Mô tả</span><textarea className='admin-input' placeholder='Mô tả dịch vụ chi tiết' value={serviceForm.description} onChange={(e) => onServiceFormChange({ ...serviceForm, description: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-cloud-arrow-up' /> Upload ảnh</span><input type='file' accept='image/*' onChange={(e) => onSelectImage(e.target.files?.[0] || null)} /></label>
          {selectedImageName && <span className='admin-helper'>Đã chọn: {selectedImageName}</span>}
        </div>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-primary' onClick={onSaveService}>{editingService ? 'Lưu thay đổi' : 'Thêm dịch vụ'}</button>
          {editingService && <button className='admin-btn admin-btn-ghost' onClick={onCancelEdit}>Hủy</button>}
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> Danh sách dịch vụ</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Code</th>
                <th>Thời lượng</th>
                <th>Giá</th>
                <th>Mục tiêu</th>
                <th>Những ai phù hợp (JSON)</th>
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
                    <div className='admin-badge-wrap'>
                      {(service.suitableFor || []).slice(0, 3).map((item) => <span key={`fit-${item}`} className='admin-badge admin-badge-pastel'>{item}</span>)}
                    </div>
                  </td>
                  <td>
                    <div className='admin-row'>
                      <button className='admin-btn admin-btn-ghost' onClick={() => onEditService(service)}>Sửa</button>
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
