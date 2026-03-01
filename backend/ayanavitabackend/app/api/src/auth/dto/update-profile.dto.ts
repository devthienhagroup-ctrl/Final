import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng' })
  birthDate?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'], { 
    message: 'Giới tính phải là MALE, FEMALE hoặc OTHER' 
  })
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;
}