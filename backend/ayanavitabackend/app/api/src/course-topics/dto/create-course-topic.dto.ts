import { Type } from 'class-transformer'
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'

class CourseTopicTranslationItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string
}

class CourseTopicTranslationsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseTopicTranslationItemDto)
  vi?: CourseTopicTranslationItemDto

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseTopicTranslationItemDto)
  'en-US'?: CourseTopicTranslationItemDto

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseTopicTranslationItemDto)
  de?: CourseTopicTranslationItemDto
}

export class CreateCourseTopicDto {
  @IsString()
  @MaxLength(120)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseTopicTranslationsDto)
  translations?: CourseTopicTranslationsDto
}
