import { Transform } from 'class-transformer'
import { IsArray, IsInt, IsOptional, Min } from 'class-validator'

export class HelpfulHistoryQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  pageSize = 10
}

export class MergeHelpfulDto {
  @IsArray()
  reviewIds!: Array<number | string>
}
