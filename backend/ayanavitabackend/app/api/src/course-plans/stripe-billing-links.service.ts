import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import Stripe from 'stripe'

type PaymentMethodUpdatePortalSessionParams = {
  customerId: string
  returnUrl: string
  afterCompletionReturnUrl?: string
}

@Injectable()
export class StripeBillingLinksService {
  private readonly logger = new Logger(StripeBillingLinksService.name)

  // Initialize Stripe once for this service.
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  })

  private ensureStripeConfigured() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is missing')
    }
  }

  private normalizeAbsoluteUrl(value: string, fieldName: string) {
    const normalized = String(value || '').trim()
    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`)
    }

    try {
      const parsed = new URL(normalized)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('unsupported protocol')
      }
      return parsed.toString()
    } catch {
      throw new BadRequestException(`${fieldName} must be a valid absolute URL`)
    }
  }

  resolveDefaultPortalReturnUrl() {
    const frontendBase = String(process.env.FRONTEND_BASE_URL || '')
      .trim()
      .replace(/\/$/, '')
    const appBase = String(process.env.APP_BASE_URL || '')
      .trim()
      .replace(/\/$/, '')

    const base = frontendBase || appBase
    if (!base) {
      throw new InternalServerErrorException('APP_BASE_URL or FRONTEND_BASE_URL is missing')
    }

    return `${base}/account-center?tab=subscriptions`
  }

  async getHostedInvoiceUrl(invoiceId: string): Promise<string | null> {
    const normalizedInvoiceId = String(invoiceId || '').trim()
    if (!normalizedInvoiceId) {
      throw new BadRequestException('invoiceId is required')
    }

    this.ensureStripeConfigured()

    try {
      // Retrieve the latest invoice snapshot from Stripe.
      const invoice = await this.stripe.invoices.retrieve(normalizedInvoiceId)
      const status = String(invoice.status || '').toLowerCase()

      if (status === 'draft') {
        return null
      }

      return invoice.hosted_invoice_url || null
    } catch (error: any) {
      this.logger.warn(
        `Unable to resolve hosted invoice URL for invoiceId=${normalizedInvoiceId}: ${error?.message || error}`,
      )
      return null
    }
  }

  async createPaymentMethodUpdatePortalSession(params: PaymentMethodUpdatePortalSessionParams): Promise<string> {
    this.ensureStripeConfigured()

    const customerId = String(params.customerId || '').trim()
    if (!customerId) {
      throw new BadRequestException('customerId is required')
    }

    const returnUrl = this.normalizeAbsoluteUrl(params.returnUrl, 'returnUrl')
    const afterCompletionReturnUrl = params.afterCompletionReturnUrl
      ? this.normalizeAbsoluteUrl(params.afterCompletionReturnUrl, 'afterCompletionReturnUrl')
      : returnUrl

    try {
      // Create a fresh short-lived portal session for payment method update.
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        flow_data: {
          type: 'payment_method_update',
          after_completion: {
            type: 'redirect',
            redirect: {
              return_url: afterCompletionReturnUrl,
            },
          },
        },
      })

      if (!session.url) {
        throw new InternalServerErrorException('Stripe portal session URL is missing')
      }

      return session.url
    } catch (error: any) {
      this.logger.error(
        `Failed to create payment method update portal session for customer=${customerId}: ${error?.message || error}`,
      )
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('Failed to create Stripe portal session')
    }
  }
}

