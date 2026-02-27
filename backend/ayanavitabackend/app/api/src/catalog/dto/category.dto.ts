import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

export class CategoryTranslationDto {
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
  description?: string
}

export class CreateCategoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations!: CategoryTranslationDto[]
}

export class UpdateCategoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations?: CategoryTranslationDto[]
}
