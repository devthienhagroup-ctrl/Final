import { useEffect, useMemo, useRef, useState } from 'react'
import { spaAdminApi, type Branch, type SpaService, type Specialist } from '../../../api/spaAdmin.api'
import type { ServicesTabProps } from './types'
import { autoTranslateFromVietnamese, type LocaleMode } from './i18nForm'

const renderJsonPreview = (items: string[], badgeClass: string, extraBadgeClass: string) => {
  if (!items?.length) return '-'
  const [first, ...rest] = items
  return (
    <div className='admin-row admin-row-nowrap'>
      <span className={`admin-badge admin-badge-ellipsis ${badgeClass}`} title={first}>{first}</span>
      {rest.length > 0 && <span className={`admin-badge ${extraBadgeClass}`}>+{rest.length}</span>}
    </div>
  )
}

const pageSizeOptions = [5, 10, 20, 50]
const locales: LocaleMode[] = ['vi', 'en', 'de']
const emptyServiceLocale = { name: '', description: '', goals: '', suitableFor: '', process: '', tag: '' }
const textMap = {
  vi: {
    title: 'Quản lý dịch vụ', add: 'Thêm dịch vụ', searchLabel: 'Tìm tên dịch vụ', searchPlaceholder: 'Nhập tên dịch vụ...', perPage: 'Số mục/trang', perPageSuffix: '/ trang',
    noData: 'Không có dữ liệu', create: 'Tạo dịch vụ mới', edit: 'Chỉnh sửa dịch vụ', close: 'Đóng', requiredHint: 'là thông tin bắt buộc.',
    localeHint: 'Mặc định nhập tiếng Việt, hệ thống tự dịch sang Anh/Đức. Khi lưu vui lòng kiểm tra lại bản dịch.',
    serviceName: 'Tên dịch vụ', category: 'Danh mục', chooseCategory: 'Chọn danh mục', duration: 'Thời lượng (phút)', price: 'Giá (VNĐ)', tag: 'Nhãn hiển thị', status: 'Trạng thái hoạt động',
    active: 'Đang hoạt động', inactive: 'Đang tắt', branchApplied: 'Chi nhánh áp dụng', branchDisabledHint: 'Chi nhánh đang tắt sẽ không thể chọn.',
    goals: 'Mục tiêu', suitableFor: 'Phù hợp với', process: 'Quy trình', description: 'Mô tả', uploadImage: 'Upload ảnh',
    selectedImage: 'Đã chọn', save: 'Lưu thay đổi', addService: 'Thêm dịch vụ', cancel: 'Hủy',
    colName: 'Tên dịch vụ', colCategory: 'Danh mục', colDuration: 'Thời lượng', colPrice: 'Giá', colRating: 'Đánh giá', colBooked: 'Lượt đặt', colGoals: 'Mục tiêu', colSuitable: 'Phù hợp', colStatus: 'Trạng thái', colAction: 'Thao tác',
    details: 'Chi tiết', editAction: 'Sửa', deleteAction: 'Xóa', noMatched: 'Không có dịch vụ phù hợp.', showing: 'Hiển thị', prev: 'Trước', next: 'Sau', page: 'Trang',
  },
  'en': {
    title: 'Service management', add: 'Add service', searchLabel: 'Search service name', searchPlaceholder: 'Enter service name...', perPage: 'Items/page', perPageSuffix: '/ page',
    noData: 'No data', create: 'Create new service', edit: 'Edit service', close: 'Close', requiredHint: 'is required.',
    localeHint: 'Default input is Vietnamese; the system auto-translates to English/German. Please review translations before saving.',
    serviceName: 'Service name', category: 'Category', chooseCategory: 'Select category', duration: 'Duration (min)', price: 'Price (VND)', tag: 'Display tag', status: 'Status',
    active: 'Active', inactive: 'Inactive', branchApplied: 'Applied branches', branchDisabledHint: 'Inactive branches cannot be selected.',
    goals: 'Goals', suitableFor: 'Suitable for', process: 'Process', description: 'Description', uploadImage: 'Upload image',
    selectedImage: 'Selected', save: 'Save changes', addService: 'Add service', cancel: 'Cancel',
    colName: 'Service name', colCategory: 'Category', colDuration: 'Duration', colPrice: 'Price', colRating: 'Rating', colBooked: 'Booked', colGoals: 'Goals', colSuitable: 'Suitable', colStatus: 'Status', colAction: 'Actions',
    details: 'Details', editAction: 'Edit', deleteAction: 'Delete', noMatched: 'No matching services.', showing: 'Showing', prev: 'Prev', next: 'Next', page: 'Page',
  },
  de: {
    title: 'Leistungsverwaltung', add: 'Leistung hinzufügen', searchLabel: 'Leistungsname suchen', searchPlaceholder: 'Leistungsname eingeben...', perPage: 'Einträge/Seite', perPageSuffix: '/ Seite',
    noData: 'Keine Daten', create: 'Neue Leistung erstellen', edit: 'Leistung bearbeiten', close: 'Schließen', requiredHint: 'ist erforderlich.',
    localeHint: 'Standardmäßig auf Vietnamesisch eingeben; das System übersetzt automatisch nach Englisch/Deutsch. Bitte Übersetzungen vor dem Speichern prüfen.',
    serviceName: 'Leistungsname', category: 'Kategorie', chooseCategory: 'Kategorie wählen', duration: 'Dauer (Min.)', price: 'Preis (VND)', tag: 'Anzeigetag', status: 'Status',
    active: 'Aktiv', inactive: 'Inaktiv', branchApplied: 'Angewendete Filialen', branchDisabledHint: 'Inaktive Filialen können nicht ausgewählt werden.',
    goals: 'Ziele', suitableFor: 'Geeignet für', process: 'Ablauf', description: 'Beschreibung', uploadImage: 'Bild hochladen',
    selectedImage: 'Ausgewählt', save: 'Änderungen speichern', addService: 'Leistung hinzufügen', cancel: 'Abbrechen',
    colName: 'Leistungsname', colCategory: 'Kategorie', colDuration: 'Dauer', colPrice: 'Preis', colRating: 'Bewertung', colBooked: 'Buchungen', colGoals: 'Ziele', colSuitable: 'Geeignet', colStatus: 'Status', colAction: 'Aktionen',
    details: 'Details', editAction: 'Bearbeiten', deleteAction: 'Löschen', noMatched: 'Keine passenden Leistungen.', showing: 'Anzeige', prev: 'Zurück', next: 'Weiter', page: 'Seite',
  },
} as const

