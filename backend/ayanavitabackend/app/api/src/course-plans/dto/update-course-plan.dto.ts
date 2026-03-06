import { Type } from 'class-transformer'
import { ArrayUnique, IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class UpdateCoursePlanDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  graceDays?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUnlocks?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxCoursePrice?: number | null

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  excludedTagIds?: number[]
}
