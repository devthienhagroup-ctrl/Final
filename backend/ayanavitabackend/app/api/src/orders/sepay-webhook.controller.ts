import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common'
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
    const bearerToken = authorization?.replace(/^Bearer\s+/i, '').trim()
    const apiKeyToken = authorization?.match(/^Apikey\s+(.+)$/i)?.[1]?.trim()
    const token = xSepayKey ?? xApiKey ?? apiKeyToken ?? bearerToken

    if (!token) {
      throw new UnauthorizedException('Missing webhook key')
    }

    // await this.orders.assertWebhookKey(token)

    //Thanh toán cho Courses
    return this.orders.handleSepayWebhook(payload)
  }
}
