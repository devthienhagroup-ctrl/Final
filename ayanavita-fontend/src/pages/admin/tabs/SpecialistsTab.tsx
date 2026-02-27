import { useMemo, useRef, useState } from 'react'
import type { SpecialistsTabProps } from './types'
import { autoTranslateFromVietnamese, type LocaleMode } from './i18nForm'

const textMap = {
  vi: { update: 'Cập nhật chuyên viên', add: 'Thêm chuyên viên', name: 'Tên chuyên viên', email: 'Email tài khoản', branch: 'Chi nhánh', chooseBranch: 'Chọn chi nhánh', level: 'Cấp độ', bio: 'Bio', bioPlaceholder: 'Mô tả năng lực chuyên viên', branchServices: 'Dịch vụ theo chi nhánh', chooseBranchHelp: 'Vui lòng chọn chi nhánh để tải dịch vụ.', save: 'Lưu thay đổi', cancel: 'Hủy', list: 'Danh sách chuyên viên', searchName: 'Tìm tên', searchPlaceholder: 'Nhập tên chuyên viên', perPage: '/Trang', colName: 'Tên', colEmail: 'Email', colLevel: 'Cấp độ', colBranch: 'Chi nhánh', colServices: 'Dịch vụ', colAction: 'Thao tác', edit: 'Sửa', del: 'Xóa', showing: 'Hiển thị', specialists: 'chuyên viên', prev: 'Trước', page: 'Trang', next: 'Sau', reset: 'Làm mới', localeHint: 'Mặc định nhập tiếng Việt, hệ thống tự dịch sang Anh/Đức. Khi lưu vui lòng kiểm tra lại bản dịch.' },
  'en': { update: 'Update specialist', add: 'Add specialist', name: 'Specialist name', email: 'Account email', branch: 'Branch', chooseBranch: 'Select branch', level: 'Level', bio: 'Bio', bioPlaceholder: 'Describe specialist capabilities', branchServices: 'Services by branch', chooseBranchHelp: 'Select a branch to load services.', save: 'Save changes', cancel: 'Cancel', list: 'Specialist list', searchName: 'Search name', searchPlaceholder: 'Enter specialist name', perPage: '/Page', colName: 'Name', colEmail: 'Email', colLevel: 'Level', colBranch: 'Branch', colServices: 'Services', colAction: 'Actions', edit: 'Edit', del: 'Delete', showing: 'Showing', specialists: 'specialists', prev: 'Prev', page: 'Page', next: 'Next', reset: 'Reset', localeHint: 'Default input is Vietnamese; the system auto-translates to English/German. Please review translations before saving.' },
  de: { update: 'Spezialist aktualisieren', add: 'Spezialist hinzufügen', name: 'Name des Spezialisten', email: 'Konto-E-Mail', branch: 'Filiale', chooseBranch: 'Filiale wählen', level: 'Stufe', bio: 'Bio', bioPlaceholder: 'Fähigkeiten des Spezialisten beschreiben', branchServices: 'Leistungen nach Filiale', chooseBranchHelp: 'Bitte Filiale wählen, um Leistungen zu laden.', save: 'Änderungen speichern', cancel: 'Abbrechen', list: 'Spezialistenliste', searchName: 'Name suchen', searchPlaceholder: 'Name des Spezialisten eingeben', perPage: '/Seite', colName: 'Name', colEmail: 'E-Mail', colLevel: 'Stufe', colBranch: 'Filiale', colServices: 'Leistungen', colAction: 'Aktionen', edit: 'Bearbeiten', del: 'Löschen', showing: 'Anzeige', specialists: 'Spezialisten', prev: 'Zurück', page: 'Seite', next: 'Weiter', reset: 'Zurücksetzen', localeHint: 'Standardmäßig auf Vietnamesisch eingeben; das System übersetzt automatisch nach Englisch/Deutsch. Bitte Übersetzungen vor dem Speichern prüfen.' },
} as const

const locales: LocaleMode[] = ['vi', 'en', 'de']
const emptySpecialistLocale = { name: '', bio: '' }

