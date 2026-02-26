import type { BranchesTabProps } from './types'

const textMap = {
  vi: {
    update: 'Cập nhật chi nhánh', create: 'Tạo chi nhánh mới', code: 'Mã chi nhánh', codePlaceholder: 'Tự động sinh từ tên chi nhánh', codeHelp: 'Mã được tự động tạo từ tên chi nhánh để đảm bảo chuẩn dữ liệu.',
    name: 'Tên chi nhánh', namePlaceholder: 'Nhập tên chi nhánh', address: 'Địa chỉ', addressPlaceholder: 'Nhập địa chỉ đầy đủ', phone: 'Số điện thoại', phoneHelp: 'Hỗ trợ định dạng số quốc tế (không giới hạn theo từng quốc gia).',
    active: 'Hoạt động (Active)', save: 'Lưu thay đổi', add: 'Thêm chi nhánh', cancel: 'Hủy', list: 'Danh sách chi nhánh', colName: 'Tên chi nhánh', colCode: 'Mã', colAddress: 'Địa chỉ', colPhone: 'Điện thoại', colStatus: 'Trạng thái', colAction: 'Thao tác', edit: 'Sửa chi nhánh', del: 'Xóa chi nhánh',
  },
  'en-US': {
    update: 'Update branch', create: 'Create new branch', code: 'Branch code', codePlaceholder: 'Auto-generated from branch name', codeHelp: 'Code is generated from branch name for data consistency.',
    name: 'Branch name', namePlaceholder: 'Enter branch name', address: 'Address', addressPlaceholder: 'Enter full address', phone: 'Phone number', phoneHelp: 'Supports international phone format (all countries).',
    active: 'Active', save: 'Save changes', add: 'Add branch', cancel: 'Cancel', list: 'Branch list', colName: 'Branch name', colCode: 'Code', colAddress: 'Address', colPhone: 'Phone', colStatus: 'Status', colAction: 'Actions', edit: 'Edit branch', del: 'Delete branch',
  },
  de: {
    update: 'Filiale aktualisieren', create: 'Neue Filiale erstellen', code: 'Filialcode', codePlaceholder: 'Automatisch aus Filialname', codeHelp: 'Code wird aus dem Filialnamen zur Datenkonsistenz erzeugt.',
    name: 'Filialname', namePlaceholder: 'Filialname eingeben', address: 'Adresse', addressPlaceholder: 'Vollständige Adresse eingeben', phone: 'Telefonnummer', phoneHelp: 'Unterstützt internationales Telefonformat (alle Länder).',
    active: 'Aktiv', save: 'Änderungen speichern', add: 'Filiale hinzufügen', cancel: 'Abbrechen', list: 'Filialliste', colName: 'Filialname', colCode: 'Code', colAddress: 'Adresse', colPhone: 'Telefon', colStatus: 'Status', colAction: 'Aktionen', edit: 'Filiale bearbeiten', del: 'Filiale löschen',
  },
} as const

export function BranchesTab({ lang = 'vi', branches, branchForm, editingBranch, onBranchFormChange, onSaveBranch, onEditBranch, onDeleteBranch, onCancelEdit }: BranchesTabProps) {
  const isEditing = Boolean(editingBranch)
  const t = textMap[lang]

  return (
    <div className='admin-grid'>
      <section className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'><i className='fa-solid fa-building' /> {isEditing ? t.update : t.create}</h3>
        <div className='admin-form-grid'>
          <label className='admin-field'>
            <span className='admin-label'><i className='fa-solid fa-id-card' /> {t.code}</span>
            <input className='admin-input' placeholder={t.codePlaceholder} value={branchForm.code || ''} readOnly />
            <small className='admin-helper'>{t.codeHelp}</small>
          </label>
          <label className='admin-field'>
            <span className='admin-label'><i className='fa-solid fa-tag' /> {t.name}</span>
            <input className='admin-input' placeholder={t.namePlaceholder} value={branchForm.name || ''} onChange={(e) => onBranchFormChange({ ...branchForm, name: e.target.value })} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'><i className='fa-solid fa-location-dot' /> {t.address}</span>
            <input className='admin-input' placeholder={t.addressPlaceholder} value={branchForm.address || ''} onChange={(e) => onBranchFormChange({ ...branchForm, address: e.target.value })} />
          </label>
          <label className='admin-field'>
            <span className='admin-label'><i className='fa-solid fa-phone' /> {t.phone}</span>
            <input className='admin-input' placeholder='+49 ...' value={branchForm.phone || ''} onChange={(e) => onBranchFormChange({ ...branchForm, phone: e.target.value })} />
            <small className='admin-helper'>{t.phoneHelp}</small>
          </label>
          <label className='admin-checkbox'>
            <input type='checkbox' checked={Boolean(branchForm.isActive ?? true)} onChange={(e) => onBranchFormChange({ ...branchForm, isActive: e.target.checked })} />
            <span className='admin-checkbox-slider' />
            <span className='admin-checkbox-label'>{t.active}</span>
          </label>
        </div>
        <div className='admin-row'>
          <button className={`admin-btn ${isEditing ? 'admin-btn-save' : 'admin-btn-primary'}`} onClick={onSaveBranch}>
            <i className={`fa-solid ${isEditing ? 'fa-floppy-disk' : 'fa-plus'}`} />
            {isEditing ? t.save : t.add}
          </button>
          {isEditing && <button className='admin-btn admin-btn-ghost' onClick={onCancelEdit}>{t.cancel}</button>}
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> {t.list}</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>{t.colName}</th><th>{t.colCode}</th><th>{t.colAddress}</th><th>{t.colPhone}</th><th>{t.colStatus}</th><th>{t.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td className='td-strong'>{branch.name}</td>
                  <td><span className='admin-badge admin-badge-purple'>{branch.code}</span></td>
                  <td>{branch.address}</td>
                  <td>{branch.phone || '-'}</td>
                  <td><span className={`admin-badge ${branch.isActive ? 'admin-badge-green' : 'admin-badge-red'}`}><i className={`fa-solid ${branch.isActive ? 'fa-circle-check' : 'fa-circle-xmark'}`} /></span></td>
                  <td>
                    <div className='admin-action-row'>
                      <button className='admin-btn-icon admin-btn-icon-edit' onClick={() => onEditBranch(branch)} aria-label={t.edit}><i className='fa-solid fa-pen-to-square' /></button>
                      <button className='admin-btn-icon admin-btn-icon-delete' onClick={() => onDeleteBranch(branch)} aria-label={t.del}><i className='fa-solid fa-trash-can' /></button>
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
