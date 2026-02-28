import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common'
import { OrdersService } from './orders.service'

@Controller('hooks')
export class SepayWebhookController {
  constructor(private readonly orders: OrdersService) {}

  @Post('sepay-payment')
  async handlePayment(
      @Headers('authorization') authorization?: string,
      @Body() payload?: any,
  ) {
    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header')
    }

    // SePay gửi: Authorization: Apikey YOUR_KEY
    const match = authorization.match(/^Apikey\s+(.+)$/i)
    if (!match) {
      throw new UnauthorizedException('Invalid Authorization format')
    }

    const apiKey = match[1].trim()

    await this.orders.assertWebhookKey(apiKey)

    return this.orders.handleSepayWebhook(payload)
  }
}