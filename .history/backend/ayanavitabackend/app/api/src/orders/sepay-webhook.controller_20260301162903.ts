import { Body, Controller, Headers, MessageEvent, Post, Query, Sse, UnauthorizedException } from '@nestjs/common'
import { EventEmitter } from 'events'
import { Observable } from 'rxjs'
import { OrdersService } from './orders.service'

@Controller('hooks')
export class SepayWebhookController {
  private static readonly paymentEvents = new EventEmitter()

  constructor(private readonly orders: OrdersService) {}

  @Sse('sepay-payment/stream')
  streamPaymentStatus(@Query('orderId') orderId?: string): Observable<MessageEvent> {
    const normalizedOrderId = String(orderId ?? '').trim()

    return new Observable<MessageEvent>((subscriber) => {
      const handler = (payload: { orderId: string; status: 'PAID'; source: 'WEBHOOK' }) => {
        if (normalizedOrderId && payload.orderId !== normalizedOrderId) return
        subscriber.next({ data: payload })
      }

      SepayWebhookController.paymentEvents.on('product_order_paid', handler)
      return () => {
        SepayWebhookController.paymentEvents.off('product_order_paid', handler)
      }
    })
  }

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
    const result = await this.orders.handleSepayWebhook(payload)

if (
  result?.ok &&
  (!('ignored' in result) || !result.ignored) &&
  result?.orderId &&
  result?.paymentId
) {
  SepayWebhookController.paymentEvents.emit('product_order_paid', {
    orderId: String(result.orderId),
    status: 'PAID',
    source: 'WEBHOOK',
  })
}

    return result
  }
}
