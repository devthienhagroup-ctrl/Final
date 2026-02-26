import { useEffect, useMemo, useState } from 'react'
import { spaAdminApi, type Appointment, type Branch, type ServiceCategory, type SpaService, type Specialist } from '../../api/spaAdmin.api'
import { AlertJs } from '../../utils/alertJs'
import './AdminSpaPage.css'
import { BranchesTab } from './tabs/BranchesTab'
import { CategoriesTab } from './tabs/CategoriesTab'
import { ServicesTab } from './tabs/ServicesTab'
import { SpecialistsTab } from './tabs/SpecialistsTab'
import { AppointmentsTab } from './tabs/AppointmentsTab'
import type { BranchForm, CategoryForm, ServiceForm, SpecialistForm } from './tabs/types'
import { useAuth } from '../../state/auth.store'

type TabKey = 'branches' | 'categories' | 'services' | 'specialists' | 'appointments'
type AdminLang = 'vi' | 'en-US' | 'de'

const LANG_STORAGE_KEY = 'lang-admin'

const uiText: Record<AdminLang, Record<string, string>> = {
  'vi': {
    kicker: 'SERVIE OPERATIONS HUB',
    staffTitle: 'Lịch hẹn chuyên viên',
    adminTitle: 'Bảng điều khiển quản trị Servie',
    staffDesc: 'Bạn chỉ xem các lịch hẹn được phân công và cập nhật khách có đến hay không.',
    adminDesc: 'Bảng điều khiển chuẩn hoá vận hành theo phong cách hiện đại, rõ dữ liệu, dễ thao tác.',
    branches: 'Chi nhánh',
    services: 'Dịch vụ',
    specialists: 'Chuyên viên',
    appointments: 'Lịch hẹn',
    active: 'Đang hoạt động',
    serviceCatalog: 'Servie catalog',
    specialistCapacity: 'Đủ năng lực vận hành',
    synced: 'Đã đồng bộ hệ thống',
    serviceCategories: 'Danh mục dịch vụ',
    assignedAppointments: 'Lịch hẹn phụ trách',
    loading: 'Đang tải dữ liệu...',
    specialistRole: 'Chuyên viên',
  },
  'en-US': {
    kicker: 'SERVIE OPERATIONS HUB',
    staffTitle: 'Specialist appointments',
    adminTitle: 'Servie Admin Dashboard',
    staffDesc: 'You can only view assigned appointments and update customer attendance.',
    adminDesc: 'A modern operations dashboard with standardized data and fast workflows.',
    branches: 'Branches',
    services: 'Services',
    specialists: 'Specialists',
    appointments: 'Appointments',
    active: 'Active',
    serviceCatalog: 'Servie catalog',
    specialistCapacity: 'Operational capacity ready',
    synced: 'Synced to system',
    serviceCategories: 'Service categories',
    assignedAppointments: 'Assigned appointments',
    loading: 'Loading data...',
    specialistRole: 'Specialist',
  },
  'de': {
    kicker: 'SERVIE BETRIEBSZENTRUM',
    staffTitle: 'Termine für Spezialisten',
    adminTitle: 'Servie-Adminübersicht',
    staffDesc: 'Sie sehen nur zugewiesene Termine und aktualisieren die Kundenanwesenheit.',
    adminDesc: 'Ein modernes Betriebs-Dashboard mit standardisierten Daten und schnellen Abläufen.',
    branches: 'Filialen',
    services: 'Leistungen',
    specialists: 'Spezialisten',
    appointments: 'Termine',
    active: 'Aktiv',
    serviceCatalog: 'Servie-Katalog',
    specialistCapacity: 'Betriebsbereit',
    synced: 'Mit System synchronisiert',
    serviceCategories: 'Leistungskategorien',
    assignedAppointments: 'Zugewiesene Termine',
    loading: 'Daten werden geladen...',
    specialistRole: 'Spezialist',
  },
}