export function SpecialistsTab({ lang = 'vi', branches, services, specialists, specialistForm, editingSpecialist, onSpecialistFormChange, onSaveSpecialist, onEditSpecialist, onDeleteSpecialist, onCancelEdit }: SpecialistsTabProps) {
  const t = textMap[lang]
  const [mode, setMode] = useState<LocaleMode>('vi')
  const translateReqRef = useRef(0)
  const translations = specialistForm.translations || {}
  const currentLocaleValue = translations[mode] || emptySpecialistLocale

  const updateLocalizedField = (field: 'name' | 'bio', value: string) => {
    const nextTranslations = { ...translations, [mode]: { ...currentLocaleValue, [field]: value } }
    const nextForm = { ...specialistForm, translations: nextTranslations }

    if (mode === 'vi') {
      translateReqRef.current += 1
      const reqId = translateReqRef.current
      onSpecialistFormChange({ ...nextForm, [field]: value })
      void Promise.all([autoTranslateFromVietnamese(value, 'en'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => {
        if (reqId !== translateReqRef.current) return
        onSpecialistFormChange({
          ...nextForm,
          translations: {
            ...nextTranslations,
            'en': { ...(nextTranslations['en'] || emptySpecialistLocale), [field]: en },
            de: { ...(nextTranslations.de || emptySpecialistLocale), [field]: de },
          },
        })
      })
      return
    }

    onSpecialistFormChange(nextForm)
  }
  const branchServices = specialistForm.branchId ? services.filter((service) => service.branchIds.includes(specialistForm.branchId)) : []
  const toggleService = (serviceId: number) => {
    const exists = specialistForm.serviceIds.includes(serviceId)
    onSpecialistFormChange({ ...specialistForm, serviceIds: exists ? specialistForm.serviceIds.filter((item) => item !== serviceId) : [...specialistForm.serviceIds, serviceId] })
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
        <h3 className='admin-card-title'><i className='fa-solid fa-user-nurse' /> {editingSpecialist ? t.update : t.add}</h3>
        <div className='admin-row'>{locales.map((l) => <button key={l} className={`admin-btn ${mode===l?'admin-btn-primary':'admin-btn-ghost'}`} onClick={() => setMode(l)}>{l}</button>)}</div>
        <p className='admin-helper'>{t.localeHint}</p>
        <div className='admin-form-grid'>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-user' /> {t.name} ({mode})</span><input className='admin-input' placeholder={t.name} value={currentLocaleValue.name} onChange={(e) => updateLocalizedField('name', e.target.value)} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-envelope' /> {t.email}</span><input className='admin-input' type='email' placeholder='staff@example.com' value={specialistForm.email} onChange={(e) => onSpecialistFormChange({ ...specialistForm, email: e.target.value })} /></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-building' /> {t.branch}</span><select className='admin-input' value={specialistForm.branchId} onChange={(e) => onSpecialistFormChange({ ...specialistForm, branchId: Number(e.target.value), serviceIds: [] })}><option value={0}>{t.chooseBranch}</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label className='admin-field'><span className='admin-label'><i className='fa-solid fa-medal' /> {t.level}</span><select className='admin-input' value={specialistForm.level} onChange={(e) => onSpecialistFormChange({ ...specialistForm, level: e.target.value })}><option value='THERAPIST'>THERAPIST</option><option value='SENIOR'>SENIOR</option><option value='EXPERT'>EXPERT</option></select></label>
          <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-address-card' /> {t.bio}</span><textarea className='admin-input admin-textarea' placeholder={t.bioPlaceholder} value={currentLocaleValue.bio} onChange={(e) => updateLocalizedField('bio', e.target.value)} /></label>

          <div className='admin-field admin-field-full'>
            <span className='admin-label'><i className='fa-solid fa-list-check' /> {t.branchServices}</span>
            <div className='admin-multi-select'>
              {branchServices.length > 0 ? branchServices.map((service) => (
                <label key={service.id} className='admin-checkbox-row'>
                  <input type='checkbox' checked={specialistForm.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} />
                  <span>{service.name}</span>
                </label>
              )) : <span className='admin-helper'>{t.chooseBranchHelp}</span>}
            </div>
          </div>
        </div>
        <div className='admin-row'>
          <button className='admin-btn admin-btn-primary' onClick={onSaveSpecialist}>{editingSpecialist ? t.save : t.add}</button>
          <button className='admin-btn admin-btn-ghost' onClick={onCancelEdit}>{editingSpecialist ? t.cancel : t.reset}</button>
        </div>
      </section>

      <section className='admin-card'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> {t.list}</h3>
        <div className='admin-row admin-row-between admin-filter-toolbar'>
          <label className='admin-field-inline'>
            <span className='admin-label'><i className='fa-solid fa-magnifying-glass' /> {t.searchName}</span>
            <input className='admin-input admin-input-sm' placeholder={t.searchPlaceholder} value={searchName} onChange={(e) => { setSearchName(e.target.value); setPage(1) }} />
          </label>

          <label className='admin-field-inline'>
            <span className='admin-label'><i className='fa-solid fa-list-ol' /> {t.perPage}</span>
            <select className='admin-input admin-input-sm' value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
              <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
            </select>
          </label>
        </div>

        <div className='admin-table-wrap' >
          <table className='admin-table'>
            <thead><tr><th>{t.colName}</th><th>{t.colEmail}</th><th>{t.colLevel}</th><th>{t.colBranch}</th><th>{t.colServices}</th><th>{t.colAction}</th></tr></thead>
            <tbody>
              {pagedSpecialists.map((item) => (
                <tr key={item.id}>
                  <td className='td-strong'>{item.name}</td><td>{item.email}</td>
                  <td><span className={`admin-badge ${item.level === 'EXPERT' ? 'admin-badge-purple' : item.level === 'SENIOR' ? 'admin-badge-blue' : 'admin-badge-pastel'}`}>{item.level}</span></td>
                  <td>{branches.find((branch) => branch.id === item.branchId)?.name || '-'}</td><td>{item.serviceIds.length}</td>
                  <td><div className='admin-row'><button className='admin-btn admin-btn-ghost' onClick={() => onEditSpecialist(item)}>{t.edit}</button><button className='admin-btn admin-btn-danger' onClick={() => onDeleteSpecialist(item)}>{t.del}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='admin-row admin-row-between'>
          <span className='admin-helper'>{t.showing} {pagedSpecialists.length}/{filteredSpecialists.length} {t.specialists}</span>
          <div className='admin-row'>
            <button className='admin-btn admin-btn-ghost' disabled={safePage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>{t.prev}</button>
            <span className='admin-helper'>{t.page} {safePage}/{totalPages}</span>
            <button className='admin-btn admin-btn-ghost' disabled={safePage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>{t.next}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
