import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

class TranslationDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string
}

class LessonVideoDto {
  @IsString()
  title: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() sourceUrl?: string
  @IsOptional() @IsString() mediaType?: 'VIDEO' | 'IMAGE'
  @IsOptional() @IsInt() @Min(0) durationSec?: number
  @IsOptional() @IsInt() @Min(0) order?: number
  @IsOptional() @IsBoolean() published?: boolean
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
}

class LessonModuleDto {
  @IsString() title: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsInt() @Min(0) order?: number
  @IsOptional() @IsBoolean() published?: boolean
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LessonVideoDto)
  videos?: LessonVideoDto[]
}

export class CreateLessonDto {
  @IsString() title!: string
  @IsString() slug!: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsObject() @ValidateNested({ each: true }) @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>
  @IsOptional() @IsString() content?: string
  @IsOptional() @IsString() videoUrl?: string
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LessonModuleDto)
  modules?: LessonModuleDto[]
  @IsOptional() @IsInt() @Min(0) order?: number
  @IsOptional() @IsBoolean() published?: boolean
}
