import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

export class ProductGuideStepDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order!: number

  @IsString()
  @IsNotEmpty()
  content!: string
}

export class ProductGuideContentDto {
  @IsString()
  @IsNotEmpty()
  intro!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductGuideStepDto)
  steps!: ProductGuideStepDto[]
}

export class ProductTranslationDto {
  @IsString()
  @MaxLength(10)
  languageCode!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductGuideContentDto)
  guideContent?: ProductGuideContentDto
}

export class CreateProductDto {
  @IsString()
  @MaxLength(64)
  sku!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number

  @Type(() => Number)
  @IsNumber()
  price!: number

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations!: ProductTranslationDto[]
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations?: ProductTranslationDto[]
}
