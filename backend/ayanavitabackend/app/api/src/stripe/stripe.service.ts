import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';

type DemoOrderStatus = 'PENDING' | 'PAID' | 'CANCELED';

type DemoOrder = {
  id: string;
  productName: string;
  amount: number;
  currency: string;
  status: DemoOrderStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  paidAt?: string;
};

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });

  private readonly orders = new Map<string, DemoOrder>();

  createDemoOrder() {
    const id = `order_${Date.now()}`;
    const order: DemoOrder = {
      id,
      productName: 'Gói demo thanh toán',
      amount: 199000,
      currency: 'vnd',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.orders.set(id, order);
    return order;
  }

  getOrder(orderId: string) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  listOrders() {
    return Array.from(this.orders.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createCheckoutSession(orderId: string) {
    const order = this.getOrder(orderId);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `https://demo.ayanavita.com/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `https://demo.ayanavita.com/payment/cancel?order_id=${order.id}`,
      line_items: [
        {
          price_data: {
            currency: order.currency,
            unit_amount: order.amount,
            product_data: {
              name: order.productName,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
      },
    });

    order.stripeSessionId = session.id;
    this.orders.set(order.id, order);

    return {
      orderId: order.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async markOrderPaidFromCheckoutSession(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.warn('Webhook received session without metadata.orderId');
      return;
    }

    const order = this.orders.get(orderId);
    if (!order) {
      console.warn(`Order not found for orderId=${orderId}`);
      return;
    }

    order.status = 'PAID';
    order.paidAt = new Date().toISOString();

    if (typeof session.payment_intent === 'string') {
      order.stripePaymentIntentId = session.payment_intent;
    }

    this.orders.set(order.id, order);

    console.log('[WEBHOOK] Order marked as PAID:', {
      orderId: order.id,
      sessionId: session.id,
      paymentIntentId: order.stripePaymentIntentId,
    });
  }

  async markOrderCanceled(orderId: string) {
    const order = this.getOrder(orderId);
    order.status = 'CANCELED';
    this.orders.set(order.id, order);
    return order;
  }
}