import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'
import { ReviewType } from '@prisma/client'

export class CreateReviewDto {
  @IsEnum(ReviewType)
  type!: ReviewType

  @Transform(({ value }) => Number(value))
  @IsInt()
  branchId!: number

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  serviceId?: number

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  productId?: number

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  productOrderId?: number

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  productOrderDetailId?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value == null) return undefined
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true' || normalized === '1') return true
      if (normalized === 'false' || normalized === '0') return false
    }
    return value
  })
  @IsBoolean()
  anonymous?: boolean

  @IsOptional()
  @IsString()
  customerName?: string

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number

  @IsString()
  @IsNotEmpty()
  comment!: string
}
