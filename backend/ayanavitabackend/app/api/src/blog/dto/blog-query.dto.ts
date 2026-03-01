import { BlogPostStatus } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export enum BlogSortMode {
  NEW = 'new',
  POPULAR = 'popular',
}

export class BlogQueryDto {
  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @IsString()
  tag?: string

  @IsOptional()
  @IsEnum(BlogSortMode)
  sort?: BlogSortMode = BlogSortMode.NEW

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10
}
