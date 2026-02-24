import type { BranchesTabProps } from './types'

export function BranchesTab({ branches, branchForm, editingBranch, onBranchFormChange, onSaveBranch, onEditBranch, onDeleteBranch, onCancelEdit }: BranchesTabProps) {
  return (
    <div className='admin-grid'>
      <section className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'>🏢 {editingBranch ? 'Cập nhật chi nhánh' : 'Tạo chi nhánh mới'}</h3>
        <div className='admin-form-grid'>
          <label className='admin-field'>
            <span className='admin-label'>🆔 Mã chi nhánh</span>
            <input className='admin-input' placeholder='VD: DE_BERLIN' value={branchForm.code || ''} onChange={(e) => onBranchFormChange({ ...branchForm, code: e.target.value })} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'>🏷️ Tên chi nhánh</span>
            <input className='admin-input' placeholder='Nhập tên chi nhánh' value={branchForm.name || ''} onChange={(e) => onBranchFormChange({ ...branchForm, name: e.target.value })} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'>📍 Địa chỉ</span>
            <input className='admin-input' placeholder='Nhập địa chỉ đầy đủ' value={branchForm.address || ''} onChange={(e) => onBranchFormChange({ ...branchForm, address: e.target.value })} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'>📞 Số điện thoại</span>
            <input className='admin-input' placeholder='+49 ...' value={branchForm.phone || ''} onChange={(e) => onBranchFormChange({ ...branchForm, phone: e.target.value })} />
          </label>
          <label className='admin-checkbox'>
            <input type='checkbox' checked={Boolean(branchForm.isActive ?? true)} onChange={(e) => onBranchFormChange({ ...branchForm, isActive: e.target.checked })} />
            ✅ Hoạt động (Active)
          </label>
        </div>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-primary' onClick={onSaveBranch}>{editingBranch ? 'Lưu thay đổi' : 'Thêm chi nhánh'}</button>
          {editingBranch && <button className='admin-btn admin-btn-ghost' onClick={onCancelEdit}>Hủy</button>}
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'>📋 Danh sách chi nhánh</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>Tên chi nhánh</th>
                <th>Mã</th>
                <th>Địa chỉ</th>
                <th>Điện thoại</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td className='td-strong'>{branch.name}</td>
                  <td><span className='admin-badge admin-badge-purple'>{branch.code}</span></td>
                  <td>{branch.address}</td>
                  <td>{branch.phone || '-'}</td>
                  <td>
                    <span className={`admin-badge ${branch.isActive ? 'admin-badge-green' : 'admin-badge-red'}`}>
                      {branch.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>
                    <div className='admin-row'>
                      <button className='admin-btn admin-btn-ghost' onClick={() => onEditBranch(branch)}>Sửa</button>
                      <button className='admin-btn admin-btn-danger' onClick={() => onDeleteBranch(branch)}>Xóa / Tắt</button>
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
