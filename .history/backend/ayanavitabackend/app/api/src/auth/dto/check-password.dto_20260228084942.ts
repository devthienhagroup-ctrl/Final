import { IsString } from 'class-validator'

export class CheckPasswordDto {
  @IsString()
  currentPassword!: string
}