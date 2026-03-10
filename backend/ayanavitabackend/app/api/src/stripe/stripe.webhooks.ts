import { Controller, Headers, HttpStatus, Post, RawBodyRequest, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import Stripe from 'stripe'
import { CoursePlanPaymentsService } from '../course-plans/course-plan-payments.service'
import { PaymentsService } from './stripe.service'

@Controller('webhooks')
export class StripeWebhookController {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })

  constructor(
      private readonly paymentsService: PaymentsService,
      private readonly coursePlanPayments: CoursePlanPaymentsService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
      @Req() req: RawBodyRequest<Request>,
      @Res() res: Response,
      @Headers('stripe-signature') signature?: string,
  ) {
    console.log("===== WEBHOOK STRIPE =====")
    console.log("Đã nhận webhook từ Stripe")

    if (!signature) {
      console.log("❌ Thiếu header stripe-signature")
      return res.status(HttpStatus.BAD_REQUEST).send('Missing stripe-signature header')
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) {
      console.log("❌ Chưa cấu hình STRIPE_WEBHOOK_SECRET")
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('STRIPE_WEBHOOK_SECRET is missing')
    }

    const rawBody = Buffer.isBuffer(req.rawBody)
        ? req.rawBody
        : Buffer.isBuffer(req.body)
            ? req.body
            : typeof req.body === 'string'
                ? Buffer.from(req.body, 'utf8')
                : null

    if (!rawBody) {
      console.log("❌ Không đọc được rawBody của webhook")
      return res.status(HttpStatus.BAD_REQUEST).send('Invalid raw webhook body')
    }

    console.log("✅ Đã qua kiểm tra signature, bắt đầu parse event")

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, endpointSecret)
      console.log("📩 Stripe gửi event:", event.type)
    } catch (err: any) {
      console.log("❌ Xác thực webhook thất bại:", err?.message)
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err?.message || 'Invalid signature'}`)
    }

    try {

      if (event.type === 'checkout.session.completed') {
        console.log("🧾 Event checkout.session.completed")

        const session = event.data.object as Stripe.Checkout.Session

        console.log("Session ID:", session.id)
        console.log("Metadata:", session.metadata)

        if (session.metadata?.orderId) {
          console.log("➡️ Cập nhật trạng thái order:", session.metadata.orderId)
          await this.paymentsService.markOrderPaidFromCheckoutSession(session)
          console.log("✅ Order đã được cập nhật thành PAID")
        } else {
          console.log("⚠️ Session không có metadata.orderId")
        }
      }

      console.log("➡️ Chuyển event sang CoursePlanPaymentsService xử lý")
      await this.coursePlanPayments.handleStripeEvent(event)
      console.log("✅ CoursePlanPaymentsService đã xử lý xong event")

    } catch (err) {
      console.log("❌ Lỗi khi xử lý webhook:", err)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ received: false })
    }

    console.log("✅ Webhook Stripe xử lý xong, trả về 200")
    console.log("===========================")

    return res.status(HttpStatus.OK).json({ received: true })
  }
}