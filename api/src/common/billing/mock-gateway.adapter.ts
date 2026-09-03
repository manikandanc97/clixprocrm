import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  IPaymentGatewayAdapter,
  CreateOrderParams,
  PaymentOrderResult,
  VerifySignatureParams,
  WebhookVerificationParams,
  NormalizedWebhookEvent,
  ProcessRefundParams,
  RefundResult,
} from './payment-gateway.interface';

@Injectable()
export class MockGatewayAdapter implements IPaymentGatewayAdapter {
  readonly providerName = 'MANUAL' as const;

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const orderId = `cp_mock_order_${Date.now()}_${params.tenantId.slice(0, 6)}`;
    return {
      provider: 'MANUAL',
      orderId,
      amount: Math.round(params.amountInMinorUnits),
      currency: params.currency || 'INR',
      keyId: 'mock_key_clixpro',
      metadata: {
        tenantId: params.tenantId,
        planId: params.planId,
        billingCycle: params.billingCycle,
        seats: params.seats,
      },
    };
  }

  verifyPaymentSignature(params: VerifySignatureParams): boolean {
    return Boolean(params.orderId && params.paymentId);
  }

  async verifyAndParseWebhook(
    params: WebhookVerificationParams,
  ): Promise<NormalizedWebhookEvent | null> {
    try {
      const body = typeof params.rawBody === 'string' ? JSON.parse(params.rawBody) : JSON.parse(params.rawBody.toString('utf8'));
      const eventId = body.eventId || `evt_mock_${Date.now()}`;
      return {
        provider: 'MANUAL',
        eventId,
        eventType: body.eventType || 'order.paid',
        tenantId: body.tenantId,
        planId: body.planId,
        billingCycle: body.billingCycle || 'monthly',
        seats: body.seats || 1,
        orderId: body.orderId || `order_${Date.now()}`,
        paymentId: body.paymentId || `pay_${Date.now()}`,
        amount: body.amount || 0,
        currency: body.currency || 'INR',
        status: body.status || 'SUCCESS',
        rawPayload: body,
        eventTimestamp: new Date(),
      };
    } catch {
      return null;
    }
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    return {
      refundId: `rfnd_mock_${Date.now()}`,
      paymentId: params.paymentId,
      amount: params.amountInMinorUnits,
      currency: params.currency,
      status: 'SUCCESS',
    };
  }
}
