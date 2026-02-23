import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(['USER', 'ADMIN'])
  role?: 'USER' | 'ADMIN'
}
