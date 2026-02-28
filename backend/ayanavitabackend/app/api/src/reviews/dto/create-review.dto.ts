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
