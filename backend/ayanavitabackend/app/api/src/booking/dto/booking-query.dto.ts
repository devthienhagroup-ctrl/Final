import { Transform, Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class BookingFilterQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branchId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId?: number

  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeInactive?: boolean
}
export class AppointmentStatsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branchId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specialistId?: number

  @IsOptional()
  @IsString()
  customerPhone?: string
}