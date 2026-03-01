import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class RegisterNewDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsString()
  phone!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string


  @IsOptional()
  @IsDateString()
  birthDate?: string

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER'

  @IsOptional()
  @IsString()
  address?: string

  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string

  @IsBoolean()
  acceptedPolicy!: boolean
}