const defaultServiceForm: ServiceForm = { name: '', description: '', categoryId: 0, goals: '', suitableFor: '', process: '', durationMin: 60, price: 0, tag: 'Spa', branchIds: [], isActive: true }
const defaultCategoryForm: CategoryForm = { name: '' }
const defaultSpecialistForm: SpecialistForm = { name: '', email: '', level: 'SENIOR', bio: '', branchId: 0, serviceIds: [] }
const defaultBranchForm: BranchForm = { code: '', name: '', address: '', phone: '', isActive: true }

const normalizeBranchCode = (name: string) => {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return base || 'BRANCH'
}

const isValidPhoneNumber = (phone: string) => {
  const cleaned = phone.trim()
  if (!cleaned) return true
  if (!/^\+?[\d\s().-]+$/.test(cleaned)) return false
  const digitsCount = cleaned.replace(/\D/g, '').length
  return digitsCount >= 6 && digitsCount <= 20
}

const getVietnameseError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    const message = (error as { message: string }).message
    if (message.includes('Unique constraint')) return 'Dữ liệu bị trùng. Vui lòng kiểm tra lại mã hoặc tên.'
    return message
  }
  return fallback
}

export default function AdminSpaPage() {
  const { user } = useAuth()
  const isStaff = user?.role === 'STAFF'
  const [tab, setTab] = useState<TabKey>(isStaff ? 'appointments' : 'branches')
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [services, setServices] = useState<SpaService[]>([])
  const [servicePageItems, setServicePageItems] = useState<SpaService[]>([])
  const [serviceSearchKeyword, setServiceSearchKeyword] = useState('')
  const [servicePage, setServicePage] = useState(1)
  const [servicePageSize, setServicePageSize] = useState(10)
  const [serviceTotal, setServiceTotal] = useState(0)
  const [serviceTotalPages, setServiceTotalPages] = useState(1)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [lang, setLang] = useState<AdminLang>(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
    return saved === 'vi' || saved === 'en-US' || saved === 'de' ? saved : 'vi'
  })

  const [branchForm, setBranchForm] = useState<BranchForm>(defaultBranchForm)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [serviceForm, setServiceForm] = useState<ServiceForm>(defaultServiceForm)
  const [editingService, setEditingService] = useState<SpaService | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(defaultCategoryForm)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [specialistForm, setSpecialistForm] = useState<SpecialistForm>(defaultSpecialistForm)
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null)

  const activeBranches = useMemo(() => branches.filter((item) => item.isActive), [branches])
  const displayName = useMemo(() => {
    if (!user?.email) return 'Admin User'
    const baseName = user.email.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
    return baseName ? baseName.replace(/\b\w/g, (char) => char.toUpperCase()) : user.email
  }, [user?.email])
  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'STAFF' ? uiText[lang].specialistRole : user?.role ?? 'User'
  const avatarLetter = (displayName[0] || 'A').toUpperCase()
  const t = uiText[lang]

  useEffect(() => {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
  }, [lang])

  const loadServices = async (params?: { page?: number; q?: string; pageSize?: number }) => {
    const response = await spaAdminApi.services({ q: params?.q ?? serviceSearchKeyword, page: params?.page ?? servicePage, pageSize: params?.pageSize ?? servicePageSize, includeInactive: true })
    setServicePageItems(response.items)
    setServiceTotal(response.total)
    setServiceTotalPages(response.totalPages)
    setServicePage(response.page)
    setServicePageSize(response.pageSize)
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [b, c, sAll, s, sp, a] = await Promise.all([
        spaAdminApi.branches(true),
        spaAdminApi.serviceCategories(),
        spaAdminApi.services({ page: 1, pageSize: 100, includeInactive: true }),
        spaAdminApi.services({ q: serviceSearchKeyword, page: servicePage, pageSize: servicePageSize, includeInactive: true }),
        spaAdminApi.specialists(),
        spaAdminApi.appointments(),
      ])
      setBranches(b)
      setCategories(c)
      setServices(sAll.items)
      setServicePageItems(s.items)
      setServiceTotal(s.total)
      setServicePage(s.page)
      setServicePageSize(s.pageSize)
      setServiceTotalPages(s.totalPages)
      setSpecialists(sp)
      setAppointments(a)
    } catch (error) {
      await AlertJs.error('Không thể tải dữ liệu', getVietnameseError(error, 'Hệ thống tạm thời gián đoạn, vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadAll() }, [])
  useEffect(() => {
    if (isStaff) return
    const timer = window.setTimeout(() => { void loadServices({ page: 1 }) }, 300)
    return () => window.clearTimeout(timer)
  }, [serviceSearchKeyword, servicePageSize, isStaff])

  const saveBranch = async () => {
    const normalizedName = (branchForm.name || '').trim()
    const normalizedAddress = (branchForm.address || '').trim()
    const normalizedPhone = (branchForm.phone || '').trim()
    const generatedCode = normalizeBranchCode(normalizedName)
    if (!normalizedName || normalizedName.length < 2) return AlertJs.error('Tên chi nhánh chưa hợp lệ', 'Tên chi nhánh cần có ít nhất 2 ký tự.')
    if (!normalizedAddress) return AlertJs.error('Thiếu địa chỉ', 'Vui lòng nhập địa chỉ chi nhánh.')
    if (!isValidPhoneNumber(normalizedPhone)) return AlertJs.error('Số điện thoại chưa hợp lệ', 'Vui lòng nhập đúng định dạng số điện thoại quốc tế (không giới hạn quốc gia).')

    const payload: BranchForm = { ...branchForm, code: generatedCode, name: normalizedName, address: normalizedAddress, phone: normalizedPhone }
    try {
      if (editingBranch) await spaAdminApi.updateBranch(editingBranch.id, payload)
      else await spaAdminApi.createBranch(payload)
      setEditingBranch(null)
      setBranchForm(defaultBranchForm)
      await loadAll()
      await AlertJs.success('Đã lưu chi nhánh thành công', `Mã chi nhánh: ${generatedCode}. Dữ liệu đã được đồng bộ lên hệ thống.`)
    } catch (error) {
      await AlertJs.error('Lưu chi nhánh thất bại', getVietnameseError(error, 'Vui lòng kiểm tra lại thông tin chi nhánh.'))
    }
  }

  return (
    <main className='admin-page'>
      <header className='admin-header'>
        <div>
          <p className='admin-header-kicker'>{t.kicker}</p>
          <h1>{isStaff ? t.staffTitle : t.adminTitle}</h1>
          <p>{isStaff ? t.staffDesc : t.adminDesc}</p>
        </div>
        <div className='admin-header-side'>
          <div className='admin-lang-switch' role='group' aria-label='Admin language switch'>
            <button type='button' className={`admin-lang-option ${lang === 'en-US' ? 'active' : ''}`} onClick={() => setLang('en-US')} aria-label='English (US)'>
              <img src='https://flagcdn.com/w40/us.png' alt='USA flag' loading='lazy' />
            </button>
            <button type='button' className={`admin-lang-option ${lang === 'de' ? 'active' : ''}`} onClick={() => setLang('de')} aria-label='Deutsch'>
              <img src='https://flagcdn.com/w40/de.png' alt='Germany flag' loading='lazy' />
            </button>
            <button type='button' className={`admin-lang-option ${lang === 'vi' ? 'active' : ''}`} onClick={() => setLang('vi')} aria-label='Tiếng Việt'>
              <img src='https://flagcdn.com/w40/vn.png' alt='Vietnam flag' loading='lazy' />
            </button>
          </div>
          <div className='admin-user-badge' aria-label='Thông tin tài khoản đăng nhập'>
          <div className='admin-user-avatar'>{avatarLetter}</div>
          <div className='admin-user-meta'><strong>{displayName}</strong><span>{roleLabel}</span></div>
          </div>
        </div>
      </header>

      {!isStaff && (
        <>
          <section className='admin-overview'>
            <article className='overview-card'><span>{t.branches}</span><strong>{branches.length}</strong><small>{t.active}: {activeBranches.length}</small><i className='overview-icon fa-solid fa-building' /></article>
            <article className='overview-card'><span>{t.services}</span><strong>{services.length}</strong><small>{t.serviceCatalog}</small><i className='overview-icon fa-solid fa-spa' /></article>
            <article className='overview-card'><span>{t.specialists}</span><strong>{specialists.length}</strong><small>{t.specialistCapacity}</small><i className='overview-icon fa-solid fa-user-nurse' /></article>
            <article className='overview-card'><span>{t.appointments}</span><strong>{appointments.length}</strong><small>{t.synced}</small><i className='overview-icon fa-solid fa-calendar-check' /></article>
          </section>

          <nav className='admin-tabs'>
            <button className={`admin-tab ${tab === 'branches' ? 'active' : ''}`} onClick={() => setTab('branches')}><i className='fa-solid fa-building-circle-check' />{t.branches} ({branches.length})</button>
            <button className={`admin-tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}><i className='fa-solid fa-layer-group' />{t.serviceCategories} ({categories.length})</button>
            <button className={`admin-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}><i className='fa-solid fa-leaf' />{t.services} ({serviceTotal})</button>
            <button className={`admin-tab ${tab === 'specialists' ? 'active' : ''}`} onClick={() => setTab('specialists')}><i className='fa-solid fa-people-group' />{t.specialists}</button>
            <button className={`admin-tab ${tab === 'appointments' ? 'active' : ''}`} onClick={() => setTab('appointments')}><i className='fa-solid fa-calendar-days' />{t.appointments}</button>
          </nav>
        </>
      )}

      {isStaff && <nav className='admin-tabs'><button className='admin-tab active'><i className='fa-solid fa-calendar-days' />{t.assignedAppointments}</button></nav>}
      {loading && <section className='admin-card'>{t.loading}</section>}

      {!isStaff && tab === 'branches' && <BranchesTab lang={lang} loading={loading} branches={branches} branchForm={branchForm} editingBranch={editingBranch} onBranchFormChange={(next) => { const nextName = next.name ?? branchForm.name ?? ''; setBranchForm({ ...next, code: normalizeBranchCode(nextName) }) }} onSaveBranch={saveBranch} onEditBranch={(branch) => { setEditingBranch(branch); setBranchForm(branch) }} onDeleteBranch={async (branch) => { try { const response = await spaAdminApi.deleteBranch(branch.id); await loadAll(); await AlertJs.success(response?.softDeleted ? 'Không thể xóa cứng' : 'Đã xóa chi nhánh', response?.softDeleted ? 'Chi nhánh đang liên kết dữ liệu nên hệ thống đã chuyển sang trạng thái không hoạt động.' : '') } catch (error) { await AlertJs.error('Xóa chi nhánh thất bại', getVietnameseError(error, 'Không thể xử lý yêu cầu xóa chi nhánh lúc này.')) } }} onCancelEdit={() => { setEditingBranch(null); setBranchForm(defaultBranchForm) }} />}

      {!isStaff && tab === 'categories' && <CategoriesTab lang={lang} loading={loading} categories={categories} categoryForm={categoryForm} editingCategory={editingCategory} onCategoryFormChange={setCategoryForm} onSaveCategory={async () => {
        if (!categoryForm.name.trim()) return AlertJs.error('Thiếu dữ liệu', 'Vui lòng nhập tên danh mục.')
        try { if (editingCategory) await spaAdminApi.updateServiceCategory(editingCategory.id, categoryForm); else await spaAdminApi.createServiceCategory(categoryForm); setEditingCategory(null); setCategoryForm(defaultCategoryForm); await loadAll(); await AlertJs.success('Đã lưu danh mục dịch vụ') } catch (error) { await AlertJs.error('Lưu danh mục thất bại', getVietnameseError(error, 'Vui lòng kiểm tra dữ liệu danh mục.')) }
      }} onEditCategory={(category) => { setEditingCategory(category); setCategoryForm({ name: category.name }) }} onDeleteCategory={async (category) => {
        if (category.serviceCount > 0) return AlertJs.error('Không thể xóa', 'Danh mục này đang có dịch vụ. Vui lòng chuyển dịch vụ sang danh mục khác trước khi xóa.')
        try { await spaAdminApi.deleteServiceCategory(category.id); await loadAll(); await AlertJs.success('Đã xóa danh mục') } catch (error) { await AlertJs.error('Xóa danh mục thất bại', getVietnameseError(error, 'Không thể xóa danh mục vào lúc này.')) }
      }} onCancelEdit={() => { setEditingCategory(null); setCategoryForm(defaultCategoryForm) }} />}

      {!isStaff && tab === 'services' && <ServicesTab lang={lang} loading={loading} services={servicePageItems} branches={branches} categories={categories} serviceForm={serviceForm} editingService={editingService} selectedImageName={selectedImage?.name || ''} searchKeyword={serviceSearchKeyword} pagination={{ page: servicePage, pageSize: servicePageSize, total: serviceTotal, totalPages: serviceTotalPages }} onSearchKeywordChange={setServiceSearchKeyword} onPageChange={(nextPage) => { void loadServices({ page: nextPage }) }} onPageSizeChange={(size) => { setServicePageSize(size); setServicePage(1) }} onServiceFormChange={setServiceForm} onSelectImage={setSelectedImage} onSaveService={async () => {
        if (!serviceForm.categoryId) return AlertJs.error('Thiếu danh mục', 'Vui lòng chọn danh mục cho dịch vụ.')
        if (!serviceForm.branchIds.length) return AlertJs.error('Thiếu chi nhánh', 'Vui lòng chọn ít nhất 1 chi nhánh áp dụng dịch vụ.')
        const normalizedServiceName = serviceForm.name.trim().toLocaleLowerCase('vi')
        const duplicatedService = services.find((service) => service.id !== editingService?.id && service.name.trim().toLocaleLowerCase('vi') === normalizedServiceName)
        if (duplicatedService) return AlertJs.error('Tên dịch vụ bị trùng', `Tên dịch vụ "${serviceForm.name.trim()}" đã tồn tại. Vui lòng nhập tên khác.`)
        const payload = { ...serviceForm, goals: serviceForm.goals.split(',').map((item) => item.trim()).filter(Boolean), suitableFor: serviceForm.suitableFor.split(',').map((item) => item.trim()).filter(Boolean), process: serviceForm.process.split(',').map((item) => item.trim()).filter(Boolean), branchIds: Array.from(new Set(serviceForm.branchIds)).map(Number).filter((id) => Number.isInteger(id) && id > 0) }
        try { if (editingService) await spaAdminApi.updateService(editingService.id, payload, selectedImage); else await spaAdminApi.createService(payload, selectedImage); setEditingService(null); setServiceForm(defaultServiceForm); setSelectedImage(null); await loadAll(); await AlertJs.success('Đã lưu dịch vụ') } catch (error) { await AlertJs.error('Lưu dịch vụ thất bại', getVietnameseError(error, 'Vui lòng kiểm tra lại thông tin dịch vụ.')) }
      }} onEditService={(service) => { setEditingService(service); setSelectedImage(null); setServiceForm({ ...defaultServiceForm, ...service, categoryId: service.categoryId || 0, goals: service.goals?.join(', ') || '', suitableFor: service.suitableFor?.join(', ') || '', process: service.process?.join(', ') || '', branchIds: service.branchIds || [], isActive: service.isActive ?? true }) }} onDeleteService={async (service) => { try { await spaAdminApi.deleteService(service.id); await loadAll(); await AlertJs.success('Đã xóa dịch vụ') } catch (error) { await AlertJs.error('Xóa dịch vụ thất bại', getVietnameseError(error, 'Dịch vụ đang được sử dụng hoặc có lỗi hệ thống.')) } }} onCancelEdit={() => { setEditingService(null); setServiceForm(defaultServiceForm); setSelectedImage(null) }} />}

      {!isStaff && tab === 'specialists' && <SpecialistsTab lang={lang} loading={loading} branches={activeBranches} services={services} specialists={specialists} specialistForm={specialistForm} editingSpecialist={editingSpecialist} onSpecialistFormChange={setSpecialistForm} onSaveSpecialist={async () => {
        if (!specialistForm.branchId) return AlertJs.error('Thiếu chi nhánh', 'Vui lòng chọn chi nhánh cho chuyên viên.')
        if (!specialistForm.email.trim()) return AlertJs.error('Thiếu email', 'Vui lòng nhập email tài khoản cho chuyên viên.')
        try { if (editingSpecialist) await spaAdminApi.updateSpecialist(editingSpecialist.id, specialistForm); else await spaAdminApi.createSpecialist(specialistForm); setEditingSpecialist(null); setSpecialistForm(defaultSpecialistForm); await loadAll(); await AlertJs.success('Đã lưu chuyên viên') } catch (error) { await AlertJs.error('Lưu chuyên viên thất bại', getVietnameseError(error, 'Thông tin chuyên viên chưa hợp lệ.')) }
      }} onEditSpecialist={(specialist) => { setEditingSpecialist(specialist); setSpecialistForm({ name: specialist.name, email: specialist.email, level: specialist.level, bio: specialist.bio || '', branchId: specialist.branchId, serviceIds: specialist.serviceIds || [] }) }} onDeleteSpecialist={async (specialist) => { try { await spaAdminApi.deleteSpecialist(specialist.id); await loadAll(); await AlertJs.success('Đã xóa chuyên viên') } catch (error) { await AlertJs.error('Xóa chuyên viên thất bại', getVietnameseError(error, 'Chuyên viên đang có lịch hẹn hoặc liên kết dữ liệu.')) } }} onCancelEdit={() => { setEditingSpecialist(null); setSpecialistForm(defaultSpecialistForm) }} />}

      {(isStaff || tab === 'appointments') && <AppointmentsTab lang={lang} loading={loading} appointments={appointments} specialists={specialists} branches={branches} services={services} isStaff={isStaff} onAssignSpecialist={async (appointment, specialistId) => {
        if (isStaff) return
        try { await spaAdminApi.updateAppointment(appointment.id, { specialistId }); await loadAll(); await AlertJs.success('Đã gán chuyên viên và gửi email thông báo') } catch (error) { await AlertJs.error('Gán chuyên viên thất bại', getVietnameseError(error, 'Không thể gán chuyên viên vào lịch hẹn này.')) }
      }} onUpdateStatus={async (appointment, status) => {
        try { await spaAdminApi.updateAppointment(appointment.id, { status }); await loadAll(); await AlertJs.success('Đã cập nhật trạng thái lịch hẹn') } catch (error) { await AlertJs.error('Cập nhật thất bại', getVietnameseError(error, 'Không thể cập nhật trạng thái lịch hẹn.')) }
      }} onDeleteAppointment={async (appointment) => {
        if (isStaff) return
        try { await spaAdminApi.deleteAppointment(appointment.id); await loadAll(); await AlertJs.success('Đã xóa lịch hẹn') } catch (error) { await AlertJs.error('Xóa lịch hẹn thất bại', getVietnameseError(error, 'Không thể xóa lịch hẹn vào lúc này.')) }
      }} />}
    </main>
  )
}
