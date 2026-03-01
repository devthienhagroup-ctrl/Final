import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export enum ScopeTypeDto {
  OWN = 'OWN',
  BRANCH = 'BRANCH',
  COURSE = 'COURSE',
  GLOBAL = 'GLOBAL',
}

export class CreateRoleDto {
  @IsString()
  @MaxLength(50)
  code!: string

  @IsEnum(ScopeTypeDto)
  scopeType!: ScopeTypeDto

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string
}
