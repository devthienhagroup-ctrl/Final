import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CheckPermissionDto {
  @IsString()
  @IsNotEmpty()
  email!: string

  @IsString()
  @IsNotEmpty()
  roleCode!: string

  @IsString()
  @IsNotEmpty()
  module!: string

  @IsString()
  @IsNotEmpty()
  action!: string

  @IsOptional()
  @IsString()
  resource?: string
}
