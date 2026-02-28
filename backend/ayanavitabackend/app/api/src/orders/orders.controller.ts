import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

type JwtUser = { sub: number; role: string }

@UseGuards(AccessTokenGuard)
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // USER: tạo order theo course
  @Post('courses/:id/order')
  create(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.createOrder(user.sub, id)
  }

  // USER: xem orders của tôi
  @Get('me/orders')
  myOrders(@CurrentUser() user: JwtUser) {
    return this.orders.myOrders(user.sub)
  }

  // ADMIN: list orders cho Admin UI
  // FE gọi: GET /orders?status=PENDING&q=abc
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('orders')
  list(@Query('status') status?: string, @Query('q') q?: string) {
    return this.orders.list({ status, q })
  }

  // ADMIN: mark paid (kích hoạt enrollment)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('orders/:id/mark-paid')
  markPaid(@Param('id', ParseIntPipe) id: number) {
    return this.orders.markPaid(id)
  }
}
