import { useRef, useState } from 'react'
import type { BranchesTabProps } from './types'
import { autoTranslateFromVietnamese, type LocaleMode } from './i18nForm'

const locales: LocaleMode[] = ['vi', 'en', 'de']

const textMap = {
  vi: {
    update: 'Cập nhật chi nhánh', create: 'Tạo chi nhánh mới', localeHint: 'Mặc định nhập tiếng Việt, hệ thống tự dịch sang Anh/Đức. Khi lưu vui lòng kiểm tra lại bản dịch.',
    code: 'Mã chi nhánh', name: 'Tên chi nhánh', address: 'Địa chỉ', phone: 'Số điện thoại', active: 'Đang hoạt động', inactive: 'Đang tắt',
    save: 'Lưu thay đổi', add: 'Thêm chi nhánh', cancel: 'Hủy', reset: 'Làm mới', list: 'Danh sách chi nhánh', colName: 'Tên', colCode: 'Mã', colAddress: 'Địa chỉ', colPhone: 'Điện thoại', colStatus: 'Trạng thái', colAction: 'Thao tác',
    edit: 'Sửa', del: 'Xóa', disabledDelete: 'Chi nhánh đã ngưng hoạt động, không thể xóa thêm.',
  },
  en: {
    update: 'Update branch', create: 'Create new branch', localeHint: 'Default input is Vietnamese; the system auto-translates to English/German. Please review translations before saving.',
    code: 'Branch code', name: 'Branch name', address: 'Address', phone: 'Phone number', active: 'Active', inactive: 'Inactive',
    save: 'Save changes', add: 'Add branch', cancel: 'Cancel', reset: 'Reset', list: 'Branch list', colName: 'Name', colCode: 'Code', colAddress: 'Address', colPhone: 'Phone', colStatus: 'Status', colAction: 'Actions',
    edit: 'Edit', del: 'Delete', disabledDelete: 'This branch is inactive and cannot be deleted.',
  },
  de: {
    update: 'Filiale aktualisieren', create: 'Neue Filiale erstellen', localeHint: 'Standardmäßig auf Vietnamesisch eingeben; das System übersetzt automatisch nach Englisch/Deutsch. Bitte Übersetzungen vor dem Speichern prüfen.',
    code: 'Filialcode', name: 'Filialname', address: 'Adresse', phone: 'Telefonnummer', active: 'Aktiv', inactive: 'Inaktiv',
    save: 'Änderungen speichern', add: 'Filiale hinzufügen', cancel: 'Abbrechen', reset: 'Zurücksetzen', list: 'Filialliste', colName: 'Name', colCode: 'Code', colAddress: 'Adresse', colPhone: 'Telefon', colStatus: 'Status', colAction: 'Aktionen',
    edit: 'Bearbeiten', del: 'Löschen', disabledDelete: 'Diese Filiale ist inaktiv und kann nicht gelöscht werden.',
  },
} as const

export function BranchesTab({ lang = 'vi', branches, branchForm, editingBranch, onBranchFormChange, onSaveBranch, onEditBranch, onDeleteBranch, onCancelEdit }: BranchesTabProps) {
  const t = textMap[lang]
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
      void Promise.all([autoTranslateFromVietnamese(value, 'en'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => {
        if (reqId !== translateReqRef.current) return
        onBranchFormChange({
          ...nextForm,
          translations: {
            ...nextTranslations,
            'en': { ...(nextTranslations['en'] || { name: '', address: '' }), [field]: en },
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
    <h3 className='admin-card-title'>{editingBranch ? t.update : t.create}</h3>
    <div className='admin-row'>{locales.map((l)=><button key={l} className={`admin-btn ${mode===l?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode(l)}>{l}</button>)}</div>
    <p className='admin-helper'>{t.localeHint}</p>
    <div className='admin-form-grid'>
      <label className='admin-field'><span className='admin-label'>{t.code}</span><input className='admin-input' value={branchForm.code || ''} readOnly /></label>
      <label className='admin-field'><span className='admin-label'>{t.name} ({mode})</span><input className='admin-input' value={current.name} onChange={(e)=>updateLocalized('name', e.target.value)} /></label>
      <label className='admin-field'><span className='admin-label'>{t.address} ({mode})</span><input className='admin-input' value={current.address} onChange={(e)=>updateLocalized('address', e.target.value)} /></label>
      <label className='admin-field'><span className='admin-label'>{t.phone}</span><input className='admin-input' value={branchForm.phone || ''} onChange={(e)=>onBranchFormChange({ ...branchForm, phone: e.target.value })} /></label>
    </div>
    <label className='admin-checkbox admin-branch-status-toggle'>
      <input type='checkbox' checked={Boolean(branchForm.isActive)} onChange={(e)=>onBranchFormChange({ ...branchForm, isActive: e.target.checked })} />
      <span className='admin-checkbox-slider' />
      <span className='admin-checkbox-label'>{branchForm.isActive ? t.active : t.inactive}</span>
    </label>
    <div className='admin-row'><button className='admin-btn admin-btn-primary' onClick={onSaveBranch}>{editingBranch ? t.save : t.add}</button><button className='admin-btn admin-btn-ghost' onClick={handleReset}>{editingBranch ? t.cancel : t.reset}</button></div>
  </section>
  <section className='admin-card'><h3 className='admin-card-title'>{t.list}</h3><div className='admin-table-wrap'><table className='admin-table'><thead><tr><th>{t.colName}</th><th>{t.colCode}</th><th>{t.colAddress}</th><th>{t.colPhone}</th><th>{t.colStatus}</th><th>{t.colAction}</th></tr></thead><tbody>{branches.map((branch)=>{const cannotDelete = !branch.isActive
  return <tr key={branch.id}><td>{branch.name}</td><td>{branch.code}</td><td>{branch.address}</td><td>{branch.phone||'-'}</td><td><span className={`services-status-icon ${branch.isActive ? 'is-active' : 'is-inactive'}`} title={branch.isActive ? t.active : t.inactive}><i className={`fa-solid ${branch.isActive ? 'fa-circle-check' : 'fa-circle-xmark'}`} /></span></td><td><div className='admin-row admin-row-nowrap'><button className='admin-btn admin-btn-ghost' onClick={()=>onEditBranch(branch)}>{t.edit}</button><button className='admin-btn admin-btn-danger' onClick={()=>onDeleteBranch(branch)} disabled={cannotDelete} title={cannotDelete ? t.disabledDelete : undefined}>{t.del}</button></div></td></tr>})}</tbody></table></div></section></div>
}
