import { Body, Controller, Headers, Post } from '@nestjs/common'
import { OrdersService } from './orders.service'

@Controller('hooks')
export class SepayWebhookController {
  constructor(private readonly orders: OrdersService) {}

  @Post('sepay-payment')
  async handlePayment(
    @Headers('authorization') authorization?: string,
    @Headers('x-sepay-key') xSepayKey?: string,
    @Headers('x-api-key') xApiKey?: string,
    @Body() payload?: any,
  ) {
    const token = xSepayKey ?? xApiKey ?? authorization?.replace(/^Bearer\s+/i, '').trim()
    await this.orders.assertWebhookKey(token)

    return this.orders.handleSepayWebhook(payload)
  }
}
