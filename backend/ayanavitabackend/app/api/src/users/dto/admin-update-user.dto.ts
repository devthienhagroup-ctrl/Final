import { IsBoolean, IsDateString, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(191)
  phone?: string

  @IsOptional()
  @IsDateString()
  birthDate?: string

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string
}
