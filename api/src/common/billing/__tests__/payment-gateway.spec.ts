import * as crypto from 'crypto';
import { RazorpayAdapter } from '../razorpay.adapter';

describe('Razorpay Payment Gateway Adapter Unit Tests', () => {
  const mockKeyId = 'rzp_test_clixpro123';
  const mockSecret = 'rzp_secret_mock_key_9876543210';
  const mockWebhookSecret = 'rzp_webhook_secret_key_1234567890';

  let adapter: RazorpayAdapter;

  beforeEach(() => {
    adapter = new RazorpayAdapter(mockKeyId, mockSecret, mockWebhookSecret);
  });

  describe('Order Creation', () => {
    it('should create an order with accurate integer minor units (paise)', async () => {
      const result = await adapter.createOrder({
        tenantId: 'tenant-123',
        planId: 'growth',
        planName: 'Growth',
        billingCycle: 'monthly',
        seats: 5,
        amountInMinorUnits: 294400, // ₹2944 in paise
        currency: 'INR',
      });

      expect(result.provider).toBe('RAZORPAY');
      expect(result.orderId).toBeDefined();
      expect(result.amount).toBe(294400);
      expect(result.currency).toBe('INR');
      expect(result.keyId).toBe(mockKeyId);
      expect(result.metadata?.tenantId).toBe('tenant-123');
      expect(result.metadata?.planId).toBe('growth');
      expect(result.metadata?.seats).toBe(5);
    });
  });

  describe('Cryptographic Signature Verification', () => {
    it('should successfully verify valid HMAC SHA256 signature', () => {
      const orderId = 'order_test_123456';
      const paymentId = 'pay_test_789012';
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', mockSecret)
        .update(payload)
        .digest('hex');

      const isValid = adapter.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: validSignature,
        secret: mockSecret,
      });

      expect(isValid).toBe(true);
    });

    it('should reject tampered or forged payment signatures', () => {
      const isValid = adapter.verifyPaymentSignature({
        orderId: 'order_test_123456',
        paymentId: 'pay_test_789012',
        signature: 'forged_fake_signature_hex_value',
        secret: mockSecret,
      });

      expect(isValid).toBe(false);
    });

    it('should reject when orderId, paymentId, or signature is missing', () => {
      expect(
        adapter.verifyPaymentSignature({
          orderId: '',
          paymentId: 'pay_123',
          signature: 'sig_123',
          secret: mockSecret,
        }),
      ).toBe(false);

      expect(
        adapter.verifyPaymentSignature({
          orderId: 'order_123',
          paymentId: '',
          signature: 'sig_123',
          secret: mockSecret,
        }),
      ).toBe(false);

      expect(
        adapter.verifyPaymentSignature({
          orderId: 'order_123',
          paymentId: 'pay_123',
          signature: '',
          secret: mockSecret,
        }),
      ).toBe(false);
    });
  });

  describe('Webhook Ingestion and Verification', () => {
    it('should verify and parse genuine Razorpay webhook with HMAC verification', async () => {
      const rawPayload = JSON.stringify({
        id: 'evt_rzp_test_001',
        event: 'payment.captured',
        created_at: 1700000000,
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_001',
              order_id: 'order_rzp_001',
              amount: 588800,
              currency: 'INR',
              notes: {
                tenantId: 'tenant-abc',
                planId: 'growth',
                billingCycle: 'annual',
                seats: '5',
              },
            },
          },
        },
      });

      const signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(rawPayload)
        .digest('hex');

      const result = await adapter.verifyAndParseWebhook({
        rawBody: rawPayload,
        signature,
        secret: mockWebhookSecret,
      });

      expect(result).toBeDefined();
      expect(result?.eventId).toBe('evt_rzp_test_001');
      expect(result?.eventType).toBe('payment.captured');
      expect(result?.status).toBe('SUCCESS');
      expect(result?.tenantId).toBe('tenant-abc');
      expect(result?.planId).toBe('growth');
      expect(result?.seats).toBe(5);
      expect(result?.amount).toBe(588800);
      expect(result?.currency).toBe('INR');
    });

    it('should reject webhook with invalid signature', async () => {
      const rawPayload = JSON.stringify({ id: 'evt_rzp_forged', event: 'payment.captured' });

      const result = await adapter.verifyAndParseWebhook({
        rawBody: rawPayload,
        signature: 'invalid_signature_hex',
        secret: mockWebhookSecret,
      });

      expect(result).toBeNull();
    });
  });
});
