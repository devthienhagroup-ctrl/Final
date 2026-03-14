import { Controller, Headers, HttpStatus, Post, RawBodyRequest, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import Stripe from 'stripe'
import { CoursePlanPaymentsService } from '../course-plans/course-plan-payments.service'
import { StripeRealtimeService } from './stripe-realtime.service'
import { PaymentsService } from './stripe.service'

@Controller('webhooks')
export class StripeWebhookController {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly coursePlanPayments: CoursePlanPaymentsService,
    private readonly stripeRealtime: StripeRealtimeService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('stripe-signature') signature?: string,
  ) {
    console.log('===== WEBHOOK STRIPE =====')
    console.log('Đã nhận webhook từ Stripe')

    if (!signature) {
      console.log('❌ Thiếu header stripe-signature')
      return res.status(HttpStatus.BAD_REQUEST).send('Missing stripe-signature header')
    }

    const endpointSecrets = this.getWebhookSecrets()
    if (!endpointSecrets.length) {
      console.log('❌ Missing Stripe webhook signing secret')
      return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Missing Stripe webhook secret. Set STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET_CLI')
    }

    const rawPayload = this.resolveRawPayload(req)
    if (!rawPayload) {
      console.log('❌ req.rawBody does not exist or is not a Buffer')
      console.log('typeof req.body =', typeof req.body)
      console.log('isBuffer(req.body) =', Buffer.isBuffer(req.body))
      return res.status(HttpStatus.BAD_REQUEST).send('Raw body is required for Stripe webhook verification')
    }

    console.log('➡️ Bắt đầu verify webhook signature')

    let event: Stripe.Event | null = null
    let lastVerifyError: any = null

    for (const endpointSecret of endpointSecrets) {
      try {
        event = this.stripe.webhooks.constructEvent(
            rawPayload,
            signature,
            endpointSecret,
        )
        break
      } catch (err: any) {
        lastVerifyError = err
      }
    }

    if (!event) {
      console.log('❌ Xác thực webhook thất bại:', lastVerifyError?.message)
      console.log('configured webhook secrets =', endpointSecrets.length)
      console.log('secret prefixes =', endpointSecrets.map((s) => s.slice(0, 8)).join(', '))
      return res
          .status(HttpStatus.BAD_REQUEST)
          .send(`Webhook Error: ${lastVerifyError?.message || 'Invalid signature'}`)
    }

    console.log('✅ Verify webhook signature thành công')
    console.log('📩 Stripe gửi event:', event.type)

    try {
      if (event.type === 'checkout.session.completed') {
        console.log('🧾 Event checkout.session.completed')

        const session = event.data.object as Stripe.Checkout.Session

        console.log('Session ID:', session.id)
        console.log('Metadata:', session.metadata)

        if (session.metadata?.orderId) {
          console.log('➡️ Cập nhật trạng thái order:', session.metadata.orderId)
          await this.paymentsService.markOrderPaidFromCheckoutSession(session)
          console.log('✅ Order đã được cập nhật thành PAID')
        } else {
          console.log('⚠️ Session không có metadata.orderId')
        }
      }

      console.log('➡️ Chuyển event sang CoursePlanPaymentsService xử lý')
      await this.coursePlanPayments.handleStripeEvent(event)
      console.log('✅ CoursePlanPaymentsService đã xử lý xong event')

      const realtimeUserId = this.extractRealtimeUserId(event)
      if (realtimeUserId) {
        this.stripeRealtime.emitPaymentUpdate(realtimeUserId, {
          source: 'STRIPE_WEBHOOK',
          eventType: event.type,
          at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.log('❌ Lỗi khi xử lý webhook:', err)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ received: false })
    }

    console.log('✅ Webhook Stripe xử lý xong, trả về 200')
    console.log('===========================')

    return res.status(HttpStatus.OK).json({ received: true })
  }

  private resolveRawPayload(req: RawBodyRequest<Request>) {
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      return req.rawBody
    }

    const body = req.body as unknown

    if (Buffer.isBuffer(body)) {
      return body
    }

    if (typeof body === 'string') {
      return Buffer.from(body)
    }

    return null
  }

  private getWebhookSecrets() {
    const candidates = [
      process.env.STRIPE_WEBHOOK_SECRET,
      process.env.STRIPE_WEBHOOK_SECRET_CLI,
      ...(process.env.STRIPE_WEBHOOK_SECRETS || '').split(','),
    ]

    const unique = new Set<string>()

    for (const candidate of candidates) {
      const secret = String(candidate || '')
          .trim()
          .replace(/^['"]|['"]$/g, '')

      if (secret) {
        unique.add(secret)
      }
    }

    return Array.from(unique)
  }

  private extractRealtimeUserId(event: Stripe.Event) {
    const obj: any = event?.data?.object || {}
    const candidates = [
      obj?.metadata?.userId,
      obj?.client_reference_id,
      obj?.userId,
      obj?.subscription_details?.metadata?.userId,
      obj?.lines?.data?.[0]?.metadata?.userId,
    ]

    for (const candidate of candidates) {
      const userId = Number(candidate)
      if (Number.isInteger(userId) && userId > 0) {
        return userId
      }
    }

    return null
  }
}
