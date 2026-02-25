import type { Appointment, Branch, ServiceCategory, ServiceReview, SpaService, Specialist } from '../../../api/spaAdmin.api'

export type BranchForm = Partial<Branch>
export type ServiceForm = {
  name: string
  description: string
  categoryId: number
  goals: string
  suitableFor: string
  process: string
  durationMin: number
  price: number
  tag: string
}
export type CategoryForm = {
  name: string
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
  categories: ServiceCategory[]
  serviceForm: ServiceForm
  editingService: SpaService | null
  selectedImageName: string
  searchKeyword: string
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  onSearchKeywordChange: (value: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onServiceFormChange: (next: ServiceForm) => void
  onSelectImage: (file: File | null) => void
  onSaveService: () => Promise<void>
  onEditService: (service: SpaService) => void
  onDeleteService: (service: SpaService) => Promise<void>
  onCancelEdit: () => void
}

export type CategoriesTabProps = CommonTabProps & {
  categories: ServiceCategory[]
  categoryForm: CategoryForm
  editingCategory: ServiceCategory | null
  onCategoryFormChange: (next: CategoryForm) => void
  onSaveCategory: () => Promise<void>
  onEditCategory: (category: ServiceCategory) => void
  onDeleteCategory: (category: ServiceCategory) => Promise<void>
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
