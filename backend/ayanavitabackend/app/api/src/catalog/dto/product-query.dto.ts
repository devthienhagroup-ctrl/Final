import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string

  @IsOptional()
  @IsString()
  @IsIn(['active', 'draft'])
  status?: 'active' | 'draft'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number
}
