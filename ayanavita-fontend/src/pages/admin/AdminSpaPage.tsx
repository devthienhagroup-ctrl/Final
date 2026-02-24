import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { spaAdminApi, type Appointment, type Branch, type ServiceReview, type SpaService, type Specialist } from '../../api/spaAdmin.api'
import { AlertJs } from '../../utils/alertJs'
import './AdminSpaPage.css'
import { BranchesTab } from './tabs/BranchesTab'
import { ReviewsTab } from './tabs/ReviewsTab'
import { ServicesTab } from './tabs/ServicesTab'
import { SpecialistsTab } from './tabs/SpecialistsTab'
import type { BranchForm, RelationForm, ReviewForm, ServiceForm, SpecialistForm } from './tabs/types'

type TabKey = 'branches' | 'services' | 'specialists' | 'reviews'

const defaultServiceForm: ServiceForm = { code: '', name: '', description: '', category: 'health', goals: '', durationMin: 60, price: 0, icon: '👏', imageUrl: '', tag: 'Spa' }
const defaultSpecialistForm: SpecialistForm = { code: '', name: '', level: 'SENIOR', bio: '' }
const defaultReviewForm: ReviewForm = { serviceId: 0, stars: 5, comment: '', customerName: '' }
const defaultBranchForm: BranchForm = { code: '', name: '', address: '', phone: '', isActive: true }

const getVietnameseError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    const message = (error as { message: string }).message
    if (message.includes('Unique constraint')) return 'Dữ liệu bị trùng. Vui lòng kiểm tra lại mã hoặc tên.'
    return message
  }
  return fallback
}

