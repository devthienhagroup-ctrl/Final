import { useRef, useState } from 'react'
import type { CategoriesTabProps } from './types'
import { autoTranslateFromVietnamese, type LocaleMode } from './i18nForm'

export function CategoriesTab({ categories, categoryForm, editingCategory, onCategoryFormChange, onSaveCategory, onEditCategory, onDeleteCategory, onCancelEdit }: CategoriesTabProps) {
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
    <h3 className='admin-card-title'>{editingCategory ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}</h3>
    <div className='admin-row'><button className={`admin-btn ${mode==='vi'?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode('vi')}>VI</button><button className={`admin-btn ${mode==='en'?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode('en')}>EN</button><button className={`admin-btn ${mode==='de'?'admin-btn-primary':'admin-btn-ghost'}`} onClick={()=>setMode('de')}>DE</button></div>
    <p className='admin-helper'>Mặc định nhập tiếng Việt, hệ thống tự dịch sang Anh/Đức. Khi lưu vui lòng kiểm tra lại bản dịch.</p>
    <label className='admin-field'><span className='admin-label'>Tên danh mục ({mode})</span><input className='admin-input' value={value} onChange={(e)=>onChangeName(e.target.value)} /></label>
    <div className='admin-row'><button className='admin-btn admin-btn-primary' onClick={onSaveCategory}>{editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}</button><button className='admin-btn admin-btn-ghost' onClick={handleReset}>{editingCategory ? 'Hủy' : 'Làm mới'}</button></div>
  </section>
  <section className='admin-card'><h3 className='admin-card-title'>Danh sách danh mục</h3><table className='admin-table'><thead><tr><th>Tên</th><th>SL dịch vụ</th><th>Thao tác</th></tr></thead><tbody>{categories.map((item)=>{const cannotDelete = item.serviceCount > 0
  return <tr key={item.id}><td>{item.name}</td><td>{item.serviceCount}</td><td><div className='admin-row admin-row-nowrap'><button className='admin-btn admin-btn-ghost' onClick={()=>onEditCategory(item)}>Sửa</button><button className='admin-btn admin-btn-danger' onClick={()=>onDeleteCategory(item)} disabled={cannotDelete} title={cannotDelete ? 'Danh mục đang có dịch vụ, không thể xóa.' : undefined}>Xóa</button></div></td></tr>})}</tbody></table></section></div>
}
