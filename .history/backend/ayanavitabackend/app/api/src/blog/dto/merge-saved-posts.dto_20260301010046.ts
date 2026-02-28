import { IsArray, IsInt, Min } from 'class-validator'

export class MergeSavedPostsDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  blogIds!: number[]
}
import { IsArray, IsInt, Min } from 'class-validator'

export class MergeSavedPostsDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  blogIds!: number[]
}
