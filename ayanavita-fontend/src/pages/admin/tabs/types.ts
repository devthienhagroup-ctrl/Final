import type { Appointment, Branch, ServiceReview, SpaService, Specialist } from '../../../api/spaAdmin.api'

export type BranchForm = Partial<Branch>
export type ServiceForm = {
  code: string
  name: string
  description: string
  category: string
  goals: string
  durationMin: number
  price: number
  icon: string
  imageUrl: string
  tag: string
}

export type SpecialistForm = { code: string; name: string; level: string; bio: string }
export type ReviewForm = { serviceId: number; stars: number; comment: string; customerName: string }
export type RelationForm = { branchId: number; serviceId: number; specialistId: number }

export type CommonTabProps = {
  loading: boolean
}

export type BranchesTabProps = CommonTabProps & {
  branches: Branch[]
  branchForm: BranchForm
  editingBranch: Branch | null
  onBranchFormChange: (next: BranchForm) => void
  onSaveBranch: () => Promise<void>
  onEditBranch: (branch: Branch) => void
  onDeleteBranch: (branch: Branch) => Promise<void>
  onCancelEdit: () => void
}

export type ServicesTabProps = CommonTabProps & {
  services: SpaService[]
  serviceForm: ServiceForm
  editingService: SpaService | null
  selectedImageName: string
  onServiceFormChange: (next: ServiceForm) => void
  onSelectImage: (file: File | null) => void
  onUploadImage: () => Promise<void>
  onDeleteCloudImage: () => Promise<void>
  onSaveService: () => Promise<void>
  onEditService: (service: SpaService) => void
  onDeleteService: (service: SpaService) => Promise<void>
  onShowServiceDetail: (service: SpaService) => void
  onCancelEdit: () => void
}

export type SpecialistsTabProps = CommonTabProps & {
  branches: Branch[]
  services: SpaService[]
  specialists: Specialist[]
  specialistForm: SpecialistForm
  relationForm: RelationForm
  editingSpecialist: Specialist | null
  onSpecialistFormChange: (next: SpecialistForm) => void
  onRelationFormChange: (next: RelationForm) => void
  onSaveSpecialist: () => Promise<void>
  onEditSpecialist: (specialist: Specialist) => void
  onDeleteSpecialist: (specialist: Specialist) => Promise<void>
  onShowSpecialistDetail: (specialist: Specialist) => void
  onSaveRelation: () => Promise<void>
  onCancelEdit: () => void
}

export type ReviewsTabProps = CommonTabProps & {
  services: SpaService[]
  appointments: Appointment[]
  selectedServiceReviews: ServiceReview[]
  reviewForm: ReviewForm
  onReviewFormChange: (next: ReviewForm) => void
  onCreateReview: () => Promise<void>
  onDeleteReview: (review: ServiceReview) => Promise<void>
  onToggleAppointmentStatus: (appointment: Appointment) => Promise<void>
  onShowAppointmentDetail: (appointment: Appointment) => void
  onDeleteAppointment: (appointment: Appointment) => Promise<void>
}
