export class BranchResponseDto {
  id!: number
  code!: string
  name!: string
  address!: string
  phone?: string | null
  isActive!: boolean
  translations?: Partial<Record<'en-US' | 'vi' | 'de', { name: string; address: string }>>
}

export class ServiceCatalogItemDto {
  id!: string
  dbId!: number
  name!: string
  cat!: string
  goal!: string[]
  duration!: number
  price!: number
  rating!: number
  booked!: number
  img?: string | null
  tag!: string
}

export class ServiceResponseDto {
  id!: number
  name!: string
  description?: string | null
  categoryId?: number | null
  category?: string | null
  goals!: string[]
  suitableFor!: string[]
  process!: string[]
  durationMin!: number
  price!: number
  ratingAvg!: number
  bookedCount!: number
  tag?: string | null
  imageUrl?: string | null
  branchIds!: number[]
  isActive!: boolean
  translations?: Partial<Record<'en-US' | 'vi' | 'de', { name: string; description?: string | null; goals?: string[]; suitableFor?: string[]; process?: string[]; tag?: string | null }>>
}

export class ServiceListResponseDto {
  items!: ServiceResponseDto[]
  total!: number
  page!: number
  pageSize!: number
  totalPages!: number
}

export class ServiceDetailResponseDto {
  id!: number
  name!: string
  description?: string | null
  categoryId?: number | null
  category?: string | null
  goals!: string[]
  suitableFor!: string[]
  process!: string[]
  durationMin!: number
  price!: number
  ratingAvg!: number
  bookedCount!: number
  tag?: string | null
  imageUrl?: string | null
  branchIds!: number[]
  isActive!: boolean
  translations?: Partial<Record<'en-US' | 'vi' | 'de', { name: string; description?: string | null; goals?: string[]; suitableFor?: string[]; process?: string[]; tag?: string | null }>>
  reviews!: ServiceReviewResponseDto[]
}

export class ServiceCategoryResponseDto {
  id!: number
  name!: string
  serviceCount!: number
  translations?: Partial<Record<'en-US' | 'vi' | 'de', { name: string }>>
}

export class SpecialistResponseDto {
  id!: number
  name!: string
  email!: string
  level!: string
  bio?: string | null
  branchId!: number
  serviceIds!: number[]
  translations?: Partial<Record<'en-US' | 'vi' | 'de', { name: string; bio?: string | null }>>
}

export class ServiceReviewResponseDto {
  id!: number
  serviceId!: number
  userId?: number | null
  stars!: number
  comment?: string | null
  customerName?: string | null
  createdAt!: Date
}

export class TempImageResponseDto {
  fileName!: string
  url!: string
  size!: number
}
