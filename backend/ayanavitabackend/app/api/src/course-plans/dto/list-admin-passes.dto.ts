import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator'
import { UserCoursePassStatus } from '@prisma/client'

export class ListAdminPassesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  planId?: number

  @IsOptional()
  @IsEnum(UserCoursePassStatus)
  status?: UserCoursePassStatus
}
