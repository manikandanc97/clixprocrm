import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordPaymentDto } from '../dto/enterprise-invoice.dto';
import { Prisma } from '@prisma/client';
import { formatCurrency, toNumber } from '../../common/utils/crm-formatters.util';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';
import { roundTo2 } from '../utils/invoice-calculation.util';
import { InvoiceEmailService } from './invoice-email.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceEmailService: InvoiceEmailService,
  ) {}

  private async allocatePaymentNumber(
    tenantId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.payment.count({ where: { tenantId } });
    const seq = count + 1;
    return `PAY-${year}-${String(seq).padStart(6, '0')}`;
  }

  async getPayments(
    tenantId: string,
    page = 1,
    limit = 20,
    invoiceId?: string,
    status?: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(limit, 1000));
      const skip = (page - 1) * limit;

      const where: Prisma.PaymentWhereInput = {
        tenantId,
        ...(invoiceId && { invoiceId }),
        ...(status && { status }),
      };

      const [payments, total, currency] = await Promise.all([
        tx.payment.findMany({
          where,
          orderBy: { paymentDate: 'desc' },
          skip,
          take: limit,
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                status: true,
                customer: { select: { id: true, name: true, company: true } },
              },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        tx.payment.count({ where }),
        getCachedTenantCurrency(this.prisma, tenantId),
      ]);

      return {
        payments: payments.map((p) => ({
          id: p.id,
          tenantId: p.tenantId,
          invoiceId: p.invoiceId,
          paymentNumber: p.paymentNumber,
          amount: toNumber(p.amount),
          amountFormatted: formatCurrency(toNumber(p.amount), p.currency || currency),
          currency: p.currency || currency,
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate.toISOString(),
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          status: p.status,
          receiptUrl: p.receiptUrl,
          invoice: p.invoice
            ? {
                id: p.invoice.id,
                invoiceNumber: p.invoice.invoiceNumber,
                totalAmount: toNumber(p.invoice.totalAmount),
                status: p.invoice.status,
                customer: p.invoice.customer,
              }
            : null,
          createdBy: p.createdBy,
          createdAt: p.createdAt.toISOString(),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    });
  }

  async recordPayment(
    tenantId: string,
    userId: string,
    invoiceId: string,
    data: RecordPaymentDto,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { customer: true, company: true },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === 'CANCELLED' || invoice.status === 'VOID') {
        throw new BadRequestException(`Cannot record payment on a ${invoice.status} invoice.`);
      }

      const paymentAmt = roundTo2(data.amount);
      if (paymentAmt <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0.');
      }

      const invTotal = toNumber(invoice.totalAmount || invoice.amount);
      const currentPaid = toNumber(invoice.paidAmount);
      const currentBalance = toNumber(invoice.balanceAmount) || (invTotal - currentPaid);

      if (paymentAmt > currentBalance + 0.01) {
        throw new BadRequestException(
          `Payment amount (${paymentAmt}) cannot exceed remaining balance (${roundTo2(currentBalance)}).`,
        );
      }

      // 1. Allocate payment number
      const paymentNumber = await this.allocatePaymentNumber(tenantId, tx);

      // 2. Create Payment record
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          paymentNumber,
          amount: paymentAmt,
          currency: data.currency || invoice.currency || 'INR',
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          referenceNumber: data.referenceNumber || null,
          notes: data.notes || null,
          status: data.status || 'SUCCESS',
          createdById: userId,
        },
      });

      // 3. Recalculate invoice totals if payment status is SUCCESS
      let newPaid = currentPaid;
      let newBalance = currentBalance;
      let newStatus = invoice.status;

      if (payment.status === 'SUCCESS') {
        newPaid = roundTo2(currentPaid + paymentAmt);
        newBalance = roundTo2(Math.max(0, invTotal - newPaid));
        if (newBalance <= 0) {
          newStatus = 'PAID';
        } else {
          newStatus = 'PARTIALLY_PAID';
        }

        await tx.invoice.update({
          where: { id: invoiceId, tenantId },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newStatus,
            ...(newStatus === 'PAID' && { paidAt: new Date() }),
          },
        });
      }

      // 4. Record Timeline Event
      const formattedAmt = formatCurrency(paymentAmt, payment.currency);
      await tx.timelineEvent.create({
        data: {
          tenantId,
          userId,
          action: 'PAYMENT_RECORDED',
          description: `Payment ${paymentNumber} of ${formattedAmt} received (${payment.paymentMethod}) for invoice ${invoice.invoiceNumber || invoice.id.slice(0, 8)}`,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          companyId: invoice.companyId,
          dealId: invoice.dealId,
          metadata: {
            paymentId: payment.id,
            paymentNumber,
            amount: paymentAmt,
            remainingBalance: newBalance,
            newStatus,
          },
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'PAYMENT_RECORDED',
          module: 'INVOICES',
          details: {
            paymentId: payment.id,
            paymentNumber,
            invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            amount: paymentAmt,
            previousBalance: currentBalance,
            newBalance,
            newStatus,
          },
        },
      });

      // 6. Optional receipt email dispatch
      if (data.sendReceiptEmail) {
        this.invoiceEmailService
          .sendPaymentReceiptEmail(tenantId, payment.id, userId)
          .catch((err) => this.logger.warn(`Failed to send receipt email: ${err.message}`));
      }

      return {
        payment: {
          ...payment,
          amount: toNumber(payment.amount),
        },
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invTotal,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
        },
      };
    });
  }

  async deletePayment(tenantId: string, paymentId: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, tenantId },
        include: { invoice: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      const invoiceId = payment.invoiceId;
      const invoice = payment.invoice;

      // Delete payment
      await tx.payment.delete({ where: { id: paymentId, tenantId } });

      // Recalculate remaining payments for this invoice
      const remainingPayments = await tx.payment.findMany({
        where: { invoiceId, tenantId, status: 'SUCCESS' },
      });

      const invTotal = toNumber(invoice.totalAmount || invoice.amount);
      const totalPaid = remainingPayments.reduce((s, p) => s + toNumber(p.amount), 0);
      const newBalance = roundTo2(Math.max(0, invTotal - totalPaid));
      let newStatus = 'SENT';
      if (totalPaid >= invTotal && invTotal > 0) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIALLY_PAID';
      } else if (invoice.sentAt) {
        newStatus = 'SENT';
      } else {
        newStatus = 'DRAFT';
      }

      await tx.invoice.update({
        where: { id: invoiceId, tenantId },
        data: {
          paidAmount: totalPaid,
          balanceAmount: newBalance,
          status: newStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'PAYMENT_DELETED',
          module: 'INVOICES',
          details: {
            paymentId,
            paymentNumber: payment.paymentNumber,
            invoiceId,
            deletedAmount: toNumber(payment.amount),
            newBalance,
            newStatus,
          },
        },
      });

      return { success: true, id: paymentId, invoiceId, newBalance, newStatus };
    });
  }
}
