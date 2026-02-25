import { useState } from 'react'
import type { SpaService } from '../../../api/spaAdmin.api'
import type { ServicesTabProps } from './types'

const renderJsonPreview = (items: string[], badgeClass: string, extraBadgeClass: string) => {
  if (!items?.length) return '-'
  const [first, ...rest] = items
  return (
    <div className='admin-row admin-row-nowrap'>
      <span className={`admin-badge ${badgeClass}`}>{first}</span>
      {rest.length > 0 && <span className={`admin-badge ${extraBadgeClass}`}>+{rest.length}</span>}
    </div>
  )
}

export function ServicesTab({ services, categories, serviceForm, editingService, selectedImageName, onServiceFormChange, onSelectImage, onSaveService, onEditService, onDeleteService, onCancelEdit }: ServicesTabProps) {
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [detailService, setDetailService] = useState<SpaService | null>(null)

  const handleOpenCreate = () => {
    onCancelEdit()
    setEditModalOpen(true)
  }

  const handleOpenEdit = (service: SpaService) => {
    onEditService(service)
    setEditModalOpen(true)
  }

  const handleCloseEdit = () => {
    onCancelEdit()
    setEditModalOpen(false)
  }

  return (
    <section className='admin-card admin-card-full'>
      <div className='admin-row admin-row-space'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> Quản lý dịch vụ</h3>
        <button className='admin-btn admin-btn-primary' onClick={handleOpenCreate}><i className='fa-solid fa-plus' /> Thêm dịch vụ</button>
      </div>

      <div className='admin-table-wrap'>
        <table className='admin-table services-table'>
          <thead>
            <tr>
              <th>Tên dịch vụ</th>
              <th>Danh mục</th>
              <th>Thời lượng</th>
              <th>Giá</th>
              <th>Rating</th>
              <th>Lượt đặt</th>
              <th>Mục tiêu </th>
              <th>Phù hợp </th>
              <th>Quy trình </th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td className='td-strong services-name-cell'>{service.name}</td>
                <td>{service.category || '-'}</td>
                <td>{service.durationMin} phút</td>
                <td><span className='admin-badge admin-badge-blue'>{service.price.toLocaleString('vi-VN')}đ</span></td>
                <td><span className='services-rating'>{service.ratingAvg.toFixed(1)}</span></td>
                <td><span className='services-booked'>{service.bookedCount ?? 0}</span></td>
                <td>{renderJsonPreview(service.goals || [], 'admin-badge-pink', 'admin-badge-rose')}</td>
                <td>{renderJsonPreview(service.suitableFor || [], 'admin-badge-cyan', 'admin-badge-sky')}</td>
                <td>{renderJsonPreview(service.process || [], 'admin-badge-amber', 'admin-badge-yellow')}</td>
                <td>
                  <div className='service-action-menu'>
                    <button className='admin-btn admin-btn-ghost service-action-trigger' aria-label='Mở thao tác'>
                      <i className='fa-solid fa-ellipsis' />
                    </button>
                    <div className='service-action-list'>
                      <button className='service-action-item' onClick={() => setDetailService(service)} title='Chi tiết'>
                        <span className='admin-btn-icon admin-btn-icon-info'>
                          <i className='fa-solid fa-circle-info' />
                        </span>
                        <span className='service-action-text'>Chi tiết</span>
                      </button>
                      <button className='service-action-item' onClick={() => handleOpenEdit(service)} title='Sửa'>
                        <span className='admin-btn-icon admin-btn-icon-edit'>
                          <i className='fa-solid fa-pen-to-square' />
                        </span>
                        <span className='service-action-text'>Sửa</span>
                      </button>
                      <button className='service-action-item' onClick={() => onDeleteService(service)} title='Xóa'>
                        <span className='admin-btn-icon admin-btn-icon-delete'>
                          <i className='fa-solid fa-trash' />
                        </span>
                        <span className='service-action-text'>Xóa</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && (
        <div className='admin-modal-overlay' onClick={handleCloseEdit}>
          <div className='admin-modal' onClick={(e) => e.stopPropagation()}>
            <div className='admin-row admin-row-space'>
              <h3 className='admin-card-title'><i className='fa-solid fa-spa' /> {editingService ? 'Chỉnh sửa dịch vụ' : 'Tạo dịch vụ mới'}</h3>
              <button className='admin-btn admin-btn-ghost' onClick={handleCloseEdit}><i className='fa-solid fa-xmark' /> Đóng</button>
            </div>
            <div className='admin-form-grid'>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-sparkles' /> Tên dịch vụ</span><input className='admin-input' value={serviceForm.name} onChange={(e) => onServiceFormChange({ ...serviceForm, name: e.target.value })} /></label>
              <label className='admin-field'>
                <span className='admin-label'><i className='fa-solid fa-layer-group' /> Danh mục</span>
                <select className='admin-input' value={serviceForm.categoryId || 0} onChange={(e) => onServiceFormChange({ ...serviceForm, categoryId: Number(e.target.value) })}>
                  <option value={0}>Chọn danh mục</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-bullseye' /> Mục tiêu </span><input className='admin-input' placeholder='Relax, Detox' value={serviceForm.goals} onChange={(e) => onServiceFormChange({ ...serviceForm, goals: e.target.value })} /></label>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-users' /> Những ai phù hợp </span><input className='admin-input' placeholder='Người stress, Mất ngủ' value={serviceForm.suitableFor} onChange={(e) => onServiceFormChange({ ...serviceForm, suitableFor: e.target.value })} /></label>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-list-check' /> Quy trình </span><input className='admin-input' placeholder='B1 chào hỏi, B2 tư vấn, B3 trị liệu' value={serviceForm.process} onChange={(e) => onServiceFormChange({ ...serviceForm, process: e.target.value })} /></label>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-clock' /> Thời lượng (phút)</span><input className='admin-input' type='number' value={serviceForm.durationMin} onChange={(e) => onServiceFormChange({ ...serviceForm, durationMin: Number(e.target.value) })} /></label>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-coins' /> Giá</span><input className='admin-input' type='number' value={serviceForm.price} onChange={(e) => onServiceFormChange({ ...serviceForm, price: Number(e.target.value) })} /></label>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-tag' /> Tag</span><input className='admin-input' value={serviceForm.tag} onChange={(e) => onServiceFormChange({ ...serviceForm, tag: e.target.value })} /></label>
              <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-star' /> Rating trung bình</span><input className='admin-input' value={editingService?.ratingAvg?.toFixed(1) || '5.0'} disabled /></label>
              <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-pen-to-square' /> Mô tả</span><textarea className='admin-input' value={serviceForm.description} onChange={(e) => onServiceFormChange({ ...serviceForm, description: e.target.value })} /></label>
              <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-cloud-arrow-up' /> Upload ảnh</span><input type='file' accept='image/*' onChange={(e) => onSelectImage(e.target.files?.[0] || null)} /></label>
              {selectedImageName && <span className='admin-helper'>Đã chọn: {selectedImageName}</span>}
            </div>
            <div className='admin-row'>
              <button className='admin-btn admin-btn-primary' onClick={async () => { await onSaveService(); setEditModalOpen(false) }}>{editingService ? 'Lưu thay đổi' : 'Thêm dịch vụ'}</button>
              <button className='admin-btn admin-btn-ghost' onClick={handleCloseEdit}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {detailService && (
        <div className='admin-modal-overlay' onClick={() => setDetailService(null)}>
          <div className='admin-modal' onClick={(e) => e.stopPropagation()}>
            <div className='admin-row admin-row-space'>
              <h3 className='admin-card-title'><i className='fa-solid fa-circle-info' /> Chi tiết dịch vụ</h3>
              <button className='admin-btn admin-btn-ghost' onClick={() => setDetailService(null)}><i className='fa-solid fa-xmark' /> Đóng</button>
            </div>
            <div className='admin-form-grid'>
              <p><b>ID:</b> {detailService.id}</p>
              <p><b>Tên dịch vụ:</b> {detailService.name}</p>
              <p><b>Danh mục:</b> {detailService.category || '-'}</p>
              <p><b>Thời lượng:</b> {detailService.durationMin} phút</p>
              <p><b>Giá:</b> {detailService.price.toLocaleString('vi-VN')}đ</p>
              <p><b>Rating:</b> {detailService.ratingAvg.toFixed(1)}</p>
              <p><b>Lượt đặt:</b> {detailService.bookedCount ?? 0}</p>
              <p><b>Tag:</b> {detailService.tag || '-'}</p>
              <p><b>Mô tả:</b> {detailService.description || '-'}</p>
              <p><b>Mục tiêu:</b> {(detailService.goals || []).join(', ') || '-'}</p>
              <p><b>Phù hợp:</b> {(detailService.suitableFor || []).join(', ') || '-'}</p>
              <p><b>Quy trình:</b> {(detailService.process || []).join(', ') || '-'}</p>
              <p><b>Ảnh:</b> {detailService.imageUrl || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
