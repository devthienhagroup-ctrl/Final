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
  branchIds: number[]
  isActive: boolean
}
export type CategoryForm = {
  name: string
}

export type SpecialistForm = { name: string; email: string; level: string; bio: string; branchId: number; serviceIds: number[] }
export type ReviewForm = { serviceId: number; stars: number; comment: string; customerName: string }

export type AdminLang = 'vi' | 'en-US' | 'de'

export type CommonTabProps = {
  loading: boolean
  lang?: AdminLang
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
  branches: Branch[]
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
  editingSpecialist: Specialist | null
  onSpecialistFormChange: (next: SpecialistForm) => void
  onSaveSpecialist: () => Promise<void>
  onEditSpecialist: (specialist: Specialist) => void
  onDeleteSpecialist: (specialist: Specialist) => Promise<void>
  onCancelEdit: () => void
}


export type AppointmentsTabProps = CommonTabProps & {
  appointments: Appointment[]
  specialists: Specialist[]
  branches: Branch[]
  services: SpaService[]
  isStaff: boolean
  onAssignSpecialist: (appointment: Appointment, specialistId: number | null) => Promise<void>
  onUpdateStatus: (appointment: Appointment, status: 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELED') => Promise<void>
  onDeleteAppointment: (appointment: Appointment) => Promise<void>
}
