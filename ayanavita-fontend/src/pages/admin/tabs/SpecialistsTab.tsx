import { useMemo, useState } from 'react'
import type { SpecialistsTabProps } from './types'

export function SpecialistsTab({ branches, services, specialists, specialistForm, editingSpecialist, onSpecialistFormChange, onSaveSpecialist, onEditSpecialist, onDeleteSpecialist, onCancelEdit }: SpecialistsTabProps) {
  const branchServices = specialistForm.branchId
    ? services.filter((service) => service.branchIds.includes(specialistForm.branchId))
    : []

  const toggleService = (serviceId: number) => {
    const exists = specialistForm.serviceIds.includes(serviceId)
    onSpecialistFormChange({
      ...specialistForm,
      serviceIds: exists
        ? specialistForm.serviceIds.filter((item) => item !== serviceId)
        : [...specialistForm.serviceIds, serviceId],
    })
  }

  const [searchName, setSearchName] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredSpecialists = useMemo(() => {
    const keyword = searchName.trim().toLowerCase()
    if (!keyword) return specialists
    return specialists.filter((item) => item.name.toLowerCase().includes(keyword))
  }, [searchName, specialists])

  const totalPages = Math.max(1, Math.ceil(filteredSpecialists.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedSpecialists = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredSpecialists.slice(start, start + pageSize)
  }, [filteredSpecialists, pageSize, safePage])

  return (
    <div className='admin-grid'>
      <section className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'><i className='fa-solid fa-user-nurse' /> {editingSpecialist ? 'Cập nhật chuyên viên' : 'Thêm chuyên viên'}</h3>
        <div className='admin-form-grid'>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-user' /> Tên chuyên viên</span><input className='admin-input' placeholder='Tên chuyên viên' value={specialistForm.name} onChange={(e) => onSpecialistFormChange({ ...specialistForm, name: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-envelope' /> Email tài khoản</span><input className='admin-input' type='email' placeholder='staff@example.com' value={specialistForm.email} onChange={(e) => onSpecialistFormChange({ ...specialistForm, email: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-building' /> Chi nhánh</span><select className='admin-input' value={specialistForm.branchId} onChange={(e) => onSpecialistFormChange({ ...specialistForm, branchId: Number(e.target.value), serviceIds: [] })}><option value={0}>Chọn chi nhánh</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-medal' /> Cấp độ</span><select className='admin-input' value={specialistForm.level} onChange={(e) => onSpecialistFormChange({ ...specialistForm, level: e.target.value })}><option value='THERAPIST'>THERAPIST</option><option value='SENIOR'>SENIOR</option><option value='EXPERT'>EXPERT</option></select></label>
          <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-address-card' /> Bio</span><textarea className='admin-input admin-textarea' placeholder='Mô tả năng lực chuyên viên' value={specialistForm.bio} onChange={(e) => onSpecialistFormChange({ ...specialistForm, bio: e.target.value })} /></label>

          <div className='admin-field admin-field-full'>
            <span className='admin-label'><i className='fa-solid fa-list-check' /> Dịch vụ theo chi nhánh</span>
            <div className='admin-multi-select'>
              {branchServices.length > 0 ? branchServices.map((service) => (
                <label key={service.id} className='admin-checkbox-row'>
                  <input type='checkbox' checked={specialistForm.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} />
                  <span>{service.name}</span>
                </label>
              )) : <span className='admin-helper'>Vui lòng chọn chi nhánh để tải dịch vụ.</span>}
            </div>
          </div>
        </div>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-primary' onClick={onSaveSpecialist}>{editingSpecialist ? 'Lưu thay đổi' : 'Thêm chuyên viên'}</button>
          {editingSpecialist && <button className='admin-btn admin-btn-ghost' onClick={onCancelEdit}>Hủy</button>}
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> Danh sách chuyên viên</h3>
        <div className='admin-row admin-row-between mb-2'>
          <label className='admin-field-inline'>
            <span className='admin-label'><i className='fa-solid fa-magnifying-glass' /> Tìm tên</span>
            <input
              className='admin-input admin-input-sm'
              placeholder='Nhập tên chuyên viên'
              value={searchName}
              onChange={(e) => { setSearchName(e.target.value); setPage(1) }}
            />
          </label>

          <label className='admin-field-inline'>
            <span className='admin-label'><i className='fa-solid fa-list-ol' /> /Trang</span>
            <select
              className='admin-input admin-input-sm'
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </label>
        </div>

        <div className='admin-table-wrap !mt-2' >
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Cấp độ</th>
                <th>Chi nhánh</th>
                <th>Dịch vụ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedSpecialists.map((item) => (
                <tr key={item.id}>
                  <td className='td-strong'>{item.name}</td>
                  <td>{item.email}</td>
                  <td><span className={`admin-badge ${item.level === 'EXPERT' ? 'admin-badge-purple' : item.level === 'SENIOR' ? 'admin-badge-blue' : 'admin-badge-pastel'}`}>{item.level}</span></td>
                  <td>{branches.find((branch) => branch.id === item.branchId)?.name || '-'}</td>
                  <td>{item.serviceIds.length}</td>
                  <td>
                    <div className='admin-row'>
                      <button className='admin-btn admin-btn-ghost' onClick={() => onEditSpecialist(item)}>Sửa</button>
                      <button className='admin-btn admin-btn-danger' onClick={() => onDeleteSpecialist(item)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='admin-row admin-row-between'>
          <span className='admin-helper'>Hiển thị {pagedSpecialists.length}/{filteredSpecialists.length} chuyên viên</span>
          <div className='admin-row'>
            <button className='admin-btn admin-btn-ghost' disabled={safePage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Trước</button>
            <span className='admin-helper'>Trang {safePage}/{totalPages}</span>
            <button className='admin-btn admin-btn-ghost' disabled={safePage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>Sau</button>
          </div>
        </div>
      </section>
    </div>
  )
}
