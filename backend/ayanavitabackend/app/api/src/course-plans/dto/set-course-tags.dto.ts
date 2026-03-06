import { Type } from 'class-transformer'
import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator'

export class SetCourseTagsDto {
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  tagIds!: number[]
}
