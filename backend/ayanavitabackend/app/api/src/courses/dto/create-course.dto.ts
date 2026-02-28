import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator'

class TranslationDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  shortDescription?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[]
}

class ContentTranslationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[]
}

export class CreateCourseDto {
  @IsString()
  slug: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  shortDescription?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  thumbnail?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @IsBoolean()
  published?: boolean

  @IsOptional()
  @IsInt()
  @Min(1)
  topicId?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[]

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ContentTranslationDto)
  contentTranslations?: Record<string, ContentTranslationDto>

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  ratingAvg?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  ratingCount?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  enrollmentCount?: number
}
