import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

export enum CheckoutPaymentMethod {
  COD = 'COD',
  SEPAY = 'SEPAY',
}

export class CreateProductOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty!: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number
}

export class CreateProductOrderShippingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  receiverName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  addressLine!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  district!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city!: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string
}

export class CreateProductOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductOrderItemDto)
  items!: CreateProductOrderItemDto[]

  @ValidateNested()
  @Type(() => CreateProductOrderShippingDto)
  shipping!: CreateProductOrderShippingDto

  @IsEnum(CheckoutPaymentMethod)
  paymentMethod!: CheckoutPaymentMethod
}


export class ProductOrderDetailDto {
  productName!: string
  productSku!: string
  quantity!: number
  unitPrice!: number | string
  productImage?: string | null
}
