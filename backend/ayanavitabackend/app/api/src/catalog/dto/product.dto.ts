import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

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
