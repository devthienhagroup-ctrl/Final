import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

class I18nTextDto {
  @IsOptional()
  @IsString()
  vi?: string

  @IsOptional()
  @IsString()
  'en'?: string

  @IsOptional()
  @IsString()
  de?: string
}

class LessonVideoDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  titleI18n?: I18nTextDto

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  descriptionI18n?: I18nTextDto

  @IsOptional()
  @IsString()
  sourceUrl?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number

  @IsOptional()
  @IsBoolean()
  published?: boolean
}

class LessonModuleDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  titleI18n?: I18nTextDto

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  descriptionI18n?: I18nTextDto

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number

  @IsOptional()
  @IsBoolean()
  published?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonVideoDto)
  videos?: LessonVideoDto[]
}

export class CreateLessonDto {
  @IsString()
  title!: string

  @IsString()
  slug!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  titleI18n?: I18nTextDto

  @IsOptional()
  @ValidateNested()
  @Type(() => I18nTextDto)
  descriptionI18n?: I18nTextDto

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  videoUrl?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonModuleDto)
  modules?: LessonModuleDto[]

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number

  @IsOptional()
  @IsBoolean()
  published?: boolean
}
