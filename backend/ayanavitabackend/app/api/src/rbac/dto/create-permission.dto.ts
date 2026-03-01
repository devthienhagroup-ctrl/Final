import { IsString, MaxLength } from 'class-validator'

export class CreatePermissionDto {
  @IsString()
  @MaxLength(120)
  code!: string

  @IsString()
  @MaxLength(80)
  resource!: string

  @IsString()
  @MaxLength(80)
  action!: string
}
