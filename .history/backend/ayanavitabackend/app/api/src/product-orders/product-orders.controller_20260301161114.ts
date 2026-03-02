import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ProductOrderStatus } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AdminUpdateProductOrderStatusDto } from './dto/admin-update-product-order-status.dto'
import { CreateProductOrderDto } from './dto/create-product-order.dto'
import { ProductOrdersService } from './product-orders.service'

@UseGuards(AccessTokenGuard)
@Controller('api/product-orders')
export class ProductOrdersController {
  constructor(private readonly productOrders: ProductOrdersService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateProductOrderDto) {
    return this.productOrders.create(user.sub, dto)
  }

  @Get('me')
  myOrders(@CurrentUser() user: JwtUser) {
    return this.productOrders.myOrders(user.sub)
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/list')
  adminList(@Query('status') status?: string, @Query('q') q?: string) {
    return this.productOrders.adminList({ status, q })
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('admin/:id/mark-paid')
  adminMarkPaid(@Param('id', ParseIntPipe) id: number) {
    return this.productOrders.markPaid(id)
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id/status')
  adminUpdateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateProductOrderStatusDto,
  ) {
    console.log('adminUpdateStatus', { id, status: dto.status })  
    return this.productOrders.adminUpdateStatus(id, dto.status as ProductOrderStatus)
  }

  @Get(':id')
  myOrderDetail(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.productOrders.myOrderDetail(user.sub, id)
  }

  @Post(':id/payment-qr')
  myOrderPaymentQr(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.productOrders.myOrderPaymentQr(user.sub, id)
  }
}
