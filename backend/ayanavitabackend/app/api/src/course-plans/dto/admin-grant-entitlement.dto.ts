import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator'

export class AdminGrantEntitlementDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId!: number

  @IsOptional()
  @IsDateString()
  accessEndAt?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sourceId?: number
}
