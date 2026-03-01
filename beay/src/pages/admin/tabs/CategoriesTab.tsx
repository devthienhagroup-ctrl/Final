import { useRef, useState } from 'react'
import type { CategoriesTabProps } from './types'
import { autoTranslateFromVietnamese, type LocaleMode } from './i18nForm'

const textMap = {
  vi: {
    update: 'Cập nhật danh mục', create: 'Tạo danh mục mới', localeHint: 'Mặc định nhập tiếng Việt, hệ thống tự dịch sang Anh/Đức. Khi lưu vui lòng kiểm tra lại bản dịch.',
    name: 'Tên danh mục', save: 'Lưu thay đổi', add: 'Thêm danh mục', cancel: 'Hủy', reset: 'Làm mới', list: 'Danh sách danh mục',
    colName: 'Tên', colCount: 'SL dịch vụ', colAction: 'Thao tác', edit: 'Sửa', del: 'Xóa', disabledDelete: 'Danh mục đang có dịch vụ, không thể xóa.',
  },
  en: {
    update: 'Update category', create: 'Create new category', localeHint: 'Default input is Vietnamese; the system auto-translates to English/German. Please review translations before saving.',
    name: 'Category name', save: 'Save changes', add: 'Add category', cancel: 'Cancel', reset: 'Reset', list: 'Category list',
    colName: 'Name', colCount: 'Service count', colAction: 'Actions', edit: 'Edit', del: 'Delete', disabledDelete: 'This category has services and cannot be deleted.',
  },
  de: {
    update: 'Kategorie aktualisieren', create: 'Neue Kategorie erstellen', localeHint: 'Standardmäßig auf Vietnamesisch eingeben; das System übersetzt automatisch nach Englisch/Deutsch. Bitte Übersetzungen vor dem Speichern prüfen.',
    name: 'Kategoriename', save: 'Änderungen speichern', add: 'Kategorie hinzufügen', cancel: 'Abbrechen', reset: 'Zurücksetzen', list: 'Kategorieliste',
    colName: 'Name', colCount: 'Anzahl Leistungen', colAction: 'Aktionen', edit: 'Bearbeiten', del: 'Löschen', disabledDelete: 'Diese Kategorie enthält Leistungen und kann nicht gelöscht werden.',
  },
} as const

export function CategoriesTab({ lang = 'vi', categories, categoryForm, editingCategory, onCategoryFormChange, onSaveCategory, onEditCategory, onDeleteCategory, onCancelEdit }: CategoriesTabProps) {
  const t = textMap[lang]
  const [mode, setMode] = useState<LocaleMode>('vi')
  const translateReqRef = useRef(0)
  const trans = categoryForm.translations || {}
  const value = trans[mode]?.name || ''

  const onChangeName = (name: string) => {
    const next = { ...trans, [mode]: { name } }
    const base = { ...categoryForm, name: mode === 'vi' ? name : categoryForm.name, translations: next }
    onCategoryFormChange(base)
    if (mode === 'vi') {
      translateReqRef.current += 1
      const reqId = translateReqRef.current
      void Promise.all([autoTranslateFromVietnamese(name, 'en'), autoTranslateFromVietnamese(name, 'de')]).then(([en, de]) => {
        if (reqId !== translateReqRef.current) return
        onCategoryFormChange({ ...base, translations: { ...next, 'en': { name: en }, de: { name: de } } })
      })
    }
  }

  const handleReset = () => {
    translateReqRef.current += 1
    onCancelEdit()
  }

  return <div className='admin-grid'><section className='admin-card admin-card-glow'>
    <h3 className='admin-card-title'>{editingCategory ? t.update : t.create}</h3>
    <div className='admin-row'><button className={`admin-btn ${mode==='vi'?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode('vi')}>VI</button><button className={`admin-btn ${mode==='en'?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode('en')}>EN</button><button className={`admin-btn ${mode==='de'?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode('de')}>DE</button></div>
    <p className='admin-helper'>{t.localeHint}</p>
    <label className='admin-field'><span className='admin-label'>{t.name} ({mode})</span><input className='admin-input' value={value} onChange={(e)=>onChangeName(e.target.value)} /></label>
    <div className='admin-row'><button className='admin-btn admin-btn-primary' onClick={onSaveCategory}>{editingCategory ? t.save : t.add}</button><button className='admin-btn admin-btn-ghost' onClick={handleReset}>{editingCategory ? t.cancel : t.reset}</button></div>
  </section>
  <section className='admin-card'><h3 className='admin-card-title'>{t.list}</h3><table className='admin-table'><thead><tr><th>{t.colName}</th><th>{t.colCount}</th><th>{t.colAction}</th></tr></thead><tbody>{categories.map((item)=>{const cannotDelete = item.serviceCount > 0
  return <tr key={item.id}><td>{item.name}</td><td>{item.serviceCount}</td><td><div className='admin-row admin-row-nowrap'><button className='admin-btn admin-btn-ghost' onClick={()=>onEditCategory(item)}>{t.edit}</button><button className='admin-btn admin-btn-danger' onClick={()=>onDeleteCategory(item)} disabled={cannotDelete} title={cannotDelete ? t.disabledDelete : undefined}>{t.del}</button></div></td></tr>})}</tbody></table></section></div>
}
