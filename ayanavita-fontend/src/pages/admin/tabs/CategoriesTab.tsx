import type { CategoriesTabProps } from './types'

const textMap = {
  vi: { update: 'Cập nhật danh mục dịch vụ', create: 'Tạo danh mục dịch vụ', name: 'Tên danh mục', namePlaceholder: 'VD: Chăm sóc da', save: 'Lưu thay đổi', add: 'Thêm danh mục', cancel: 'Hủy', list: 'Danh sách danh mục', colName: 'Tên danh mục', colCount: 'Số dịch vụ', colAction: 'Thao tác', edit: 'Sửa', del: 'Xóa', disabledDelete: 'Danh mục đang có dịch vụ nên không thể xóa', deleteTitle: 'Xóa danh mục' },
  'en-US': { update: 'Update service category', create: 'Create service category', name: 'Category name', namePlaceholder: 'Ex: Skin care', save: 'Save changes', add: 'Add category', cancel: 'Cancel', list: 'Category list', colName: 'Category name', colCount: 'Service count', colAction: 'Actions', edit: 'Edit', del: 'Delete', disabledDelete: 'Cannot delete category with services', deleteTitle: 'Delete category' },
  de: { update: 'Leistungskategorie aktualisieren', create: 'Leistungskategorie erstellen', name: 'Kategoriename', namePlaceholder: 'Bsp: Hautpflege', save: 'Änderungen speichern', add: 'Kategorie hinzufügen', cancel: 'Abbrechen', list: 'Kategorieliste', colName: 'Kategoriename', colCount: 'Anzahl Leistungen', colAction: 'Aktionen', edit: 'Bearbeiten', del: 'Löschen', disabledDelete: 'Kategorie mit Leistungen kann nicht gelöscht werden', deleteTitle: 'Kategorie löschen' },
} as const

export function CategoriesTab({ lang = 'vi', categories, categoryForm, editingCategory, onCategoryFormChange, onSaveCategory, onEditCategory, onDeleteCategory, onCancelEdit }: CategoriesTabProps) {
  const t = textMap[lang]
  return (
    <div className='admin-grid'>
      <section className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'><i className='fa-solid fa-layer-group' /> {editingCategory ? t.update : t.create}</h3>
        <div className='admin-form-grid'>
          <label className='admin-field'><span className='admin-label'>{t.name}</span><input className='admin-input' placeholder={t.namePlaceholder} value={categoryForm.name} onChange={(e) => onCategoryFormChange({ ...categoryForm, name: e.target.value })} /></label>
        </div>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-primary' onClick={onSaveCategory}>{editingCategory ? t.save : t.add}</button>
          {editingCategory && <button className='admin-btn admin-btn-ghost' onClick={onCancelEdit}>{t.cancel}</button>}
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> {t.list}</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead><tr><th>{t.colName}</th><th>{t.colCount}</th><th>{t.colAction}</th></tr></thead>
            <tbody>
              {categories.map((category) => {
                const hasServices = category.serviceCount > 0
                const deleteButtonClass = hasServices ? 'admin-btn admin-btn-ghost' : 'admin-btn admin-btn-danger'
                return (
                  <tr key={category.id}>
                    <td className='td-strong'>{category.name}</td>
                    <td>{category.serviceCount}</td>
                    <td>
                      <div className='admin-row'>
                        <button className='admin-btn admin-btn-ghost' onClick={() => onEditCategory(category)}>{t.edit}</button>
                        <button className={deleteButtonClass} onClick={() => onDeleteCategory(category)} disabled={hasServices} title={hasServices ? t.disabledDelete : t.deleteTitle}>{t.del}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