const renderDetailLines = (items: string[]) => {
  if (!items.length) return <p className='service-detail-empty'>Không có dữ liệu</p>
  return (
    <ul className='service-detail-lines'>
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>
          <i className='fa-solid fa-circle-dot service-detail-line-icon' />
          <span>{index + 1}. {item}</span>
        </li>
      ))}
    </ul>
  )
}

export function ServicesTab({
  lang = 'vi',
  services,
  branches,
  categories,
  serviceForm,
  editingService,
  selectedImageName,
  searchKeyword,
  pagination,
  onSearchKeywordChange,
  onPageChange,
  onPageSizeChange,
  onServiceFormChange,
  onSelectImage,
  onSaveService,
  onEditService,
  onDeleteService,
  onCancelEdit,
}: ServicesTabProps) {
  const t = textMap[lang]
  const [mode, setMode] = useState<LocaleMode>('vi')
  const translateReqRef = useRef(0)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [detailService, setDetailService] = useState<SpaService | null>(null)
  const [detailSpecialists, setDetailSpecialists] = useState<Specialist[]>([])
  const [detailBranches, setDetailBranches] = useState<Branch[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const serviceTranslations = serviceForm.translations || {}
  const currentLocaleValue = serviceTranslations[mode] || emptyServiceLocale

  const updateLocalizedField = (field: 'name' | 'description' | 'goals' | 'suitableFor' | 'process' | 'tag', value: string) => {
    const nextTranslations = { ...serviceTranslations, [mode]: { ...currentLocaleValue, [field]: value } }
    const nextForm = { ...serviceForm, translations: nextTranslations }

    if (mode === 'vi') {
      translateReqRef.current += 1
      const reqId = translateReqRef.current
      onServiceFormChange({ ...nextForm, [field]: value })

      void Promise.all([autoTranslateFromVietnamese(value, 'en'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => {
        if (reqId !== translateReqRef.current) return
        onServiceFormChange({
          ...nextForm,
          translations: {
            ...nextTranslations,
            'en': { ...(nextTranslations['en'] || emptyServiceLocale), [field]: en },
            de: { ...(nextTranslations.de || emptyServiceLocale), [field]: de },
          },
        })
      })
      return
    }

    onServiceFormChange(nextForm)
  }

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

  const pageInfoLabel = useMemo(() => {
    if (!pagination.total) return t.noData
    const start = (pagination.page - 1) * pagination.pageSize + 1
    const end = Math.min(pagination.page * pagination.pageSize, pagination.total)
    return `${start}-${end} / ${pagination.total}`
  }, [pagination.page, pagination.pageSize, pagination.total, t.noData])

  useEffect(() => {
    if (!detailService) {
      setDetailSpecialists([])
      setDetailBranches([])
      setDetailError('')
      return
    }

    let active = true
    setDetailLoading(true)
    setDetailError('')

    Promise.all([
      spaAdminApi.specialists({ serviceId: detailService.id }),
      spaAdminApi.branches({ includeInactive: true, serviceId: detailService.id }),
    ])
      .then(([specialists, branches]) => {
        if (!active) return
        setDetailSpecialists(specialists)
        setDetailBranches(branches)
      })
      .catch(() => {
        if (!active) return
        setDetailError('Không thể tải thêm dữ liệu chi tiết. Vui lòng thử lại.')
        setDetailSpecialists([])
        setDetailBranches([])
      })
      .finally(() => {
        if (active) setDetailLoading(false)
      })

    return () => {
      active = false
    }
  }, [detailService])

  return (
    <section className='admin-card admin-card-full'>
      <div className='admin-row admin-row-space'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> {t.title}</h3>
        <button className='admin-btn admin-btn-primary' onClick={handleOpenCreate}><i className='fa-solid fa-plus' /> {t.add}</button>
      </div>

      <div className='admin-row services-toolbar'>
        <label className='admin-field services-search-field'>
          <span className='admin-label'><i className='fa-solid fa-magnifying-glass' /> {t.searchLabel}</span>
          <input
            className='admin-input'
            placeholder={t.searchPlaceholder}
            value={searchKeyword}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
          />
        </label>
        <label className='admin-field services-size-field'>
          <span className='admin-label'><i className='fa-solid fa-list-ol' /> {t.perPage}</span>
          <select className='admin-input' value={pagination.pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size} {t.perPageSuffix}</option>
            ))}
          </select>
        </label>
      </div>

      <div className='admin-table-wrap'>
        <table className='admin-table services-table'>
          <thead>
            <tr>
              <th>{t.colName}</th>
              <th>{t.colCategory}</th>
              <th>{t.colDuration}</th>
              <th>{t.colPrice}</th>
              <th>{t.colRating}</th>
              <th>{t.colBooked}</th>
              <th>{t.colGoals}</th>
              <th>{t.colSuitable}</th>
              <th>{t.colStatus}</th>
              <th>{t.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td className='td-strong services-name-cell' title={service.name}>{service.name}</td>
                <td className='services-category-cell' title={service.category || '-'}>{service.category || '-'}</td>
                <td>{service.durationMin} phút</td>
                <td><span className='admin-badge admin-badge-blue'>{service.price.toLocaleString('vi-VN')}đ</span></td>
                <td>
                  <span className='services-rating'>
                    <i className='fa-solid fa-star services-rating-icon' /> {service.ratingAvg.toFixed(1)}
                  </span>
                </td>
                <td><span className='services-booked'>{service.bookedCount ?? 0}</span></td>
                <td>{renderJsonPreview(service.goals || [], 'admin-badge-pink', 'admin-badge-rose')}</td>
                <td>{renderJsonPreview(service.suitableFor || [], 'admin-badge-cyan', 'admin-badge-sky')}</td>
                <td>
                  <span className={`services-status-icon ${service.isActive ? 'is-active' : 'is-inactive'}`} title={service.isActive ? t.active : t.inactive}>
                    <i className={`fa-solid ${service.isActive ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
                  </span>
                </td>
                <td>
                  <div className='service-action-menu'>
                    <button className='admin-btn admin-btn-ghost service-action-trigger' aria-label='Mở thao tác'>
                      <i className='fa-solid fa-ellipsis' />
                    </button>
                    <div className='service-action-list'>
                      <button className='service-action-item' onClick={() => setDetailService(service)} title={t.details}>
                        <span className='admin-btn-icon admin-btn-icon-info'>
                          <i className='fa-solid fa-circle-info' />
                        </span>
                        <span className='service-action-text'>{t.details}</span>
                      </button>
                      <button className='service-action-item' onClick={() => handleOpenEdit(service)} title={t.editAction}>
                        <span className='admin-btn-icon admin-btn-icon-edit'>
                          <i className='fa-solid fa-pen-to-square' />
                        </span>
                        <span className='service-action-text'>{t.editAction}</span>
                      </button>
                      <button className='service-action-item' onClick={() => onDeleteService(service)} title={t.deleteAction}>
                        <span className='admin-btn-icon admin-btn-icon-delete'>
                          <i className='fa-solid fa-trash' />
                        </span>
                        <span className='service-action-text'>{t.deleteAction}</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={10} className='services-empty-state'>{t.noMatched}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className='admin-row admin-row-space services-pagination'>
        <span className='admin-helper'>{t.showing}: {pageInfoLabel}</span>
        <div className='admin-row services-pagination-controls'>
          <button className='admin-btn admin-btn-ghost' disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
            <i className='fa-solid fa-chevron-left' /> {t.prev}
          </button>
          <span className='admin-helper'>{t.page} {pagination.page}/{Math.max(1, pagination.totalPages)}</span>
          <button
            className='admin-btn admin-btn-ghost'
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            {t.next} <i className='fa-solid fa-chevron-right' />
          </button>
        </div>
      </div>

      {isEditModalOpen && (
        <div className='admin-modal-overlay' onClick={handleCloseEdit}>
          <div className='admin-modal' onClick={(e) => e.stopPropagation()}>
            <div className='admin-row admin-row-space'>
              <h3 className='admin-card-title'><i className='fa-solid fa-spa' /> {editingService ? t.edit : t.create}</h3>
              <button className='admin-btn admin-btn-ghost' onClick={handleCloseEdit}><i className='fa-solid fa-xmark' /> {t.close}</button>
            </div>
            <p className='admin-helper'><b className='admin-required'>*</b> {t.requiredHint}</p>
            <div className='admin-row'>{locales.map((l) => <button key={l} className={`admin-btn ${mode===l?'admin-btn-primary':'admin-btn-ghost'}`} onClick={() => setMode(l)}>{l}</button>)}</div>
            <p className='admin-helper'>{t.localeHint}</p>
            <div className='admin-form-grid services-edit-grid'>
              <label className='admin-field'>
                <span className='admin-label'><i className='fa-solid fa-sparkles' /> {t.serviceName} ({mode}) <b className='admin-required'>*</b></span>
                <input className='admin-input' value={currentLocaleValue.name} onChange={(e) => updateLocalizedField('name', e.target.value)} />
              </label>
              <label className='admin-field'>
                <span className='admin-label'><i className='fa-solid fa-layer-group' /> {t.category} <b className='admin-required'>*</b></span>
                <select className='admin-input' value={serviceForm.categoryId || 0} onChange={(e) => onServiceFormChange({ ...serviceForm, categoryId: Number(e.target.value) })}>
                  <option value={0}>{t.chooseCategory}</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className='admin-field'>
                <span className='admin-label'><i className='fa-solid fa-clock' /> {t.duration} <b className='admin-required'>*</b></span>
                <input className='admin-input' type='number' min={1} value={serviceForm.durationMin} onChange={(e) => onServiceFormChange({ ...serviceForm, durationMin: Number(e.target.value) })} />
              </label>
              <label className='admin-field'>
                <span className='admin-label'><i className='fa-solid fa-coins' /> {t.price} <b className='admin-required'>*</b></span>
                <input className='admin-input' type='number' min={0} value={serviceForm.price} onChange={(e) => onServiceFormChange({ ...serviceForm, price: Number(e.target.value) })} />
              </label>
              <label className='admin-field'>
                <span className='admin-label'><i className='fa-solid fa-tag' /> {t.tag} ({mode})</span>
                <input className='admin-input' value={currentLocaleValue.tag} onChange={(e) => updateLocalizedField('tag', e.target.value)} />
              </label>
              <label className='admin-field'>
                <span className='admin-label'><i className='fa-solid fa-power-off' /> {t.status}</span>
                <span className='admin-checkbox'>
                  <input type='checkbox' checked={Boolean(serviceForm.isActive)} onChange={(e) => onServiceFormChange({ ...serviceForm, isActive: e.target.checked })} />
                  <span className='admin-checkbox-slider' />
                  <span className='admin-checkbox-label'>{serviceForm.isActive ? t.active : t.inactive}</span>
                </span>
              </label>
              <label className='admin-field admin-field-full'>
                <span className='admin-label'><i className='fa-solid fa-building' /> {t.branchApplied} <b className='admin-required'>*</b></span>
                <div className='services-branch-checklist'>
                  {branches.map((branch) => {
                    const checked = serviceForm.branchIds.includes(branch.id)
                    return (
                      <label key={branch.id} className={`services-branch-option ${branch.isActive ? '' : 'is-disabled'}`}>
                        <input
                          type='checkbox'
                          checked={checked}
                          disabled={!branch.isActive}
                          onChange={(e) => {
                            const nextBranchIds = e.target.checked
                              ? [...serviceForm.branchIds, branch.id]
                              : serviceForm.branchIds.filter((id) => id !== branch.id)
                            onServiceFormChange({ ...serviceForm, branchIds: nextBranchIds })
                          }}
                        />
                        <span>{branch.name}</span>
                      </label>
                    )
                  })}
                </div>
                <span className='admin-helper'>{t.branchDisabledHint}</span>
              </label>
              <label className='admin-field admin-field-full'>
                <span className='admin-label'><i className='fa-solid fa-bullseye' /> {t.goals} ({mode}) (phân tách bằng dấu phẩy ",")</span>
                <input className='admin-input' placeholder='Relax, Detox' value={currentLocaleValue.goals} onChange={(e) => updateLocalizedField('goals', e.target.value)} />
              </label>
              <label className='admin-field admin-field-full'>
                <span className='admin-label'><i className='fa-solid fa-users' /> {t.suitableFor} ({mode}) (phân tách bằng dấu phẩy ",")</span>
                <input className='admin-input' placeholder='Người stress, Mất ngủ' value={currentLocaleValue.suitableFor} onChange={(e) => updateLocalizedField('suitableFor', e.target.value)} />
              </label>
              <label className='admin-field admin-field-full'>
                <span className='admin-label'><i className='fa-solid fa-list-check' /> {t.process} ({mode}) (phân tách bằng dấu phẩy ",")</span>
                <input className='admin-input' placeholder='B1 chào hỏi, B2 tư vấn, B3 trị liệu' value={currentLocaleValue.process} onChange={(e) => updateLocalizedField('process', e.target.value)} />
              </label>
              <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-pen-to-square' /> {t.description} ({mode})</span><textarea className='admin-input' value={currentLocaleValue.description} onChange={(e) => updateLocalizedField('description', e.target.value)} /></label>
              <label className='admin-field admin-field-full'><span className='admin-label'><i className='fa-solid fa-cloud-arrow-up' /> {t.uploadImage}</span><input type='file' accept='image/*' onChange={(e) => onSelectImage(e.target.files?.[0] || null)} /></label>
              {selectedImageName && <span className='admin-helper'>{t.selectedImage}: {selectedImageName}</span>}
            </div>
            <div className='admin-row'>
              <button className='admin-btn admin-btn-primary' onClick={async () => { await onSaveService(); setEditModalOpen(false) }}>{editingService ? t.save : t.addService}</button>
              <button className='admin-btn admin-btn-ghost' onClick={handleCloseEdit}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {detailService && (
        <div className='admin-modal-overlay' onClick={() => setDetailService(null)}>
          <div className='admin-modal service-detail-modal' onClick={(e) => e.stopPropagation()}>
            <div className='service-detail-header'>
              <div>
                <p className='service-detail-eyebrow'>HỒ SƠ DỊCH VỤ</p>
                <h3 className='admin-card-title'><i className='fa-solid fa-circle-info' /> {detailService.name}</h3>
              </div>
              <button className='admin-btn admin-btn-ghost' onClick={() => setDetailService(null)}><i className='fa-solid fa-xmark' /> Đóng</button>
            </div>

            {detailLoading && <p className='admin-helper'>Đang tải chuyên viên và chi nhánh liên quan...</p>}
            {detailError && <p className='service-detail-error'>{detailError}</p>}

            <div className='service-detail-layout'>
              <section className='service-detail-image-panel'>
                {detailService.imageUrl
                  ? <img className='service-detail-image' src={detailService.imageUrl} alt={`Dịch vụ ${detailService.name}`} />
                  : <div className='service-detail-image-empty'>Chưa có hình ảnh dịch vụ</div>}
                <div className='service-detail-metrics'>
                  <span className='admin-badge admin-badge-blue'>Giá: {detailService.price.toLocaleString('vi-VN')}đ</span>
                  <span className='admin-badge admin-badge-yellow'>Thời lượng: {detailService.durationMin} phút</span>
                  <span className='admin-badge admin-badge-pink'>Đánh giá: {detailService.ratingAvg.toFixed(1)}</span>
                  <span className={`admin-badge ${detailService.isActive ? 'admin-badge-green' : 'admin-badge-red'}`}>
                    Trạng thái: {detailService.isActive ? 'Đang hoạt động' : 'Đang tắt'}
                  </span>
                  <span className='admin-badge admin-badge-green'>Lượt đặt: {detailService.bookedCount ?? 0}</span>
                </div>
              </section>

              <section className='service-detail-content'>
                <div className='service-detail-grid'>
                  <article className='service-detail-card'>
                    <h4><i className='fa-solid fa-clipboard-list' /> Thông tin nhanh</h4>
                    <p><b>Mã:</b> {detailService.id}</p>
                    <p><b>Danh mục:</b> {detailService.category || '-'}</p>
                    <p><b>Nhãn:</b> {detailService.tag || '-'}</p>
                    <p><b>Trạng thái:</b> <span className={`admin-badge ${detailService.isActive ? 'admin-badge-green' : 'admin-badge-red'}`}>{detailService.isActive ? 'Đang hoạt động' : 'Đang tắt'}</span></p>
                    <p><b>Mô tả:</b> {detailService.description || '-'}</p>
                  </article>

                  <article className='service-detail-card'>
                    <h4><i className='fa-solid fa-file-lines' /> Nội dung dịch vụ</h4>
                    <p><b>Mục tiêu:</b></p>
                    {renderDetailLines(detailService.goals || [])}
                    <p><b>Phù hợp:</b></p>
                    {renderDetailLines(detailService.suitableFor || [])}
                    <p><b>Quy trình:</b></p>
                    {renderDetailLines(detailService.process || [])}
                  </article>

                  <article className='service-detail-card service-branch-specialists-card'>
                    <h4><i className='fa-solid fa-building-circle-check' /> Chi nhánh & chuyên viên theo dịch vụ</h4>
                    {detailBranches.length > 0
                      ? (
                        <ul className='service-branch-list'>
                          {detailBranches.map((branch) => {
                            const specialistsByBranch = detailSpecialists.filter((specialist) => specialist.branchId === branch.id)
                            return (
                              <li key={branch.id} className='service-branch-item'>
                                <div className='service-branch-line'>
                                  <i className='fa-solid fa-building service-branch-icon' />
                                  <span><b>{branch.name}</b> • {branch.address}</span>
                                </div>
                                <ul className='service-specialist-sublist'>
                                  {specialistsByBranch.length > 0
                                    ? specialistsByBranch.map((specialist) => (
                                      <li key={specialist.id} className='service-specialist-subitem'>
                                        <i className='fa-solid fa-user-doctor service-specialist-icon' />
                                        <span>{specialist.name} ({specialist.level})</span>
                                      </li>
                                    ))
                                    : <li className='service-specialist-subitem service-detail-empty-item'><i className='fa-regular fa-circle-xmark service-specialist-icon' /><span>Chưa có chuyên viên cho dịch vụ này tại chi nhánh.</span></li>}
                                </ul>
                              </li>
                            )
                          })}
                        </ul>
                      )
                      : <p className='service-detail-empty'>Chưa có chi nhánh liên kết.</p>}
                  </article>

                  <article className='service-detail-card'>
                    <h4><i className='fa-solid fa-user-doctor' /> Tổng chuyên viên phụ trách ({detailSpecialists.length})</h4>
                    {detailSpecialists.length > 0
                      ? (
                        <ul className='service-detail-lines'>
                          {detailSpecialists.map((specialist) => (
                            <li key={specialist.id}>
                              <i className='fa-solid fa-stethoscope service-detail-line-icon' />
                              <span>{specialist.name} ({specialist.level})</span>
                            </li>
                          ))}
                        </ul>
                      )
                      : <p className='service-detail-empty'>Chưa có chuyên viên liên kết.</p>}
                  </article>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
