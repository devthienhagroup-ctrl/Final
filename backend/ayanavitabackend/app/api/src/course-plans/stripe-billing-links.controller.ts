import { Controller, Get, HttpStatus, NotFoundException, Param, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { StripeBillingLinksService } from './stripe-billing-links.service'

@Controller('billing/email-links')
export class StripeBillingLinksController {
  constructor(private readonly stripeBillingLinks: StripeBillingLinksService) {}

  @Get('invoices/:invoiceId/pay')
  async redirectToHostedInvoice(
    @Param('invoiceId') invoiceId: string,
    @Res() res: Response,
  ) {
    const hostedInvoiceUrl = await this.stripeBillingLinks.getHostedInvoiceUrl(invoiceId)
    if (!hostedInvoiceUrl) {
      throw new NotFoundException('Hosted invoice page is not available for this invoice')
    }

    return res.redirect(HttpStatus.SEE_OTHER, hostedInvoiceUrl)
  }

  @Get('customers/:customerId/update-payment-method')
  async redirectToPaymentMethodUpdate(
    @Param('customerId') customerId: string,
    @Res() res: Response,
    @Query('returnUrl') returnUrl?: string,
    @Query('afterCompletionReturnUrl') afterCompletionReturnUrl?: string,
  ) {
    const resolvedReturnUrl = returnUrl?.trim() || this.stripeBillingLinks.resolveDefaultPortalReturnUrl()

    const sessionUrl = await this.stripeBillingLinks.createPaymentMethodUpdatePortalSession({
      customerId,
      returnUrl: resolvedReturnUrl,
      afterCompletionReturnUrl: afterCompletionReturnUrl?.trim() || resolvedReturnUrl,
    })

    return res.redirect(HttpStatus.SEE_OTHER, sessionUrl)
  }
}


