export class BranchResponseDto {
  id!: number
  code!: string
  name!: string
  address!: string
  phone?: string | null
  isActive!: boolean
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
}

export class ServiceCategoryResponseDto {
  id!: number
  name!: string
  serviceCount!: number
}

export class SpecialistResponseDto {
  id!: number
  code!: string
  name!: string
  level!: string
  bio?: string | null
  branchIds!: number[]
  serviceIds!: number[]
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
