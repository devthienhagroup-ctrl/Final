import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator'

export class AdminCreatePassDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  planId!: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseId?: number

  @IsOptional()
  @IsDateString()
  startAt?: string
}
