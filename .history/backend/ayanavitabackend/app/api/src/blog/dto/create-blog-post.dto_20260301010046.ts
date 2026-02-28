import { BlogPostStatus } from '@prisma/client'
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateBlogPostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string

  @IsString()
  @MinLength(20)
  content!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus
}
import { BlogPostStatus } from '@prisma/client'
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateBlogPostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string

  @IsString()
  @MinLength(20)
  content!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus
}
