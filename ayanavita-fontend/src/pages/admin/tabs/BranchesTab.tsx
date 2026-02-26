import { useRef, useState } from 'react'
import type { BranchesTabProps } from './types'
import { autoTranslateFromVietnamese, type LocaleMode } from './i18nForm'

const locales: LocaleMode[] = ['vi', 'en-US', 'de']

export function BranchesTab({ lang = 'vi', branches, branchForm, editingBranch, onBranchFormChange, onSaveBranch, onEditBranch, onDeleteBranch, onCancelEdit }: BranchesTabProps) {
  const [mode, setMode] = useState<LocaleMode>('vi')
  const translateReqRef = useRef(0)
  const trans = branchForm.translations || {}
  const current = trans[mode] || { name: '', address: '' }

  const updateLocalized = (field: 'name' | 'address', value: string) => {
    const nextTranslations = { ...trans, [mode]: { ...current, [field]: value } }
    const nextForm = { ...branchForm, translations: nextTranslations }
    if (mode === 'vi') {
      translateReqRef.current += 1
      const reqId = translateReqRef.current
      onBranchFormChange({ ...nextForm, [field]: value })
      void Promise.all([autoTranslateFromVietnamese(value, 'en-US'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => {
        if (reqId !== translateReqRef.current) return
        onBranchFormChange({
          ...nextForm,
          translations: {
            ...nextTranslations,
            'en-US': { ...(nextTranslations['en-US'] || { name: '', address: '' }), [field]: en },
            de: { ...(nextTranslations.de || { name: '', address: '' }), [field]: de },
          },
        })
      })
      return
    }
    onBranchFormChange(nextForm)
  }

  const handleReset = () => {
    translateReqRef.current += 1
    onCancelEdit()
  }

  return <div className='admin-grid'><section className='admin-card admin-card-glow'>
    <h3 className='admin-card-title'>{editingBranch ? 'Cập nhật chi nhánh' : 'Tạo chi nhánh mới'}</h3>
    <div className='admin-row'>{locales.map((l)=><button key={l} className={`admin-btn ${mode===l?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode(l)}>{l}</button>)}</div>
    <p className='admin-helper'>Mặc định nhập tiếng Việt, hệ thống tự dịch sang Anh/Đức. Khi lưu vui lòng kiểm tra lại bản dịch.</p>
    <div className='admin-form-grid'>
      <label className='admin-field'><span className='admin-label'>Mã chi nhánh</span><input className='admin-input' value={branchForm.code || ''} readOnly /></label>
      <label className='admin-field'><span className='admin-label'>Tên chi nhánh ({mode})</span><input className='admin-input' value={current.name} onChange={(e)=>updateLocalized('name', e.target.value)} /></label>
      <label className='admin-field'><span className='admin-label'>Địa chỉ ({mode})</span><input className='admin-input' value={current.address} onChange={(e)=>updateLocalized('address', e.target.value)} /></label>
      <label className='admin-field'><span className='admin-label'>Số điện thoại</span><input className='admin-input' value={branchForm.phone || ''} onChange={(e)=>onBranchFormChange({ ...branchForm, phone: e.target.value })} /></label>
    </div>
    <label className='admin-checkbox admin-branch-status-toggle'>
      <input type='checkbox' checked={Boolean(branchForm.isActive)} onChange={(e)=>onBranchFormChange({ ...branchForm, isActive: e.target.checked })} />
      <span className='admin-checkbox-slider' />
      <span className='admin-checkbox-label'>{branchForm.isActive ? 'Đang hoạt động' : 'Đang tắt'}</span>
    </label>
    <div className='admin-row'><button className='admin-btn admin-btn-primary' onClick={onSaveBranch}>{editingBranch ? 'Lưu thay đổi' : 'Thêm chi nhánh'}</button><button className='admin-btn admin-btn-ghost' onClick={handleReset}>{editingBranch ? 'Hủy' : 'Làm mới'}</button></div>
  </section>
  <section className='admin-card'><h3 className='admin-card-title'>Danh sách chi nhánh</h3><div className='admin-table-wrap'><table className='admin-table'><thead><tr><th>Tên</th><th>Mã</th><th>Địa chỉ</th><th>Điện thoại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{branches.map((branch)=>{const cannotDelete = !branch.isActive
  return <tr key={branch.id}><td>{branch.name}</td><td>{branch.code}</td><td>{branch.address}</td><td>{branch.phone||'-'}</td><td><span className={`services-status-icon ${branch.isActive ? 'is-active' : 'is-inactive'}`} title={branch.isActive ? 'Đang hoạt động' : 'Đang tắt'}><i className={`fa-solid ${branch.isActive ? 'fa-circle-check' : 'fa-circle-xmark'}`} /></span></td><td><div className='admin-row admin-row-nowrap'><button className='admin-btn admin-btn-ghost' onClick={()=>onEditBranch(branch)}>Sửa</button><button className='admin-btn admin-btn-danger' onClick={()=>onDeleteBranch(branch)} disabled={cannotDelete} title={cannotDelete ? 'Chi nhánh đã ngưng hoạt động, không thể xóa thêm.' : undefined}>Xóa</button></div></td></tr>})}</tbody></table></div></section></div>
}
