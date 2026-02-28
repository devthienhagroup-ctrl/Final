import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator'
import { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto'
import { CartService } from './cart.service'

@UseGuards(AccessTokenGuard)
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMyCart(@CurrentUser() user: JwtUser) {
    return this.cartService.getMyCart(user.sub)
  }

  @Post('items')
  addItem(@CurrentUser() user: JwtUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto)
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: JwtUser,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.sub, itemId, dto)
  }

  @Delete('items/:itemId')
  removeItem(@CurrentUser() user: JwtUser, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.cartService.removeItem(user.sub, itemId)
  }

  @Post('merge')
  merge(@CurrentUser() user: JwtUser, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(user.sub, dto)
  }
}