export default function AdminSpaPage() {
  const [tab, setTab] = useState<TabKey>('branches')
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [services, setServices] = useState<SpaService[]>([])
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [reviews, setReviews] = useState<ServiceReview[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [uploadedImage, setUploadedImage] = useState<{ url: string; fileName: string } | null>(null)

  const [branchForm, setBranchForm] = useState<BranchForm>(defaultBranchForm)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [serviceForm, setServiceForm] = useState<ServiceForm>(defaultServiceForm)
  const [editingService, setEditingService] = useState<SpaService | null>(null)
  const [specialistForm, setSpecialistForm] = useState<SpecialistForm>(defaultSpecialistForm)
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null)
  const [reviewForm, setReviewForm] = useState<ReviewForm>(defaultReviewForm)
  const [relationForm, setRelationForm] = useState<RelationForm>({ branchId: 0, serviceId: 0, specialistId: 0 })

  const activeBranches = useMemo(() => branches.filter((item) => item.isActive), [branches])
  const selectedServiceReviews = useMemo(() => {
    if (!reviewForm.serviceId) return reviews
    return reviews.filter((item) => item.serviceId === Number(reviewForm.serviceId))
  }, [reviewForm.serviceId, reviews])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [b, s, sp, r, a] = await Promise.all([
        spaAdminApi.branches(true),
        spaAdminApi.services(),
        spaAdminApi.specialists(),
        spaAdminApi.reviews(),
        spaAdminApi.appointments(),
      ])
      setBranches(b)
      setServices(s)
      setSpecialists(sp)
      setReviews(r)
      setAppointments(a)
    } catch (error) {
      await AlertJs.error('Không thể tải dữ liệu', getVietnameseError(error, 'Hệ thống tạm thời gián đoạn, vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const saveBranch = async () => {
    try {
      if (editingBranch) await spaAdminApi.updateBranch(editingBranch.id, branchForm)
      else await spaAdminApi.createBranch(branchForm)
      setEditingBranch(null)
      setBranchForm(defaultBranchForm)
      await loadAll()
      await AlertJs.success('Đã lưu chi nhánh thành công')
    } catch (error) {
      await AlertJs.error('Lưu chi nhánh thất bại', getVietnameseError(error, 'Vui lòng kiểm tra lại thông tin chi nhánh.'))
    }
  }

  const deleteBranch = async (branch: Branch) => {
    const accepted = await AlertJs.confirm(`Bạn muốn xóa hoặc tắt active cho chi nhánh ${branch.name}?`)
    if (!accepted) return

    try {
      const response = await spaAdminApi.deleteBranch(branch.id)
      await loadAll()
      if (response?.softDeleted) {
        await AlertJs.success('Không thể xóa cứng', 'Chi nhánh đang liên kết dữ liệu nên hệ thống đã chuyển sang trạng thái không hoạt động.')
      } else {
        await AlertJs.success('Đã xóa chi nhánh')
      }
    } catch (error) {
      await AlertJs.error('Xóa chi nhánh thất bại', getVietnameseError(error, 'Không thể xử lý yêu cầu xóa chi nhánh lúc này.'))
    }
  }

  return (
    <main className='admin-page'>
      <header className='admin-header'>
        <div>
          <p className='admin-header-kicker'>SPA OPERATIONS HUB</p>
          <h1>Spa Admin Dashboard</h1>
          <p>Bảng điều khiển chuẩn hoá vận hành theo phong cách hiện đại, rõ dữ liệu, dễ thao tác.</p>
        </div>
        <div className='admin-row'>
          <Link className='admin-btn admin-btn-ghost' to='/admin/orders'><i className='fa-solid fa-bag-shopping' />Quản lý đơn hàng</Link>
          <button className='admin-btn admin-btn-primary' onClick={loadAll}><i className='fa-solid fa-rotate-right' />Làm mới</button>
        </div>
      </header>

      <section className='admin-overview'>
        <article className='overview-card'>
          <span>Chi nhánh</span>
          <strong>{branches.length}</strong>
          <small>Đang active: {activeBranches.length}</small>
          <i className='overview-icon fa-solid fa-building' />
        </article>
        <article className='overview-card'>
          <span>Dịch vụ</span>
          <strong>{services.length}</strong>
          <small>Spa catalog</small>
          <i className='overview-icon fa-solid fa-spa' />
        </article>
        <article className='overview-card'>
          <span>Chuyên viên</span>
          <strong>{specialists.length}</strong>
          <small>Đủ năng lực vận hành</small>
          <i className='overview-icon fa-solid fa-user-nurse' />
        </article>
        <article className='overview-card'>
          <span>Lịch hẹn</span>
          <strong>{appointments.length}</strong>
          <small>Reviews: {reviews.length}</small>
          <i className='overview-icon fa-solid fa-calendar-check' />
        </article>
      </section>

      <nav className='admin-tabs'>
        <button className={`admin-tab ${tab === 'branches' ? 'active' : ''}`} onClick={() => setTab('branches')}><i className='fa-solid fa-building-circle-check' />Chi nhánh ({branches.length})</button>
        <button className={`admin-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}><i className='fa-solid fa-leaf' />Dịch vụ ({services.length})</button>
        <button className={`admin-tab ${tab === 'specialists' ? 'active' : ''}`} onClick={() => setTab('specialists')}><i className='fa-solid fa-people-group' />Chuyên viên + Quan hệ</button>
        <button className={`admin-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}><i className='fa-solid fa-star-half-stroke' />Review + Lịch hẹn</button>
      </nav>

      {loading && <section className='admin-card'>Đang tải dữ liệu...</section>}

      {tab === 'branches' && <BranchesTab loading={loading} branches={branches} branchForm={branchForm} editingBranch={editingBranch} onBranchFormChange={setBranchForm} onSaveBranch={saveBranch} onEditBranch={(branch) => { setEditingBranch(branch); setBranchForm(branch) }} onDeleteBranch={deleteBranch} onCancelEdit={() => { setEditingBranch(null); setBranchForm(defaultBranchForm) }} />}

      {tab === 'services' && <ServicesTab loading={loading} services={services} serviceForm={serviceForm} editingService={editingService} selectedImageName={selectedImage?.name || ''} onServiceFormChange={setServiceForm} onSelectImage={setSelectedImage} onUploadImage={async () => {
        if (!selectedImage) return
        try {
          const result = await spaAdminApi.uploadCloudImage(selectedImage)
          setUploadedImage({ url: result.url, fileName: result.fileName })
          setServiceForm((prev) => ({ ...prev, imageUrl: result.url }))
          await AlertJs.success('Upload ảnh thành công')
        } catch (error) {
          await AlertJs.error('Upload ảnh thất bại', getVietnameseError(error, 'Không thể upload ảnh lên cloud.'))
        }
      }} onDeleteCloudImage={async () => {
        if (!uploadedImage) return
        try {
          await spaAdminApi.deleteCloudImage({ fileName: uploadedImage.fileName })
          setUploadedImage(null)
          setServiceForm((prev) => ({ ...prev, imageUrl: '' }))
          await AlertJs.success('Đã xóa ảnh cloud')
        } catch (error) {
          await AlertJs.error('Xóa ảnh thất bại', getVietnameseError(error, 'Không thể xóa ảnh cloud.'))
        }
      }} onSaveService={async () => {
        const payload = { ...serviceForm, goals: serviceForm.goals.split(',').map((item) => item.trim()).filter(Boolean) }
        try {
          if (editingService) await spaAdminApi.updateService(editingService.id, payload)
          else await spaAdminApi.createService(payload)
          setEditingService(null)
          setServiceForm(defaultServiceForm)
          setUploadedImage(null)
          await loadAll()
          await AlertJs.success('Đã lưu dịch vụ')
        } catch (error) {
          await AlertJs.error('Lưu dịch vụ thất bại', getVietnameseError(error, 'Vui lòng kiểm tra lại thông tin dịch vụ.'))
        }
      }} onEditService={(service) => { setEditingService(service); setServiceForm({ ...serviceForm, ...service, goals: service.goals?.join(', ') || '' }) }} onDeleteService={async (service) => {
        try {
          await spaAdminApi.deleteService(service.id)
          await loadAll()
          await AlertJs.success('Đã xóa dịch vụ')
        } catch (error) {
          await AlertJs.error('Xóa dịch vụ thất bại', getVietnameseError(error, 'Dịch vụ đang được sử dụng hoặc có lỗi hệ thống.'))
        }
      }} onShowServiceDetail={(service) => { void AlertJs.info(`Chi tiết dịch vụ: ${service.name}`, `${service.description || '-'}\nIcon: ${service.icon || '-'}`) }} onCancelEdit={() => { setEditingService(null); setServiceForm(defaultServiceForm) }} />}

      {tab === 'specialists' && <SpecialistsTab loading={loading} branches={activeBranches} services={services} specialists={specialists} specialistForm={specialistForm} relationForm={relationForm} editingSpecialist={editingSpecialist} onSpecialistFormChange={setSpecialistForm} onRelationFormChange={setRelationForm} onSaveSpecialist={async () => {
        try {
          if (editingSpecialist) await spaAdminApi.updateSpecialist(editingSpecialist.id, specialistForm)
          else await spaAdminApi.createSpecialist(specialistForm)
          setEditingSpecialist(null)
          setSpecialistForm(defaultSpecialistForm)
          await loadAll()
          await AlertJs.success('Đã lưu chuyên viên')
        } catch (error) {
          await AlertJs.error('Lưu chuyên viên thất bại', getVietnameseError(error, 'Thông tin chuyên viên chưa hợp lệ.'))
        }
      }} onEditSpecialist={(specialist) => { setEditingSpecialist(specialist); setSpecialistForm({ code: specialist.code, name: specialist.name, level: specialist.level, bio: specialist.bio || '' }) }} onDeleteSpecialist={async (specialist) => {
        try {
          await spaAdminApi.deleteSpecialist(specialist.id)
          await loadAll()
          await AlertJs.success('Đã xóa chuyên viên')
        } catch (error) {
          await AlertJs.error('Xóa chuyên viên thất bại', getVietnameseError(error, 'Chuyên viên đang có lịch hẹn hoặc liên kết dữ liệu.'))
        }
      }} onShowSpecialistDetail={(specialist) => { void AlertJs.info(`Chuyên viên: ${specialist.name}`, specialist.bio || 'Không có mô tả chi tiết.') }} onSaveRelation={async () => {
        if (!relationForm.branchId || !relationForm.serviceId || !relationForm.specialistId) {
          await AlertJs.error('Thiếu dữ liệu', 'Vui lòng chọn đầy đủ chi nhánh, dịch vụ và chuyên viên.')
          return
        }
        try {
          await spaAdminApi.syncRelations({
            branchService: [{ branchId: relationForm.branchId, serviceId: relationForm.serviceId }],
            serviceSpecialist: [{ serviceId: relationForm.serviceId, specialistId: relationForm.specialistId }],
            branchSpecialist: [{ branchId: relationForm.branchId, specialistId: relationForm.specialistId }],
          })
          await loadAll()
          await AlertJs.success('Đã lưu quan hệ')
        } catch (error) {
          await AlertJs.error('Lưu quan hệ thất bại', getVietnameseError(error, 'Không thể đồng bộ quan hệ dữ liệu.'))
        }
      }} onCancelEdit={() => { setEditingSpecialist(null); setSpecialistForm(defaultSpecialistForm) }} />}

      {tab === 'reviews' && <ReviewsTab loading={loading} services={services} appointments={appointments} selectedServiceReviews={selectedServiceReviews} reviewForm={reviewForm} onReviewFormChange={setReviewForm} onCreateReview={async () => {
        try {
          await spaAdminApi.createReview(reviewForm)
          setReviewForm(defaultReviewForm)
          await loadAll()
          await AlertJs.success('Đã thêm review')
        } catch (error) {
          await AlertJs.error('Thêm review thất bại', getVietnameseError(error, 'Vui lòng kiểm tra nội dung review.'))
        }
      }} onDeleteReview={async (review) => {
        try {
          await spaAdminApi.deleteReview(review.id)
          await loadAll()
          await AlertJs.success('Đã xóa review')
        } catch (error) {
          await AlertJs.error('Xóa review thất bại', getVietnameseError(error, 'Không thể xóa review vào lúc này.'))
        }
      }} onToggleAppointmentStatus={async (appointment) => {
        try {
          await spaAdminApi.updateAppointment(appointment.id, { status: appointment.status === 'PENDING' ? 'CONFIRMED' : 'PENDING' })
          await loadAll()
          await AlertJs.success('Đã cập nhật trạng thái lịch hẹn')
        } catch (error) {
          await AlertJs.error('Cập nhật thất bại', getVietnameseError(error, 'Không thể cập nhật trạng thái lịch hẹn.'))
        }
      }} onShowAppointmentDetail={(appointment) => { void AlertJs.info(`Lịch hẹn #${appointment.id}`, `Khách: ${appointment.customerName}\nSĐT: ${appointment.customerPhone}\nGhi chú: ${appointment.note || '-'}`) }} onDeleteAppointment={async (appointment) => {
        try {
          await spaAdminApi.deleteAppointment(appointment.id)
          await loadAll()
          await AlertJs.success('Đã xóa lịch hẹn')
        } catch (error) {
          await AlertJs.error('Xóa lịch hẹn thất bại', getVietnameseError(error, 'Không thể xóa lịch hẹn vào lúc này.'))
        }
      }} />}
    </main>
  )
}
