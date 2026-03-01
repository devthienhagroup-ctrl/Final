import { Transform } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ReviewType, ReviewVisibility } from '@prisma/client'

export class AdminReviewsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  branchId?: number

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  serviceId?: number

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  productId?: number

  @IsOptional()
  @IsEnum(ReviewType)
  type?: ReviewType

  @IsOptional()
  @IsEnum(ReviewVisibility)
  visibility?: ReviewVisibility

  @IsOptional()
  @IsString()
  q?: string
}

export class PublicReviewsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  branchId?: number

  @IsOptional()
  @IsEnum(ReviewType)
  type?: ReviewType
}
