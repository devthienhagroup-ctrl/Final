import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ProductOrderStatus } from '@prisma/client'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { PermissionGuard } from '../auth/guards/permission.guard'
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

  @UseGuards(PermissionGuard)
  @Permissions('orders.read')
  @Get('admin/list')
  adminList(@Query('status') status?: string, @Query('q') q?: string) {
    return this.productOrders.adminList({ status, q })
  }

  @UseGuards(PermissionGuard)
  @Permissions('orders.manage')
  @Post('admin/:id/mark-paid')
  adminMarkPaid(@Param('id', ParseIntPipe) id: number) {
    return this.productOrders.markPaid(id)
  }

  @UseGuards(PermissionGuard)
  @Permissions('orders.manage')
  @Patch('admin/:id/status')
  adminUpdateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateProductOrderStatusDto,
  ) {
    return this.productOrders.adminUpdateStatus(id, dto.status as ProductOrderStatus)
  }

  @Get(':id')
  myOrderDetail(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.productOrders.myOrderDetail(user.sub, id)
  }
}
