import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class I18nTextDto {
  @IsOptional()
  @IsString()
  vi?: string

  @IsOptional()
  @IsString()
  'en-US'?: string

  @IsOptional()
  @IsString()
  de?: string
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
  @ValidateNested()
  @Type(() => I18nTextDto)
  titleI18n?: I18nTextDto

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  descriptionI18n?: I18nTextDto

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  shortDescriptionI18n?: I18nTextDto

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

  @IsOptional()
  @IsObject()
  extraMeta?: Record<string, unknown>
}
