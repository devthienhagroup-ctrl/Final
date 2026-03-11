import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CoursePlanPaymentStatus, Prisma, UserCoursePassStatus } from '@prisma/client'
import Stripe from 'stripe'
import * as tls from 'tls'
import { PrismaService } from '../prisma/prisma.service'
import { CoursePlansService } from './course-plans.service'
import { PurchasePlanDto, PurchasePlanMethod } from './dto/purchase-plan.dto'

const PLAN_TAG_INCLUDE = {
  excludedTags: {
    include: {
      tag: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: { tagId: 'asc' as const },
  },
} as const

const PAYMENT_WITH_PLAN_INCLUDE = {
  plan: {
    include: PLAN_TAG_INCLUDE,
  },
} as const

type CoursePlanWithTags = Prisma.CoursePlanGetPayload<{
  include: typeof PLAN_TAG_INCLUDE
}>

type CoursePlanPaymentWithPlan = Prisma.CoursePlanPaymentGetPayload<{
  include: typeof PAYMENT_WITH_PLAN_INCLUDE
}>

type PassSummary = {
  id: number
  planId: number
  purchaseId: number | null
  startAt: Date
  endAt: Date
  graceUntil: Date
  remainingUnlocks: number
  status: UserCoursePassStatus
  canceledAt: Date | null
  createdAt: Date
}



type SubscriptionMapping = {
  userId: number
  planId: number
}

type UserPlanSubscriptionSummary = {
  stripeSubscriptionId: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  canceledAt: Date | null
}

type SubscriptionActionInput = {
  passId?: number
  planId?: number
}

@Injectable()
export class CoursePlanPaymentsService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })
  private readonly logger = new Logger(CoursePlanPaymentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: CoursePlansService,
  ) {}

  private readonly bankInfo = {
    gateway: 'BIDV',
    accountNumber: '8810091561',
    accountName: 'LE MINH HIEU',
  }

  private normalizeStatus(status: CoursePlanPaymentStatus, expiredAt: Date | null, now: Date): CoursePlanPaymentStatus {
    if (status === CoursePlanPaymentStatus.PENDING && expiredAt && expiredAt <= now) {
      return CoursePlanPaymentStatus.EXPIRED
    }
    return status
  }

  private addMinutes(base: Date, minutes: number) {
    const out = new Date(base)
    out.setTime(out.getTime() + minutes * 60_000)
    return out
  }

  private addDays(base: Date, days: number) {
    const out = new Date(base)
    out.setUTCDate(out.getUTCDate() + days)
    return out
  }

  private derivePassStatus(
    pass: { startAt: Date; endAt: Date; graceUntil: Date; canceledAt: Date | null },
    now: Date,
  ): UserCoursePassStatus {
    if (pass.canceledAt) return UserCoursePassStatus.CANCELED
    if (now < pass.startAt) return UserCoursePassStatus.EXPIRED
    if (now < pass.endAt) return UserCoursePassStatus.ACTIVE
    if (now < pass.graceUntil) return UserCoursePassStatus.GRACE
    return UserCoursePassStatus.EXPIRED
  }

  private genTransferCode() {
    return `PLAN_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }

  private buildTransferContent(paymentId: number) {
    return `ID${paymentId}CoursePlanPayment`
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  }

  private extractStripeId(value: string | { id: string } | null | undefined): string | null {
    if (!value) return null
    if (typeof value === 'string') return value
    return typeof value.id === 'string' ? value.id : null
  }

  parseTransferContent(content?: string | null): number | null {
    if (!content) return null
    const matched = content.match(/ID(\d+)CoursePlanPayment/i)
    if (!matched?.[1]) return null

    const paymentId = Number(matched[1])
    if (!Number.isInteger(paymentId) || paymentId <= 0) return null
    return paymentId
  }

  private mapPlan(plan: CoursePlanPaymentWithPlan['plan']) {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      stripeProductId: plan.stripeProductId,
      currentStripePriceId: plan.currentStripePriceId,
      durationDays: plan.durationDays,
      graceDays: plan.graceDays,
      maxUnlocks: plan.maxUnlocks,
      maxCoursePrice: plan.maxCoursePrice,
      isActive: plan.isActive,
      excludedTags: plan.excludedTags.map((row) => ({
        id: row.tag.id,
        code: row.tag.code,
        name: row.tag.name,
      })),
      excludedTagIds: plan.excludedTags.map((row) => row.tagId),
    }
  }

  private mapPassSummary(pass?: PassSummary) {
    if (!pass) return null

    const now = new Date()
    const computedStatus = this.derivePassStatus(
      {
        startAt: pass.startAt,
        endAt: pass.endAt,
        graceUntil: pass.graceUntil,
        canceledAt: pass.canceledAt,
      },
      now,
    )

    return {
      id: pass.id,
      planId: pass.planId,
      purchaseId: pass.purchaseId,
      startAt: pass.startAt,
      endAt: pass.endAt,
      graceUntil: pass.graceUntil,
      remainingUnlocks: pass.remainingUnlocks,
      status: pass.status,
      computedStatus,
      canceledAt: pass.canceledAt,
      createdAt: pass.createdAt,
    }
  }

  private mapSubscriptionSummary(
    subscription:
      | {
          stripeSubscriptionId: string
          status: string
          cancelAtPeriodEnd: boolean
          currentPeriodStart: Date | null
          currentPeriodEnd: Date | null
          canceledAt: Date | null
        }
      | undefined
      | null,
  ): UserPlanSubscriptionSummary | null {
    if (!subscription) return null

    return {
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: subscription.status,
      cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
      currentPeriodStart: subscription.currentPeriodStart ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd ?? null,
      canceledAt: subscription.canceledAt ?? null,
    }
  }

  private mapPayment(
    payment: CoursePlanPaymentWithPlan,
    now: Date,
    pass?: PassSummary,
    subscription?: UserPlanSubscriptionSummary | null,
  ) {
    const status = this.normalizeStatus(payment.status, payment.expiredAt, now)
    const mappedSubscription = this.mapSubscriptionSummary(subscription)

    const sepay =
      status === CoursePlanPaymentStatus.PENDING && payment.provider === 'SEPAY'
        ? {
            webhookUrl: '/hooks/sepay-payment',
            amount: payment.amount,
            accountName: this.bankInfo.accountName,
            accountNumber: this.bankInfo.accountNumber,
            bankName: this.bankInfo.gateway,
            bankCode: this.bankInfo.gateway,
            transferContent: payment.transferContent,
            qrUrl: `https://qr.sepay.vn/img?acc=${this.bankInfo.accountNumber}&bank=${this.bankInfo.gateway}&des=${payment.transferContent}&amount=${payment.amount}`,
            expiresAt: payment.expiredAt,
          }
        : null

    const rawResponseMode = String((payment.rawResponse as any)?.mode || '').toLowerCase()
    const paymentSource =
      payment.provider === 'SEPAY'
        ? 'SEPAY_QR'
        : payment.stripeSubscriptionId || rawResponseMode === 'subscription'
          ? 'STRIPE_SUBSCRIPTION'
          : 'STRIPE_ONE_TIME'

    return {
      id: payment.id,
      userId: payment.userId,
      planId: payment.planId,
      provider: payment.provider,
      paymentSource,
      status: payment.status,
      computedStatus: status,
      amount: payment.amount,
      transferCode: payment.transferCode,
      transferContent: payment.transferContent,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeInvoiceId: payment.stripeInvoiceId,
      stripeSubscriptionId: payment.stripeSubscriptionId,
      subscriptionStatus: mappedSubscription?.status ?? null,
      cancelAtPeriodEnd: mappedSubscription?.cancelAtPeriodEnd ?? false,
      subscriptionCurrentPeriodStart: mappedSubscription?.currentPeriodStart ?? null,
      subscriptionCurrentPeriodEnd: mappedSubscription?.currentPeriodEnd ?? null,
      subscriptionCanceledAt: mappedSubscription?.canceledAt ?? null,
      failureReason: payment.failureReason,
      paidAt: payment.paidAt,
      expiredAt: payment.expiredAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      plan: this.mapPlan(payment.plan),
      pass: this.mapPassSummary(pass),
      subscription: mappedSubscription,
      sepay,
    }
  }

  private async getActivePlanOrThrow(planId: number): Promise<CoursePlanWithTags> {
    const plan = await this.prisma.coursePlan.findUnique({
      where: { id: planId },
      include: PLAN_TAG_INCLUDE,
    })

    if (!plan) throw new NotFoundException('Course plan not found')
    if (!plan.isActive) throw new ForbiddenException('Course plan is not active')

    return plan
  }

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) throw new NotFoundException('User not found')
  }

  private async ensurePassFromPayment(userId: number, planId: number, purchaseId: number) {
    const existingPass = await this.prisma.userCoursePass.findFirst({
      where: {
        userId,
        planId,
        purchaseId,
      },
      select: {
        id: true,
      },
    })

    if (existingPass) {
      return existingPass.id
    }

    const plan = await this.prisma.coursePlan.findUnique({
      where: { id: planId },
      select: {
        durationDays: true,
        graceDays: true,
        maxUnlocks: true,
      },
    })

    if (!plan) {
      throw new NotFoundException('Course plan not found')
    }

    const now = new Date()
    const existingScheduled = await this.prisma.userCoursePass.findFirst({
      where: {
        userId,
        canceledAt: null,
        startAt: { gt: now },
      },
      select: { id: true },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
    })

    if (existingScheduled) {
      throw new BadRequestException('You already have a scheduled pass for the next cycle')
    }

    const latestPass = await this.prisma.userCoursePass.findFirst({
      where: {
        userId,
        canceledAt: null,
      },
      select: {
        endAt: true,
        graceUntil: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    const startAt = latestPass && now < latestPass.graceUntil ? latestPass.endAt : now
    const endAt = this.addDays(startAt, plan.durationDays)
    const graceUntil = this.addDays(endAt, plan.graceDays)

    const pass = await this.prisma.userCoursePass.create({
      data: {
        userId,
        planId,
        purchaseId,
        startAt,
        endAt,
        graceUntil,
        remainingUnlocks: plan.maxUnlocks,
        status: this.derivePassStatus(
          {
            startAt,
            endAt,
            graceUntil,
            canceledAt: null,
          },
          now,
        ),
      },
      select: {
        id: true,
      },
    })

    this.logger.debug('Đã tạo course pass thành công', JSON.stringify({ userId, planId, purchaseId, passId: pass.id }))
    return pass.id
  }

  private async reconcileMissingStripePasses(userId: number) {
    const stripePaidPayments = await this.prisma.coursePlanPayment.findMany({
      where: {
        userId,
        provider: 'STRIPE',
        status: CoursePlanPaymentStatus.PAID,
      },
      orderBy: [{ id: 'desc' }],
      take: 200,
      select: {
        id: true,
        userId: true,
        planId: true,
      },
    })

    if (!stripePaidPayments.length) return

    const purchaseIds = stripePaidPayments.map((row) => row.id)
    const existedPasses = await this.prisma.userCoursePass.findMany({
      where: {
        userId,
        purchaseId: { in: purchaseIds },
      },
      select: { purchaseId: true },
    })

    const existingPurchaseIdSet = new Set<number>()
    for (const pass of existedPasses) {
      if (typeof pass.purchaseId === 'number') {
        existingPurchaseIdSet.add(pass.purchaseId)
      }
    }

    for (const payment of stripePaidPayments) {
      if (existingPurchaseIdSet.has(payment.id)) continue
      await this.ensurePassFromPayment(payment.userId, payment.planId, payment.id)
    }
  }

  private async markExpiredPendingPayments(userId: number, planId?: number) {
    const now = new Date()

    await this.prisma.coursePlanPayment.updateMany({
      where: {
        userId,
        provider: 'SEPAY',
        status: CoursePlanPaymentStatus.PENDING,
        expiredAt: { lte: now },
        ...(planId ? { planId } : {}),
      },
      data: {
        status: CoursePlanPaymentStatus.EXPIRED,
      },
    })
  }

  private resolveStripeReturnUrls(dto?: PurchasePlanDto) {
    const frontendBase = (process.env.FRONTEND_BASE_URL || 'http://localhost:5176').replace(/\/$/, '')

    return {
      successUrl:
        dto?.successUrl ||
        `${frontendBase}/account-center?tab=subscriptions&stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: dto?.cancelUrl || `${frontendBase}/account-center?tab=subscriptions&stripe=cancel`,
    }
  }

  private async ensureStripeCustomer(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    })

    if (!user) throw new NotFoundException('User not found')

    if (user.stripeCustomerId) {
      return user.stripeCustomerId
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: String(user.id) },
    })

    await this.prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    })

    return customer.id
  }

  private assertStripeConfigured() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new BadRequestException('STRIPE_SECRET_KEY is missing in environment')
    }
  }

  private async resolveUserSubscriptionForAction(userId: number, input: SubscriptionActionInput) {
    let planId = input.planId
    let preferredSubscriptionId: string | null = null

    if (input.passId) {
      const pass = await this.prisma.userCoursePass.findFirst({
        where: {
          id: input.passId,
          userId,
        },
        select: {
          id: true,
          planId: true,
          purchaseId: true,
        },
      })

      if (!pass) {
        throw new NotFoundException('Course pass not found')
      }

      planId = planId ?? pass.planId

      if (pass.purchaseId) {
        const payment = await this.prisma.coursePlanPayment.findUnique({
          where: { id: pass.purchaseId },
          select: {
            planId: true,
            stripeSubscriptionId: true,
          },
        })

        if (payment?.stripeSubscriptionId) {
          preferredSubscriptionId = payment.stripeSubscriptionId
        }

        if (!planId && payment?.planId) {
          planId = payment.planId
        }
      }
    }

    if (!planId) {
      const now = new Date()
      const effectivePass = await this.prisma.userCoursePass.findFirst({
        where: {
          userId,
          canceledAt: null,
          startAt: { lte: now },
          graceUntil: { gte: now },
        },
        select: {
          planId: true,
        },
        orderBy: [{ graceUntil: 'desc' }, { id: 'desc' }],
      })

      if (effectivePass?.planId) {
        planId = effectivePass.planId
      }
    }

    if (!planId) {
      throw new BadRequestException('Cannot resolve plan for current subscription')
    }

    const selectSubscription = {
      stripeSubscriptionId: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      canceledAt: true,
    } as const

    let subscription = preferredSubscriptionId
      ? await this.prisma.userPlanSubscription.findFirst({
          where: {
            userId,
            planId,
            stripeSubscriptionId: preferredSubscriptionId,
          },
          select: selectSubscription,
        })
      : null

    if (!subscription) {
      subscription = await this.prisma.userPlanSubscription.findFirst({
        where: {
          userId,
          planId,
        },
        select: selectSubscription,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      })
    }

    if (!subscription) {
      throw new NotFoundException('Auto-renew subscription not found')
    }

    return {
      planId,
      subscription,
    }
  }

  async cancelAutoRenewal(userId: number, input: SubscriptionActionInput) {
    this.assertStripeConfigured()

    const { planId, subscription } = await this.resolveUserSubscriptionForAction(userId, input)

    if (subscription.status === 'canceled' || subscription.cancelAtPeriodEnd) {
      return {
        ok: true,
        alreadyCanceled: true,
        planId,
        subscription: this.mapSubscriptionSummary(subscription),
      }
    }

    const stripeSubscription = await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await this.onStripeSubscriptionChanged(stripeSubscription)

    const latest = await this.prisma.userPlanSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.stripeSubscriptionId },
      select: {
        stripeSubscriptionId: true,
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        canceledAt: true,
      },
    })

    const periodEnd =
      this.toDateOrNull((stripeSubscription as any)?.current_period_end) ??
      latest?.currentPeriodEnd ??
      subscription.currentPeriodEnd ??
      null

    void this.sendAutoRenewCanceledEmail(userId, planId, periodEnd).catch((error) => {
      this.logger.error(`Failed to send cancel auto-renew email for userId=${userId}`, error?.stack ?? String(error))
    })

    return {
      ok: true,
      alreadyCanceled: false,
      planId,
      subscription: this.mapSubscriptionSummary(latest ?? subscription),
    }
  }

  async resumeAutoRenewal(userId: number, input: SubscriptionActionInput) {
    this.assertStripeConfigured()

    const { planId, subscription } = await this.resolveUserSubscriptionForAction(userId, input)

    if (subscription.status === 'canceled') {
      throw new BadRequestException('Subscription has already ended and cannot be resumed')
    }

    if (!subscription.cancelAtPeriodEnd) {
      return {
        ok: true,
        alreadyResumed: true,
        planId,
        subscription: this.mapSubscriptionSummary(subscription),
      }
    }

    const stripeSubscription = await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    await this.onStripeSubscriptionChanged(stripeSubscription)

    const latest = await this.prisma.userPlanSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.stripeSubscriptionId },
      select: {
        stripeSubscriptionId: true,
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        canceledAt: true,
      },
    })

    return {
      ok: true,
      alreadyResumed: false,
      planId,
      subscription: this.mapSubscriptionSummary(latest ?? subscription),
    }
  }
  private escapeHtml(input: string) {
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private formatMoney(amount: number, currency = 'vnd') {
    const value = Number(amount || 0)
    const normalizedCurrency = String(currency || 'vnd').toUpperCase()

    try {
      if (/^[A-Z]{3}$/.test(normalizedCurrency)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: normalizedCurrency }).format(value)
      }
    } catch {
      // Fall through to the fallback formatting below.
    }

    return `${new Intl.NumberFormat('vi-VN').format(value)} ${normalizedCurrency}`
  }

  private formatDateTime(value: Date | string | null | undefined) {
    if (!value) return 'Không xác định'
    const parsed = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Không xác định'
    return parsed.toLocaleString('vi-VN', { hour12: false })
  }

  private resolveAccountUrl() {
    const base = (process.env.FRONTEND_BASE_URL || 'http://localhost:5176').replace(/\/$/, '')
    return `${base}/account-center?tab=subscriptions`
  }

  private getInvoicePeriodEnd(invoice: Stripe.Invoice) {
    const invoiceAny = invoice as any
    const firstLine = invoiceAny?.lines?.data?.[0]

    return (
      this.toDateOrNull(firstLine?.period?.end) ??
      this.toDateOrNull(invoiceAny?.period_end) ??
      this.toDateOrNull(invoiceAny?.next_payment_attempt) ??
      null
    )
  }

  private buildSubscriptionEmailHtml(params: {
    themeStart: string
    themeEnd: string
    title: string
    customerName: string
    intro: string
    infoTitle: string
    infoRows: Array<{ label: string; value: string }>
    note: string
    ctaLabel: string
    accountUrl: string
  }) {
    const rows = params.infoRows
      .map(
        (row) =>
          `<strong>${this.escapeHtml(row.label)}:</strong> ${this.escapeHtml(row.value)}<br />`,
      )
      .join('')

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f7fb;margin:0;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,${this.escapeHtml(params.themeStart)},${this.escapeHtml(params.themeEnd)});padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">AYANAVITA</div>
              <div style="margin-top:10px;font-size:22px;line-height:30px;font-weight:700;color:#ffffff;">
                ${this.escapeHtml(params.title)}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 20px 40px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:26px;">Xin chào <strong>${this.escapeHtml(params.customerName)}</strong>,</p>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:26px;">${this.escapeHtml(params.intro)}</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:12px;">${this.escapeHtml(params.infoTitle)}</div>
                    <div style="font-size:14px;line-height:24px;color:#374151;">${rows}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:15px;line-height:25px;color:#4b5563;">${this.escapeHtml(params.note)}</p>

              <div style="text-align:center;margin:28px 0 8px 0;">
                <a href="${this.escapeHtml(params.accountUrl)}" style="display:inline-block;padding:14px 28px;background:${this.escapeHtml(params.themeStart)};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;">
                  ${this.escapeHtml(params.ctaLabel)}
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 36px 40px;">
              <p style="margin:0;font-size:14px;line-height:24px;color:#6b7280;">Cảm ơn bạn đã tin tưởng lựa chọn Ayanavita.</p>
              <p style="margin:12px 0 0 0;font-size:14px;line-height:24px;color:#6b7280;">Trân trọng,<br /><strong>Đội ngũ Ayanavita</strong></p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:20px;color:#9ca3af;">Email này được gửi tự động từ hệ thống Ayanavita. Vui lòng không trả lời trực tiếp email này.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  private async sendSmtpViaGmail(params: { to: string; subject: string; body: string; html: string }) {
    const user = process.env.MAIL_USER ?? 'manage.ayanavita@gmail.com'
    const pass = process.env.MAIL_PASS ?? 'xetp fhph luse qydj'

    const readSmtpResponse = (socket: tls.TLSSocket) =>
      new Promise<string>((resolve, reject) => {
        let buffer = ''

        const cleanup = () => {
          socket.off('data', onData)
          socket.off('error', onError)
          socket.off('close', onClose)
        }

        const onError = (error: Error) => {
          cleanup()
          reject(error)
        }

        const onClose = () => {
          cleanup()
          reject(new Error('SMTP connection closed unexpectedly'))
        }

        const onData = (chunk: Buffer) => {
          buffer += chunk.toString('utf8')
          const normalized = buffer.replace(/\r\n/g, '\n')
          const lines = normalized.split('\n').filter(Boolean)
          if (!lines.length) return

          const lastLine = lines[lines.length - 1]
          if (!/^\d{3} /.test(lastLine)) return

          cleanup()
          resolve(normalized.trim())
        }

        socket.on('data', onData)
        socket.once('error', onError)
        socket.once('close', onClose)
      })

    const sendCommand = async (socket: tls.TLSSocket, command: string, expectedCodes: number[]) => {
      socket.write(`${command}\r\n`)
      const response = await readSmtpResponse(socket)
      const code = Number(response.slice(0, 3))
      if (!expectedCodes.includes(code)) {
        throw new Error(`SMTP command failed (${command}): ${response}`)
      }
      return response
    }

    const socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const client = tls.connect(465, 'smtp.gmail.com', { servername: 'smtp.gmail.com' }, () => resolve(client))
      client.once('error', reject)
    })

    try {
      const greeting = await readSmtpResponse(socket)
      if (!greeting.startsWith('220')) {
        throw new Error(`SMTP greeting failed: ${greeting}`)
      }

      await sendCommand(socket, 'EHLO ayanavita.local', [250])
      await sendCommand(socket, 'AUTH LOGIN', [334])
      await sendCommand(socket, Buffer.from(user).toString('base64'), [334])
      await sendCommand(socket, Buffer.from(pass).toString('base64'), [235])
      await sendCommand(socket, `MAIL FROM:<${user}>`, [250])
      await sendCommand(socket, `RCPT TO:<${params.to}>`, [250, 251])
      await sendCommand(socket, 'DATA', [354])

      const boundary = `aya-plan-${Date.now()}`
      const message = [
        `Subject: ${params.subject}`,
        `From: AYANAVITA <${user}>`,
        `To: ${params.to}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        params.body,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        params.html,
        '',
        `--${boundary}--`,
        '.',
      ].join('\r\n')

      socket.write(`${message}\r\n`)
      const dataResponse = await readSmtpResponse(socket)
      if (!dataResponse.startsWith('250')) {
        throw new Error(`SMTP send failed: ${dataResponse}`)
      }

      await sendCommand(socket, 'QUIT', [221])
    } finally {
      socket.end()
      socket.destroy()
    }
  }

  private async sendPaymentSuccessEmailIfNeeded(paymentId: number, type: 'SUBSCRIBE' | 'RENEWAL') {
    const payment = await this.prisma.coursePlanPayment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        amount: true,
        transferCode: true,
        transferContent: true,
        paidAt: true,
        createdAt: true,
        successEmailSentAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    })

    if (!payment || payment.successEmailSentAt || !payment.user?.email) return

    const pass = await this.prisma.userCoursePass.findFirst({
      where: { userId: payment.userId, purchaseId: payment.id },
      select: { startAt: true, endAt: true },
    })

    const isSubscribe = type === 'SUBSCRIBE'
    const title = isSubscribe ? 'Đăng ký gói dịch vụ thành công' : 'Gia hạn gói dịch vụ thành công'
    const subject = `${title} - AYANAVITA`
    const intro = isSubscribe
      ? `Ayanavita đã ghi nhận thanh toán thành công và kích hoạt gói dịch vụ ${payment.plan.name} cho bạn.`
      : `Ayanavita đã gia hạn thành công gói dịch vụ ${payment.plan.name} cho chu kỳ mới.`

    const html = this.buildSubscriptionEmailHtml({
      themeStart: isSubscribe ? '#1f7aec' : '#059669',
      themeEnd: isSubscribe ? '#6aa7ff' : '#34d399',
      title,
      customerName: payment.user.name?.trim() || 'bạn',
      intro,
      infoTitle: 'Chi tiết thanh toán',
      infoRows: [
        { label: 'Tên gói', value: payment.plan.name },
        { label: 'Số tiền', value: this.formatMoney(payment.amount, payment.plan.currency) },
        { label: 'Mã giao dịch', value: payment.transferCode || `CP${payment.id}` },
        { label: 'Nội dung chuyển khoản', value: payment.transferContent || '-' },
        { label: 'Ngày bắt đầu hiệu lực', value: this.formatDateTime(pass?.startAt ?? payment.paidAt ?? payment.createdAt) },
        { label: 'Ngày kết thúc chu kỳ', value: this.formatDateTime(pass?.endAt ?? null) },
      ],
      note: 'Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ đội ngũ CSKH của Ayanavita để được hỗ trợ nhanh nhất.',
      ctaLabel: 'Xem gói của tôi',
      accountUrl: this.resolveAccountUrl(),
    })

    const body = [
      title,
      `Xin chào ${payment.user.name?.trim() || 'bạn'},`,
      intro,
      `Tên gói: ${payment.plan.name}`,
      `Số tiền: ${this.formatMoney(payment.amount, payment.plan.currency)}`,
      `Mã giao dịch: ${payment.transferCode || `CP${payment.id}`}`,
      `Ngày bắt đầu hiệu lực: ${this.formatDateTime(pass?.startAt ?? payment.paidAt ?? payment.createdAt)}`,
      `Ngày kết thúc chu kỳ: ${this.formatDateTime(pass?.endAt ?? null)}`,
      `Trang tài khoản: ${this.resolveAccountUrl()}`,
    ].join('\n')

    await this.sendSmtpViaGmail({ to: payment.user.email, subject, body, html })

    await this.prisma.coursePlanPayment.updateMany({
      where: { id: payment.id, successEmailSentAt: null },
      data: { successEmailSentAt: new Date() },
    })
  }

  private async sendRenewalReminderEmail(userId: number, planId: number, invoice: Stripe.Invoice) {
    const [user, plan] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      this.prisma.coursePlan.findUnique({ where: { id: planId }, select: { name: true, currency: true } }),
    ])

    if (!user?.email || !plan) return

    const dueAt = this.getInvoicePeriodEnd(invoice)
    const amountDue = Number((invoice as any)?.amount_due || 0)

    const html = this.buildSubscriptionEmailHtml({
      themeStart: '#f59e0b',
      themeEnd: '#fb923c',
      title: 'Nhắc nhở gia hạn gói dịch vụ',
      customerName: user.name?.trim() || 'bạn',
      intro: `Gói dịch vụ ${plan.name} của bạn sắp đến kỳ gia hạn tự động.`,
      infoTitle: 'Thông tin gia hạn sắp tới',
      infoRows: [
        { label: 'Tên gói', value: plan.name },
        { label: 'Ngày dự kiến gia hạn', value: this.formatDateTime(dueAt) },
        { label: 'Số tiền dự kiến', value: this.formatMoney(amountDue, plan.currency) },
        { label: 'Mã hóa đơn', value: invoice.id || 'Không xác định' },
      ],
      note: 'Hệ thống sẽ tự động thanh toán theo phương thức hiện tại của bạn. Hãy đảm bảo phương thức thanh toán còn hiệu lực.',
      ctaLabel: 'Quản lý đăng ký',
      accountUrl: this.resolveAccountUrl(),
    })

    const body = [
      'Nhắc nhở gia hạn gói dịch vụ - AYANAVITA',
      `Xin chào ${user.name?.trim() || 'bạn'},`,
      `Gói dịch vụ ${plan.name} sắp đến kỳ gia hạn tự động.`,
      `Ngày dự kiến gia hạn: ${this.formatDateTime(dueAt)}`,
      `Số tiền dự kiến: ${this.formatMoney(amountDue, plan.currency)}`,
      `Mã hóa đơn: ${invoice.id || 'Không xác định'}`,
      `Trang tài khoản: ${this.resolveAccountUrl()}`,
    ].join('\n')

    await this.sendSmtpViaGmail({
      to: user.email,
      subject: 'Nhắc nhở gia hạn gói dịch vụ - AYANAVITA',
      body,
      html,
    })
  }

  private async sendAutoRenewCanceledEmail(userId: number, planId: number, currentPeriodEnd: Date | null) {
    const [user, plan] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      this.prisma.coursePlan.findUnique({ where: { id: planId }, select: { name: true } }),
    ])

    if (!user?.email || !plan) return

    const html = this.buildSubscriptionEmailHtml({
      themeStart: '#ef4444',
      themeEnd: '#f97316',
      title: 'Đã hủy gia hạn tự động',
      customerName: user.name?.trim() || 'bạn',
      intro: `Ayanavita đã ghi nhận yêu cầu hủy tự động gia hạn cho gói ${plan.name}.`,
      infoTitle: 'Thông tin hủy gia hạn',
      infoRows: [
        { label: 'Tên gói', value: plan.name },
        { label: 'Hiệu lực đến', value: this.formatDateTime(currentPeriodEnd) },
      ],
      note: 'Bạn vẫn có thể sử dụng gói đến hết thời hạn hiện tại và có thể bật lại gia hạn bất kỳ lúc nào trước khi kết thúc.',
      ctaLabel: 'Quản lý đăng ký',
      accountUrl: this.resolveAccountUrl(),
    })

    const body = [
      'Xác nhận hủy tự động gia hạn - AYANAVITA',
      `Xin chào ${user.name?.trim() || 'bạn'},`,
      `Ayanavita đã ghi nhận yêu cầu hủy tự động gia hạn cho gói ${plan.name}.`,
      `Hiệu lực đến: ${this.formatDateTime(currentPeriodEnd)}`,
      `Trang tài khoản: ${this.resolveAccountUrl()}`,
    ].join('\n')

    await this.sendSmtpViaGmail({
      to: user.email,
      subject: 'Xác nhận hủy tự động gia hạn - AYANAVITA',
      body,
      html,
    })
  }

  private async createStripeOneTimeCheckout(userId: number, plan: CoursePlanWithTags, dto?: PurchasePlanDto) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new BadRequestException('STRIPE_SECRET_KEY is missing in environment')
    }

    const now = new Date()
    const { successUrl, cancelUrl } = this.resolveStripeReturnUrls(dto)

    const payment = await this.prisma.coursePlanPayment.create({
      data: {
        userId,
        planId: plan.id,
        provider: 'STRIPE',
        status: CoursePlanPaymentStatus.PENDING,
        amount: plan.price,
        transferCode: this.genTransferCode(),
        transferContent: `STRIPE_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        expiredAt: this.addMinutes(now, 30),
      },
      include: PAYMENT_WITH_PLAN_INCLUDE,
    })

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: plan.price,
            product_data: {
              name: plan.name,
            },
          },
        },
      ],
      metadata: {
        source: 'COURSE_PLAN_ONE_TIME',
        coursePlanPaymentId: String(payment.id),
        userId: String(userId),
        planId: String(plan.id),
      },
    })

    if (!session.url) {
      throw new BadRequestException('Stripe checkout session url is missing')
    }

    const expiresAt = this.toDateOrNull((session as any).expires_at)

    const updatedPayment = await this.prisma.coursePlanPayment.update({
      where: { id: payment.id },
      data: {
        stripeCheckoutSessionId: session.id,
        ...(expiresAt ? { expiredAt: expiresAt } : {}),
        rawResponse: this.toJson(session),
      },
      include: PAYMENT_WITH_PLAN_INCLUDE,
    })

    return {
      mode: 'STRIPE' as const,
      stripeMode: 'ONE_TIME' as const,
      checkoutUrl: session.url,
      payment: this.mapPayment(updatedPayment, now),
    }
  }

  private async createStripeSubscriptionCheckout(userId: number, plan: CoursePlanWithTags, dto?: PurchasePlanDto) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new BadRequestException('STRIPE_SECRET_KEY is missing in environment')
    }

    if (!plan.currentStripePriceId) {
      throw new BadRequestException('Plan has no Stripe recurring price configured')
    }

    const customerId = await this.ensureStripeCustomer(userId)
    const now = new Date()

    const existingScheduled = await this.prisma.userCoursePass.findFirst({
      where: {
        userId,
        canceledAt: null,
        startAt: { gt: now },
      },
      select: { id: true },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
    })

    if (existingScheduled) {
      throw new BadRequestException('You already have a scheduled pass for the next cycle')
    }

    const { successUrl, cancelUrl } = this.resolveStripeReturnUrls(dto)

    const payment = await this.prisma.coursePlanPayment.create({
      data: {
        userId,
        planId: plan.id,
        provider: 'STRIPE',
        status: CoursePlanPaymentStatus.PENDING,
        amount: plan.price,
        transferCode: this.genTransferCode(),
        transferContent: `SUB_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      },
      include: PAYMENT_WITH_PLAN_INCLUDE,
    })

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: plan.currentStripePriceId, quantity: 1 }],
      metadata: {
        source: 'COURSE_PLAN_SUBSCRIPTION',
        coursePlanPaymentId: String(payment.id),
        userId: String(userId),
        planId: String(plan.id),
      },
      subscription_data: {
        metadata: {
          source: 'COURSE_PLAN_SUBSCRIPTION',
          userId: String(userId),
          planId: String(plan.id),
          coursePlanPaymentId: String(payment.id),
        },
      },
    })

    if (!session.url) {
      throw new BadRequestException('Stripe checkout session url is missing')
    }

    const updatedPayment = await this.prisma.coursePlanPayment.update({
      where: { id: payment.id },
      data: {
        stripeCheckoutSessionId: session.id,
        rawResponse: this.toJson(session),
      },
      include: PAYMENT_WITH_PLAN_INCLUDE,
    })

    return {
      mode: 'STRIPE' as const,
      stripeMode: 'SUBSCRIPTION' as const,
      checkoutUrl: session.url,
      payment: this.mapPayment(updatedPayment, now),
    }
  }

  async createCheckout(userId: number, planId: number, dto?: PurchasePlanDto) {
    await this.ensureUserExists(userId)
    const plan = await this.getActivePlanOrThrow(planId)

    if ((plan.price ?? 0) <= 0) {
      const pass = await this.plans.purchasePlan(userId, planId, {})
      return {
        mode: 'FREE' as const,
        pass,
      }
    }

    const method = dto?.method ?? PurchasePlanMethod.SEPAY

    const now = new Date()
    const existingScheduled = await this.prisma.userCoursePass.findFirst({
      where: {
        userId,
        canceledAt: null,
        startAt: { gt: now },
      },
      select: { id: true },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
    })

    if (existingScheduled) {
      throw new BadRequestException('You already have a scheduled pass for the next cycle')
    }

    if (method === PurchasePlanMethod.STRIPE_ONE_TIME) {
      return this.createStripeOneTimeCheckout(userId, plan, dto)
    }

    if (method === PurchasePlanMethod.STRIPE_SUBSCRIPTION) {
      return this.createStripeSubscriptionCheckout(userId, plan, dto)
    }

    await this.markExpiredPendingPayments(userId, planId)

    const existingPending = await this.prisma.coursePlanPayment.findFirst({
      where: {
        userId,
        planId,
        provider: 'SEPAY',
        status: CoursePlanPaymentStatus.PENDING,
        OR: [{ expiredAt: null }, { expiredAt: { gt: now } }],
      },
      include: PAYMENT_WITH_PLAN_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    if (existingPending) {
      return {
        mode: 'SEPAY' as const,
        payment: this.mapPayment(existingPending, now),
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.coursePlanPayment.create({
        data: {
          userId,
          planId,
          provider: 'SEPAY',
          status: CoursePlanPaymentStatus.PENDING,
          amount: plan.price,
          transferCode: this.genTransferCode(),
          transferContent: `TMP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          expiredAt: this.addMinutes(now, 15),
          rawResponse: {
            accountName: this.bankInfo.accountName,
            accountNumber: this.bankInfo.accountNumber,
            bankName: this.bankInfo.gateway,
            bankCode: this.bankInfo.gateway,
          },
        },
      })

      const finalTransferContent = this.buildTransferContent(payment.id)

      return tx.coursePlanPayment.update({
        where: { id: payment.id },
        data: {
          transferContent: finalTransferContent,
          rawResponse: {
            accountName: this.bankInfo.accountName,
            accountNumber: this.bankInfo.accountNumber,
            bankName: this.bankInfo.gateway,
            bankCode: this.bankInfo.gateway,
            transferContent: finalTransferContent,
          },
        },
        include: PAYMENT_WITH_PLAN_INCLUDE,
      })
    })

    return {
      mode: 'SEPAY' as const,
      payment: this.mapPayment(created, now),
    }
  }

  async listMyPayments(userId: number) {
    await this.markExpiredPendingPayments(userId)
    await this.reconcileMissingStripePasses(userId)

    const now = new Date()

    const rows = await this.prisma.coursePlanPayment.findMany({
      where: { userId },
      include: PAYMENT_WITH_PLAN_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 200,
    })

    const purchaseIds = rows.map((row) => row.id)
    const passRows =
      purchaseIds.length > 0
        ? await this.prisma.userCoursePass.findMany({
            where: {
              userId,
              purchaseId: {
                in: purchaseIds,
              },
            },
            select: {
              id: true,
              planId: true,
              purchaseId: true,
              startAt: true,
              endAt: true,
              graceUntil: true,
              remainingUnlocks: true,
              status: true,
              canceledAt: true,
              createdAt: true,
            },
          })
        : []

    const passByPurchaseId = new Map<number, (typeof passRows)[number]>()
    for (const pass of passRows) {
      if (typeof pass.purchaseId === 'number') {
        passByPurchaseId.set(pass.purchaseId, pass)
      }
    }

    const subscriptionIds = Array.from(
      new Set(
        rows
          .map((row) => row.stripeSubscriptionId)
          .filter((subscriptionId): subscriptionId is string => typeof subscriptionId === 'string' && subscriptionId.length > 0),
      ),
    )

    const subscriptionRows =
      subscriptionIds.length > 0
        ? await this.prisma.userPlanSubscription.findMany({
            where: {
              userId,
              stripeSubscriptionId: { in: subscriptionIds },
            },
            select: {
              stripeSubscriptionId: true,
              status: true,
              cancelAtPeriodEnd: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              canceledAt: true,
            },
          })
        : []

    const subscriptionById = new Map<string, (typeof subscriptionRows)[number]>()
    for (const subscription of subscriptionRows) {
      subscriptionById.set(subscription.stripeSubscriptionId, subscription)
    }

    return rows.map((row) => {
      const mappedSubscription =
        row.stripeSubscriptionId && subscriptionById.has(row.stripeSubscriptionId)
          ? subscriptionById.get(row.stripeSubscriptionId)
          : null

      return this.mapPayment(row, now, passByPurchaseId.get(row.id), mappedSubscription)
    })
  }

  async handleSepayWebhook(payload: any, paymentId: number) {
    const payment = await this.prisma.coursePlanPayment.findUnique({
      where: { id: paymentId },
      include: PAYMENT_WITH_PLAN_INCLUDE,
    })

    if (!payment) throw new NotFoundException('Course plan payment not found')

    if (payment.transferContent !== this.buildTransferContent(payment.id)) {
      throw new ForbiddenException('Invalid transfer content for course plan payment')
    }

    if (payment.status === CoursePlanPaymentStatus.PAID) {
      return {
        ok: true,
        alreadyPaid: true,
        paymentId: payment.id,
      }
    }

    if (payment.status !== CoursePlanPaymentStatus.PENDING) {
      return {
        ok: true,
        ignored: true,
        status: payment.status,
        paymentId: payment.id,
      }
    }

    const now = new Date()

    if (payment.expiredAt && payment.expiredAt <= now) {
      await this.prisma.coursePlanPayment.updateMany({
        where: { id: payment.id, status: CoursePlanPaymentStatus.PENDING },
        data: {
          status: CoursePlanPaymentStatus.EXPIRED,
          rawResponse: payload,
        },
      })

      return {
        ok: true,
        ignored: true,
        expired: true,
        paymentId: payment.id,
      }
    }

    const transferAmount = Number(payload?.transferAmount ?? 0)
    if (!Number.isFinite(transferAmount) || transferAmount < payment.amount) {
      throw new ForbiddenException('Transfer amount is not enough for this course plan payment')
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.coursePlanPayment.updateMany({
        where: {
          id: payment.id,
          status: CoursePlanPaymentStatus.PENDING,
        },
        data: {
          status: CoursePlanPaymentStatus.PAID,
          paidAt: now,
          rawResponse: payload,
        },
      })

      if (updatedPayment.count === 0) {
        return {
          alreadyPaid: true,
        }
      }

      const existingPass = await tx.userCoursePass.findFirst({
        where: {
          userId: payment.userId,
          planId: payment.planId,
          purchaseId: payment.id,
        },
        select: {
          id: true,
        },
      })

      if (existingPass) {
        return {
          alreadyPaid: false,
          passId: existingPass.id,
        }
      }

      const latest = await tx.userCoursePass.findFirst({
        where: {
          userId: payment.userId,
          canceledAt: null,
        },
        select: {
          endAt: true,
          graceUntil: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })

      const startAt = latest && now < latest.graceUntil ? latest.endAt : now
      const endAt = this.addDays(startAt, payment.plan.durationDays)
      const graceUntil = this.addDays(endAt, payment.plan.graceDays)

      const createdPass = await tx.userCoursePass.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          purchaseId: payment.id,
          startAt,
          endAt,
          graceUntil,
          remainingUnlocks: payment.plan.maxUnlocks,
          status: this.derivePassStatus(
            {
              startAt,
              endAt,
              graceUntil,
              canceledAt: null,
            },
            now,
          ),
        },
        select: {
          id: true,
        },
      })

      return {
        alreadyPaid: false,
        passId: createdPass.id,
      }
    })

    if (!result.alreadyPaid) {
      void this.sendPaymentSuccessEmailIfNeeded(payment.id, 'SUBSCRIBE').catch((error) => {
        this.logger.error(`Failed to send subscription success email for paymentId=${payment.id}`, error?.stack ?? String(error))
      })
    }

    return {
      ok: true,
      paymentId: payment.id,
      ...(result.alreadyPaid ? { alreadyPaid: true } : {}),
      ...(!result.alreadyPaid ? { passId: result.passId } : {}),
      message: 'Course plan payment successful',
    }
  }

  async handleStripeEvent(event: Stripe.Event) {
    const eventLog = await this.prisma.stripeWebhookEventLog.upsert({
      where: { stripeEventId: event.id },
      update: {},
      create: {
        stripeEventId: event.id,
        type: event.type,
        handled: false,
        payload: this.toJson(event),
      },
    })

    if (eventLog.handled) {
      return { ok: true, duplicate: true }
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onStripeCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await this.onStripeCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.onStripeSubscriptionChanged(event.data.object as Stripe.Subscription)
        break
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await this.onStripeInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.created':
      case 'invoice.finalized':
        await this.onStripeInvoiceLifecycle(event.data.object as Stripe.Invoice)
        break
      case 'invoice.upcoming':
        await this.onStripeInvoiceUpcoming(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await this.onStripeInvoiceFailed(event.data.object as Stripe.Invoice)
        break
      default:
        break
    }

    await this.prisma.stripeWebhookEventLog.update({
      where: { stripeEventId: event.id },
      data: {
        handled: true,
        handledAt: new Date(),
      },
    })

    return { ok: true }
  }

  private async onStripeCheckoutCompleted(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {}
    const source = metadata.source
    const paymentIdFromMetadata = Number(metadata.coursePlanPaymentId || 0)

    const hasPaymentIdInMetadata = Number.isInteger(paymentIdFromMetadata) && paymentIdFromMetadata > 0

    let checkoutPayment = hasPaymentIdInMetadata
      ? await this.prisma.coursePlanPayment.findUnique({
          where: { id: paymentIdFromMetadata },
          select: { id: true, userId: true, planId: true },
        })
      : null

    if (!checkoutPayment) {
      checkoutPayment = await this.prisma.coursePlanPayment.findFirst({
        where: { stripeCheckoutSessionId: session.id },
        select: { id: true, userId: true, planId: true },
      })
    }

    const paymentId = checkoutPayment?.id || (hasPaymentIdInMetadata ? paymentIdFromMetadata : 0)
    if (!paymentId) return

    const resolvedSource =
      source ||
      (session.mode === 'subscription'
        ? 'COURSE_PLAN_SUBSCRIPTION'
        : session.mode === 'payment'
          ? 'COURSE_PLAN_ONE_TIME'
          : null)

    if (resolvedSource === 'COURSE_PLAN_ONE_TIME') {
      const now = new Date()

      const updated = await this.prisma.coursePlanPayment.updateMany({
        where: {
          id: paymentId,
          provider: 'STRIPE',
          status: { in: [CoursePlanPaymentStatus.PENDING, CoursePlanPaymentStatus.EXPIRED] },
        },
        data: {
          status: CoursePlanPaymentStatus.PAID,
          paidAt: now,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: this.extractStripeId(session.payment_intent as any),
          rawResponse: this.toJson(session),
        },
      })

      if (updated.count > 0) {
        const payment =
          checkoutPayment ||
          (await this.prisma.coursePlanPayment.findUnique({
            where: { id: paymentId },
            select: { id: true, userId: true, planId: true },
          }))

        if (payment) {
          await this.ensurePassFromPayment(payment.userId, payment.planId, payment.id)
          void this.sendPaymentSuccessEmailIfNeeded(payment.id, 'SUBSCRIBE').catch((error) => {
            this.logger.error(`Failed to send subscription success email for paymentId=${payment.id}`, error?.stack ?? String(error))
          })
        }
      }

      return
    }

    if (resolvedSource === 'COURSE_PLAN_SUBSCRIPTION') {
      const userId = Number(metadata.userId ?? checkoutPayment?.userId ?? 0)
      const planId = Number(metadata.planId ?? checkoutPayment?.planId ?? 0)
      const subscriptionId = this.extractStripeId(session.subscription as any)
      const customerId = this.extractStripeId(session.customer as any)
      const paymentIntentId = this.extractStripeId(session.payment_intent as any)
      const invoiceId = this.extractStripeId((session as any).invoice)
      const paymentStatus = String(session.payment_status || '').toLowerCase()
      const canGrantPass = paymentStatus === 'paid' || paymentStatus === 'no_payment_required'
      const paidAt = canGrantPass ? new Date() : null

      const updated = await this.prisma.coursePlanPayment.updateMany({
        where: {
          id: paymentId,
          provider: 'STRIPE',
          ...(canGrantPass
            ? { status: { in: [CoursePlanPaymentStatus.PENDING, CoursePlanPaymentStatus.EXPIRED] } }
            : {}),
        },
        data: {
          stripeCheckoutSessionId: session.id,
          stripeSubscriptionId: subscriptionId,
          ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
          ...(invoiceId ? { stripeInvoiceId: invoiceId } : {}),
          ...(canGrantPass
            ? {
                status: CoursePlanPaymentStatus.PAID,
                paidAt,
                failureReason: null,
              }
            : {}),
          rawResponse: this.toJson(session),
        },
      })

      if (userId > 0 && planId > 0 && subscriptionId && customerId) {
        await this.prisma.userPlanSubscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            userId,
            planId,
            stripeCustomerId: customerId,
            status: 'incomplete',
          },
          create: {
            userId,
            planId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: 'incomplete',
          },
        })
      }

      if (canGrantPass && updated.count > 0) {
        const payment =
          checkoutPayment ||
          (await this.prisma.coursePlanPayment.findUnique({
            where: { id: paymentId },
            select: { id: true, userId: true, planId: true },
          }))

        if (payment) {
          await this.ensurePassFromPayment(payment.userId, payment.planId, payment.id)
          void this.sendPaymentSuccessEmailIfNeeded(payment.id, 'SUBSCRIBE').catch((error) => {
            this.logger.error(`Failed to send subscription success email for paymentId=${payment.id}`, error?.stack ?? String(error))
          })
        }
      }
    }
  }
  private async onStripeCheckoutExpired(session: Stripe.Checkout.Session) {
    const paymentId = Number(session.metadata?.coursePlanPaymentId || 0)
    const sessionId = session.id

    if (paymentId > 0) {
      await this.prisma.coursePlanPayment.updateMany({
        where: {
          id: paymentId,
          status: CoursePlanPaymentStatus.PENDING,
        },
        data: {
          status: CoursePlanPaymentStatus.EXPIRED,
          stripeCheckoutSessionId: sessionId,
          rawResponse: this.toJson(session),
        },
      })
      return
    }

    await this.prisma.coursePlanPayment.updateMany({
      where: {
        stripeCheckoutSessionId: sessionId,
        status: CoursePlanPaymentStatus.PENDING,
      },
      data: {
        status: CoursePlanPaymentStatus.EXPIRED,
        rawResponse: this.toJson(session),
      },
    })
  }
  private toDateOrNull(value: unknown): Date | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      const d = new Date(value * 1000)
      return Number.isNaN(d.getTime()) ? null : d
    }

    if (typeof value === 'string' && value.trim()) {
      const numeric = Number(value)
      if (Number.isFinite(numeric) && numeric > 0) {
        const d = new Date(numeric * 1000)
        return Number.isNaN(d.getTime()) ? null : d
      }

      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? null : d
    }

    return null
  }

  private resolveSubscriptionPeriod(subscription: Stripe.Subscription) {
    const subAny = subscription as any
    const firstItem = subAny?.items?.data?.[0]

    const currentPeriodStart =
      this.toDateOrNull(subAny?.current_period_start) ??
      this.toDateOrNull(subAny?.current_period?.start) ??
      this.toDateOrNull(firstItem?.current_period_start)

    const currentPeriodEnd =
      this.toDateOrNull(subAny?.current_period_end) ??
      this.toDateOrNull(subAny?.current_period?.end) ??
      this.toDateOrNull(firstItem?.current_period_end)

    return { currentPeriodStart, currentPeriodEnd }
  }

  private async onStripeSubscriptionChanged(subscription: Stripe.Subscription) {
    const existing = await this.prisma.userPlanSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      select: { userId: true, planId: true },
    })

    const metadata = subscription.metadata || {}
    const userId = existing?.userId || Number(metadata.userId || 0)
    const planId = existing?.planId || Number(metadata.planId || 0)

    if (!userId || !planId) return

    const priceId = subscription.items.data[0]?.price?.id || null
    const period = this.resolveSubscriptionPeriod(subscription)

    await this.prisma.userPlanSubscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        stripeCustomerId: String(subscription.customer),
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt: subscription.status === 'canceled' ? new Date() : null,
      },
      create: {
        userId,
        planId,
        stripeCustomerId: String(subscription.customer),
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        canceledAt: subscription.status === 'canceled' ? new Date() : null,
      },
    })
  }

  private async resolveSubscriptionMapping(
    subscriptionId: string,
    invoice?: Stripe.Invoice,
  ): Promise<SubscriptionMapping | null> {
    const existing = await this.prisma.userPlanSubscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      select: { userId: true, planId: true },
    })
    if (existing) return existing

    const mappedByPayment = await this.prisma.coursePlanPayment.findFirst({
      where: {
        provider: 'STRIPE',
        stripeSubscriptionId: subscriptionId,
      },
      orderBy: [{ id: 'desc' }],
      select: { userId: true, planId: true },
    })

    if (mappedByPayment) {
      const invoiceAny = invoice as any
      const customerId = this.extractStripeId(invoiceAny?.customer)

      if (customerId) {
        await this.prisma.userPlanSubscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            userId: mappedByPayment.userId,
            planId: mappedByPayment.planId,
            stripeCustomerId: customerId,
          },
          create: {
            userId: mappedByPayment.userId,
            planId: mappedByPayment.planId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: 'incomplete',
          },
        })
      }

      return mappedByPayment
    }

    const invoiceAny = invoice as any
    const subscriptionDetailsMetadata =
      invoiceAny?.subscription_details?.metadata ??
      invoiceAny?.parent?.subscription_details?.metadata ??
      {}

    const userIdFromInvoice = Number(subscriptionDetailsMetadata?.userId || 0)
    const planIdFromInvoice = Number(subscriptionDetailsMetadata?.planId || 0)
    const customerIdFromInvoice = this.extractStripeId(invoiceAny?.customer)

    if (userIdFromInvoice > 0 && planIdFromInvoice > 0 && customerIdFromInvoice) {
      await this.prisma.userPlanSubscription.upsert({
        where: { stripeSubscriptionId: subscriptionId },
        update: {
          userId: userIdFromInvoice,
          planId: planIdFromInvoice,
          stripeCustomerId: customerIdFromInvoice,
        },
        create: {
          userId: userIdFromInvoice,
          planId: planIdFromInvoice,
          stripeCustomerId: customerIdFromInvoice,
          stripeSubscriptionId: subscriptionId,
          status: 'incomplete',
        },
      })

      return {
        userId: userIdFromInvoice,
        planId: planIdFromInvoice,
      }
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
      const metadata = subscription.metadata || {}
      const userId = Number(metadata.userId || 0)
      const planId = Number(metadata.planId || 0)
      if (!userId || !planId) return null

      const period = this.resolveSubscriptionPeriod(subscription)
      const priceId = subscription.items.data[0]?.price?.id || null

      await this.prisma.userPlanSubscription.upsert({
        where: { stripeSubscriptionId: subscriptionId },
        update: {
          userId,
          planId,
          stripeCustomerId: String(subscription.customer),
          stripePriceId: priceId,
          status: subscription.status,
          currentPeriodStart: period.currentPeriodStart,
          currentPeriodEnd: period.currentPeriodEnd,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          canceledAt: subscription.status === 'canceled' ? new Date() : null,
        },
        create: {
          userId,
          planId,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          currentPeriodStart: period.currentPeriodStart,
          currentPeriodEnd: period.currentPeriodEnd,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          canceledAt: subscription.status === 'canceled' ? new Date() : null,
        },
      })

      return { userId, planId }
    } catch {
      return null
    }
  }
  private async onStripeInvoiceUpcoming(invoice: Stripe.Invoice) {
    const subscriptionId = this.extractStripeId((invoice as any).subscription)
    if (!subscriptionId) return

    const mapped = await this.resolveSubscriptionMapping(subscriptionId, invoice)
    if (!mapped) return

    const invoiceId = invoice.id
    if (!invoiceId) return

    const existing = await this.prisma.coursePlanPayment.findFirst({
      where: { stripeInvoiceId: invoiceId },
      select: { id: true, reminderSentAt: true },
    })

    if (existing?.reminderSentAt) {
      return
    }

    const payment =
      existing ??
      (await this.prisma.coursePlanPayment.create({
        data: {
          userId: mapped.userId,
          planId: mapped.planId,
          provider: 'STRIPE',
          status: CoursePlanPaymentStatus.PENDING,
          amount: Number((invoice as any)?.amount_due || 0),
          transferCode: this.genTransferCode(),
          transferContent: `INV_UPCOMING_${invoiceId}`,
          stripeInvoiceId: invoiceId,
          stripeSubscriptionId: subscriptionId,
          rawResponse: this.toJson(invoice),
        },
        select: { id: true, reminderSentAt: true },
      }))

    try {
      await this.sendRenewalReminderEmail(mapped.userId, mapped.planId, invoice)
    } catch (error: any) {
      this.logger.error(
        `Failed to send renewal reminder email for invoice=${invoiceId}`,
        error?.stack ?? String(error),
      )
      return
    }

    await this.prisma.coursePlanPayment.updateMany({
      where: {
        id: payment.id,
        reminderSentAt: null,
      },
      data: {
        reminderSentAt: new Date(),
        rawResponse: this.toJson(invoice),
      },
    })
  }
  private async onStripeInvoiceLifecycle(invoice: Stripe.Invoice) {
    const subscriptionId = this.extractStripeId((invoice as any).subscription)
    if (!subscriptionId) return

    const mapped = await this.resolveSubscriptionMapping(subscriptionId, invoice)
    if (!mapped) return

    const invoiceId = invoice.id
    const paymentIntentId = this.extractStripeId((invoice as any).payment_intent)
    const invoiceStatus = String((invoice as any).status || '').toLowerCase()
    const isPaidInvoice = Boolean((invoice as any).paid) || invoiceStatus === 'paid'

    const existed = await this.prisma.coursePlanPayment.findFirst({
      where: { stripeInvoiceId: invoiceId },
      select: { id: true, status: true },
    })

    if (!existed) {
      await this.prisma.coursePlanPayment.create({
        data: {
          userId: mapped.userId,
          planId: mapped.planId,
          provider: 'STRIPE',
          status: CoursePlanPaymentStatus.PENDING,
          amount: Number(invoice.amount_due || 0),
          transferCode: this.genTransferCode(),
          transferContent: `INV_PENDING_${invoiceId}`,
          stripeInvoiceId: invoiceId,
          stripeSubscriptionId: subscriptionId,
          stripePaymentIntentId: paymentIntentId,
          rawResponse: this.toJson(invoice),
        },
      })
    } else if (
      existed.status !== CoursePlanPaymentStatus.PAID &&
      existed.status !== CoursePlanPaymentStatus.FAILED
    ) {
      await this.prisma.coursePlanPayment.update({
        where: { id: existed.id },
        data: {
          status: CoursePlanPaymentStatus.PENDING,
          amount: Number(invoice.amount_due || 0),
          stripeSubscriptionId: subscriptionId,
          stripePaymentIntentId: paymentIntentId,
          rawResponse: this.toJson(invoice),
        },
      })
    }

    if (isPaidInvoice) {
      await this.onStripeInvoicePaid(invoice)
    }
  }
  private extractInvoiceFailureReason(invoice: Stripe.Invoice) {
    const inv = invoice as any
    return String(inv?.last_finalization_error?.message || inv?.last_payment_error?.message || 'Invoice payment failed')
  }
  private async onStripeInvoicePaid(invoice: Stripe.Invoice) {

    const subscriptionRaw =
        (invoice as any)?.parent?.subscription_details?.subscription ??
        (invoice as any)?.subscription ??
        null
    console.log("invoiceId:", invoice.id)

    const subscriptionId = this.extractStripeId(subscriptionRaw)
    if (!subscriptionId) {
      return
    }

    const mapped = await this.resolveSubscriptionMapping(subscriptionId, invoice)
    if (!mapped) {
      throw new NotFoundException(`Subscription mapping not found for ${subscriptionId}`)
    }

    const invoiceId = invoice.id
    const billingReason = String((invoice as any).billing_reason || '')
    const paymentIntentId = this.extractStripeId((invoice as any).payment_intent)

    const existedByInvoice = await this.prisma.coursePlanPayment.findFirst({
      where: { stripeInvoiceId: invoiceId },
      select: { id: true, status: true },
    })

    if (existedByInvoice?.status === CoursePlanPaymentStatus.PAID) {
      return
    }

    const existedByCheckoutSession =
        !existedByInvoice && billingReason === 'subscription_create'
            ? await this.prisma.coursePlanPayment.findFirst({
              where: {
                userId: mapped.userId,
                planId: mapped.planId,
                provider: 'STRIPE',
                stripeSubscriptionId: subscriptionId,
                stripeCheckoutSessionId: { not: null },
                stripeInvoiceId: null,
              },
              orderBy: [{ id: 'desc' }],
              select: { id: true, status: true },
            })
            : null

    const paidAt = new Date()
    const amountPaid = Number(invoice.amount_paid || 0)

    const existed = existedByInvoice || existedByCheckoutSession

    if (existed) {
    } else {
    }

    const payment = existed
        ? await this.prisma.coursePlanPayment.update({
          where: { id: existed.id },
          data: {
            status: CoursePlanPaymentStatus.PAID,
            paidAt,
            amount: amountPaid,
            stripeInvoiceId: invoiceId,
            stripeSubscriptionId: subscriptionId,
            stripePaymentIntentId: paymentIntentId,
            rawResponse: this.toJson(invoice),
            failureReason: null,
          },
          select: { id: true, userId: true, planId: true },
        })
        : await this.prisma.coursePlanPayment.create({
          data: {
            userId: mapped.userId,
            planId: mapped.planId,
            provider: 'STRIPE',
            status: CoursePlanPaymentStatus.PAID,
            amount: amountPaid,
            transferCode: this.genTransferCode(),
            transferContent: `INV_${invoiceId}`,
            paidAt,
            stripeInvoiceId: invoiceId,
            stripeSubscriptionId: subscriptionId,
            stripePaymentIntentId: paymentIntentId,
            rawResponse: this.toJson(invoice),
          },
          select: { id: true, userId: true, planId: true },
        })

    await this.ensurePassFromPayment(payment.userId, payment.planId, payment.id)

    const successEmailType = billingReason === 'subscription_create' ? 'SUBSCRIBE' : 'RENEWAL'
    void this.sendPaymentSuccessEmailIfNeeded(payment.id, successEmailType).catch((error) => {
      this.logger.error(`Failed to send Stripe success email for paymentId=`, error?.stack ?? String(error))
    })
  }
  private async onStripeInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = this.extractStripeId((invoice as any).subscription)
    if (!subscriptionId) return

    const mapped = await this.resolveSubscriptionMapping(subscriptionId, invoice)
    if (!mapped) {
      throw new NotFoundException(`Subscription mapping not found for ${subscriptionId}`)
    }

    const reason = this.extractInvoiceFailureReason(invoice)
    const invoiceId = invoice.id
    const paymentIntentId = this.extractStripeId((invoice as any).payment_intent)

    const existed = await this.prisma.coursePlanPayment.findFirst({
      where: { stripeInvoiceId: invoiceId },
      select: { id: true },
    })

    if (existed) {
      await this.prisma.coursePlanPayment.update({
        where: { id: existed.id },
        data: {
          status: CoursePlanPaymentStatus.FAILED,
          failureReason: reason,
          stripeSubscriptionId: subscriptionId,
          stripePaymentIntentId: paymentIntentId,
          rawResponse: this.toJson(invoice),
        },
      })
      return
    }

    await this.prisma.coursePlanPayment.create({
      data: {
        userId: mapped.userId,
        planId: mapped.planId,
        provider: 'STRIPE',
        status: CoursePlanPaymentStatus.FAILED,
        amount: Number(invoice.amount_due || 0),
        transferCode: this.genTransferCode(),
        transferContent: `INV_FAIL_${invoiceId}`,
        stripeInvoiceId: invoiceId,
        stripeSubscriptionId: subscriptionId,
        stripePaymentIntentId: paymentIntentId,
        failureReason: reason,
        rawResponse: this.toJson(invoice),
      },
    })
  }
}
