import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class PublicCatalogQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  categoryIds?: string

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

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number

  @IsOptional()
  @IsString()
  @IsIn(['newest', 'priceAsc', 'priceDesc', 'nameAsc', 'nameDesc'])
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc'

  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en', 'de'])
  lang?: 'vi' | 'en' | 'de'
}
