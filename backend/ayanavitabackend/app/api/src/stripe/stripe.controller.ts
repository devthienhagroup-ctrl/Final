import { Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('demo-order')
  createDemoOrder() {
    return this.paymentsService.createDemoOrder();
  }

  @Post('checkout/:orderId')
  async createCheckoutSession(@Param('orderId') orderId: string) {
    return this.paymentsService.createCheckoutSession(orderId);
  }

  @Get('orders')
  listOrders() {
    return this.paymentsService.listOrders();
  }

  @Get('orders/:orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getOrder(orderId);
  }

  @Post('orders/:orderId/cancel')
  cancelOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.markOrderCanceled(orderId);
  }
}