import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
import { RazorpayAdapter } from './razorpay.adapter';

@Injectable()
export class BillingGatewayService {
  private readonly logger = new Logger(BillingGatewayService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the authoritative Razorpay payment gateway adapter based on platform billing config.
   * Razorpay is the sole production payment provider for ClixProCRM.
   */
  async getActiveAdapter(): Promise<IPaymentGatewayAdapter> {
    try {
      const config = await this.prisma.platformBillingConfig.findFirst();

      return new RazorpayAdapter(
        config?.razorpayKeyId || process.env.RAZORPAY_KEY_ID,
        config?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET,
        config?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      this.logger.warn(`Could not load gateway config from DB, using environment fallback: ${err.message}`);
    }

    return new RazorpayAdapter(
      process.env.RAZORPAY_KEY_ID,
      process.env.RAZORPAY_KEY_SECRET,
      process.env.RAZORPAY_WEBHOOK_SECRET,
    );
  }

  async createCheckoutOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const adapter = await this.getActiveAdapter();
    return adapter.createOrder(params);
  }

  async verifyPaymentSignature(params: VerifySignatureParams): Promise<boolean> {
    const adapter = await this.getActiveAdapter();
    return adapter.verifyPaymentSignature(params);
  }

  async verifyAndParseWebhook(
    params: WebhookVerificationParams,
    provider?: string,
  ): Promise<NormalizedWebhookEvent | null> {
    const adapter = await this.getActiveAdapter();
    return adapter.verifyAndParseWebhook(params);
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    const adapter = await this.getActiveAdapter();
    return adapter.processRefund(params);
  }
}
