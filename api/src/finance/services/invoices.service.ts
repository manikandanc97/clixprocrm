import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  SendInvoiceEmailDto,
} from '../dto/enterprise-invoice.dto';
import { Prisma } from '@prisma/client';
import {
  toNumber,
  formatCurrency,
} from '../../common/utils/crm-formatters.util';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';
import {
  calculateInvoiceTotals,
  roundTo2,
} from '../utils/invoice-calculation.util';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoiceEmailService } from './invoice-email.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: InvoicePdfService,
    private readonly emailService: InvoiceEmailService,
  ) {}

  private async getTenantCurrency(tenantId: string): Promise<string> {
    return getCachedTenantCurrency(this.prisma, tenantId);
  }

  /**
   * Concurrency-safe sequential invoice number allocation with organization prefix.
   */
  private async allocateInvoiceNumber(
    tenantId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    // 1. Check if organization has custom invoice settings configured
    const settings = await tx.tenantInvoiceSettings.findUnique({
      where: { tenantId },
    });

    const prefix = settings?.invoicePrefix?.trim() || 'INV';
    const year = new Date().getFullYear();

    // 2. Increment counter atomically
    const result = await tx.$queryRaw<Array<{ current: number }>>`
      INSERT INTO "InvoiceCounter" ("id", "tenantId", "current")
      VALUES (gen_random_uuid()::text, ${tenantId}, 1)
      ON CONFLICT ("tenantId")
      DO UPDATE SET "current" = "InvoiceCounter"."current" + 1
      RETURNING "current"
    `;

    const seq = result[0].current;
    return `${prefix}-${year}-${String(seq).padStart(6, '0')}`;
  }

  /**
   * Helper to check and evaluate overdue invoices.
   */
  private checkIsOverdue(dueDate: Date | null, balanceAmount: number, status: string): boolean {
    if (!dueDate || balanceAmount <= 0) return false;
    if (status === 'PAID' || status === 'CANCELLED' || status === 'VOID' || status === 'REFUNDED') {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  }

  async createInvoice(
    tenantId: string,
    userId: string,
    data: CreateInvoiceDto,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      // 1. Determine customer & company linkage
      let customerId = data.customerId || null;
      let companyId = data.companyId || null;

      if (customerId && !companyId) {
        const cust = await tx.customer.findFirst({
          where: { id: customerId, tenantId },
          select: { companyId: true },
        });
        if (cust?.companyId) companyId = cust.companyId;
      }

      // 2. Fetch tenant settings and customer state for GST determination
      const [settings, tenant, customer] = await Promise.all([
        tx.tenantInvoiceSettings.findUnique({ where: { tenantId } }),
        tx.tenant.findUnique({ where: { id: tenantId } }),
        customerId ? tx.customer.findFirst({ where: { id: customerId, tenantId } }) : null,
      ]);

      const isInterState = Boolean(
        settings?.state &&
          data.customerBillingAddress?.state &&
          settings.state.trim().toLowerCase() !== data.customerBillingAddress.state.trim().toLowerCase(),
      );

      // 3. Perform server-side precise financial calculation
      const rawItems = data.items && data.items.length > 0
        ? data.items
        : [
            {
              name: 'Custom Service / Product',
              quantity: 1,
              unitPrice: data.amount || 0,
              taxRate: settings ? toNumber(settings.defaultTaxRate) : 18.0,
            },
          ];

      const calc = calculateInvoiceTotals({
        items: rawItems,
        invoiceDiscountType: data.discountType,
        invoiceDiscountValue: data.discountValue,
        isInterState,
        paidAmount: 0,
      });

      // 4. Allocate unique invoice number
      const invoiceNumber = data.invoiceNumber?.trim() || (await this.allocateInvoiceNumber(tenantId, tx));

      // 5. Build billing address snapshots
      const customerBillingSnapshot = data.customerBillingAddress || (customer ? { name: customer.name, email: customer.email, company: customer.company } : null);
      const orgBillingSnapshot = data.orgBillingAddress || (settings ? { legalName: settings.legalName, gstin: settings.gstin, pan: settings.pan, address: settings.billingAddress, bankName: settings.bankName, accountNumber: settings.accountNumber, ifscCode: settings.ifscCode, upiId: settings.upiId } : { legalName: tenant?.name, address: tenant?.address });

      // 6. Create Invoice in Database
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          customerId,
          companyId,
          dealId: data.dealId || null,
          quotationId: data.quotationId || null,
          invoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          currency: data.currency || tenant?.currency || 'INR',
          paymentTerms: data.paymentTerms || settings?.defaultTerms || 'DUE_ON_RECEIPT',
          status: data.status || 'DRAFT',
          amount: calc.totalAmount,
          subtotal: calc.subtotal,
          discountType: calc.discountType,
          discountValue: calc.discountValue,
          discountAmount: calc.discountAmount,
          taxableAmount: calc.taxableAmount,
          cgstAmount: calc.cgstAmount,
          sgstAmount: calc.sgstAmount,
          igstAmount: calc.igstAmount,
          otherTaxAmount: calc.otherTaxAmount,
          roundOff: calc.roundOff,
          totalAmount: calc.totalAmount,
          paidAmount: 0,
          balanceAmount: calc.totalAmount,
          notes: data.notes || settings?.defaultNotes || null,
          termsAndConditions: data.termsAndConditions || settings?.defaultTerms || null,
          customerBillingAddress: customerBillingSnapshot,
          orgBillingAddress: orgBillingSnapshot,
          createdById: userId,
          items: {
            create: calc.items.map((it, idx) => ({
              productId: it.productId || null,
              name: it.name,
              description: it.description || null,
              quantity: it.quantity,
              unit: it.unit || 'unit',
              unitPrice: it.unitPrice,
              discountType: it.discountType || null,
              discountValue: it.discountValue || 0,
              discountAmount: it.discountAmount,
              taxRate: it.taxRate,
              taxAmount: it.taxAmount,
              lineTotal: it.lineTotal,
              sortOrder: it.sortOrder ?? idx,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
          company: true,
          deal: true,
          quotation: true,
        },
      });

      // 7. Record Timeline Event
      const curr = invoice.currency || 'INR';
      const formattedTotal = formatCurrency(calc.totalAmount, curr);
      await tx.timelineEvent.create({
        data: {
          tenantId,
          userId,
          action: 'INVOICE_CREATED',
          description: `Invoice ${invoiceNumber} created for ${formattedTotal}`,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          companyId: invoice.companyId,
          dealId: invoice.dealId,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber,
            totalAmount: calc.totalAmount,
            status: invoice.status,
          },
        },
      });

      // 8. Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'INVOICE_CREATED',
          module: 'INVOICES',
          details: {
            invoiceId: invoice.id,
            invoiceNumber,
            totalAmount: calc.totalAmount,
            customerId: invoice.customerId,
            itemCount: calc.items.length,
          },
        },
      });

      return invoice;
    });
  }

  async updateInvoice(
    tenantId: string,
    id: string,
    userId: string,
    data: UpdateInvoiceDto,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.invoice.findFirst({
        where: { id, tenantId },
        include: { items: true, payments: true },
      });

      if (!existing) throw new NotFoundException('Invoice not found');

      if (existing.status === 'PAID') {
        throw new BadRequestException('Cannot modify an invoice that is already fully PAID.');
      }

      // If items provided, recalculate server totals
      let calcUpdate: any = {};
      if (data.items && data.items.length > 0) {
        const settings = await tx.tenantInvoiceSettings.findUnique({ where: { tenantId } });
        const isInterState = Boolean(
          settings?.state &&
            data.customerBillingAddress?.state &&
            settings.state.trim().toLowerCase() !== data.customerBillingAddress.state.trim().toLowerCase(),
        );

        const currentPaid = toNumber(existing.paidAmount);
        const calc = calculateInvoiceTotals({
          items: data.items,
          invoiceDiscountType: data.discountType || (existing.discountType as any),
          invoiceDiscountValue: data.discountValue ?? existing.discountValue,
          isInterState,
          paidAmount: currentPaid,
        });

        // Delete old items and recreate
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        calcUpdate = {
          amount: calc.totalAmount,
          subtotal: calc.subtotal,
          discountType: calc.discountType,
          discountValue: calc.discountValue,
          discountAmount: calc.discountAmount,
          taxableAmount: calc.taxableAmount,
          cgstAmount: calc.cgstAmount,
          sgstAmount: calc.sgstAmount,
          igstAmount: calc.igstAmount,
          otherTaxAmount: calc.otherTaxAmount,
          roundOff: calc.roundOff,
          totalAmount: calc.totalAmount,
          paidAmount: currentPaid,
          balanceAmount: calc.balanceAmount,
          items: {
            create: calc.items.map((it, idx) => ({
              productId: it.productId || null,
              name: it.name,
              description: it.description || null,
              quantity: it.quantity,
              unit: it.unit || 'unit',
              unitPrice: it.unitPrice,
              discountType: it.discountType || null,
              discountValue: it.discountValue || 0,
              discountAmount: it.discountAmount,
              taxRate: it.taxRate,
              taxAmount: it.taxAmount,
              lineTotal: it.lineTotal,
              sortOrder: it.sortOrder ?? idx,
            })),
          },
        };
      }

      const updated = await tx.invoice.update({
        where: { id, tenantId },
        data: {
          ...(data.customerId !== undefined && { customerId: data.customerId || null }),
          ...(data.companyId !== undefined && { companyId: data.companyId || null }),
          ...(data.dealId !== undefined && { dealId: data.dealId || null }),
          ...(data.quotationId !== undefined && { quotationId: data.quotationId || null }),
          ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
          ...(data.invoiceDate !== undefined && { invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined }),
          ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
          ...(data.status && { status: data.status }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.termsAndConditions !== undefined && { termsAndConditions: data.termsAndConditions }),
          ...(data.customerBillingAddress !== undefined && { customerBillingAddress: data.customerBillingAddress }),
          ...calcUpdate,
        },
        include: {
          items: true,
          customer: true,
          company: true,
          payments: true,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'INVOICE_UPDATED',
          module: 'INVOICES',
          details: { invoiceId: id, invoiceNumber: existing.invoiceNumber },
        },
      });

      return updated;
    });
  }

  async getInvoices(
    tenantId: string,
    page = 1,
    limit = 20,
    options?: {
      search?: string;
      status?: string;
      customerId?: string;
      companyId?: string;
      dealId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(limit, 1000));
      const skip = (page - 1) * limit;

      const where: Prisma.InvoiceWhereInput = { tenantId };

      if (options?.status && options.status.toUpperCase() !== 'ALL') {
        const st = options.status.toUpperCase();
        if (st === 'OVERDUE') {
          where.dueDate = { lt: new Date() };
          where.balanceAmount = { gt: 0 };
          where.status = { notIn: ['PAID', 'CANCELLED', 'VOID', 'REFUNDED'] };
        } else {
          where.status = st;
        }
      }

      if (options?.customerId) where.customerId = options.customerId;
      if (options?.companyId) where.companyId = options.companyId;
      if (options?.dealId) where.dealId = options.dealId;

      if (options?.dateFrom || options?.dateTo) {
        where.invoiceDate = {
          ...(options.dateFrom && { gte: new Date(options.dateFrom) }),
          ...(options.dateTo && { lte: new Date(options.dateTo) }),
        };
      }

      if (options?.search) {
        const q = options.search.trim();
        where.OR = [
          { invoiceNumber: { contains: q, mode: 'insensitive' } },
          { customer: { name: { contains: q, mode: 'insensitive' } } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
          { notes: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [invoices, total, currency] = await Promise.all([
        tx.invoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            customer: { select: { id: true, name: true, company: true, email: true } },
            company: { select: { id: true, name: true } },
            deal: { select: { id: true, name: true, value: true } },
            payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true, status: true } },
          },
        }),
        tx.invoice.count({ where }),
        this.getTenantCurrency(tenantId),
      ]);

      // Calculate aggregated metrics for organization
      const allStats = await tx.invoice.findMany({
        where: { tenantId },
        select: {
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          status: true,
          dueDate: true,
        },
      });

      let totalInvoiced = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let totalOverdue = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (const inv of allStats) {
        const tot = toNumber(inv.totalAmount);
        const pd = toNumber(inv.paidAmount);
        const bal = toNumber(inv.balanceAmount) || (tot - pd);

        totalInvoiced += tot;
        totalPaid += pd;

        const isOverdue = inv.dueDate && new Date(inv.dueDate) < now && bal > 0 && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'VOID';

        if (inv.status === 'PAID') {
          paidCount++;
        } else if (isOverdue) {
          overdueCount++;
          totalOverdue += bal;
        } else if (inv.status !== 'CANCELLED' && inv.status !== 'VOID') {
          pendingCount++;
          totalPending += bal;
        }
      }

      return {
        stats: {
          totalInvoiced,
          totalInvoicedFormatted: formatCurrency(totalInvoiced, currency),
          totalPaid,
          totalPaidFormatted: formatCurrency(totalPaid, currency),
          totalPending,
          totalPendingFormatted: formatCurrency(totalPending, currency),
          totalOverdue,
          totalOverdueFormatted: formatCurrency(totalOverdue, currency),
          paidCount,
          pendingCount,
          overdueCount,
          totalCount: allStats.length,
        },
        invoices: invoices.map((inv) => {
          const tot = toNumber(inv.totalAmount || inv.amount);
          const pd = toNumber(inv.paidAmount);
          const bal = toNumber(inv.balanceAmount) || (tot - pd);
          const isOverdue = this.checkIsOverdue(inv.dueDate, bal, inv.status);
          const displayStatus = isOverdue && inv.status !== 'CANCELLED' && inv.status !== 'VOID' ? 'OVERDUE' : inv.status;

          return {
            id: inv.id,
            tenantId: inv.tenantId,
            customerId: inv.customerId,
            companyId: inv.companyId,
            dealId: inv.dealId,
            quotationId: inv.quotationId,
            invoiceNumber: inv.invoiceNumber || inv.id.slice(0, 8),
            invoiceDate: inv.invoiceDate.toISOString(),
            dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
            currency: inv.currency || currency,
            paymentTerms: inv.paymentTerms,
            status: displayStatus,
            subtotal: toNumber(inv.subtotal),
            discountAmount: toNumber(inv.discountAmount),
            taxableAmount: toNumber(inv.taxableAmount),
            cgstAmount: toNumber(inv.cgstAmount),
            sgstAmount: toNumber(inv.sgstAmount),
            igstAmount: toNumber(inv.igstAmount),
            roundOff: toNumber(inv.roundOff),
            totalAmount: tot,
            totalAmountFormatted: formatCurrency(tot, inv.currency || currency),
            paidAmount: pd,
            paidAmountFormatted: formatCurrency(pd, inv.currency || currency),
            balanceAmount: bal,
            balanceAmountFormatted: formatCurrency(bal, inv.currency || currency),
            customer: inv.customer,
            company: inv.company,
            deal: inv.deal,
            paymentsCount: inv.payments.length,
            createdAt: inv.createdAt.toISOString(),
            updatedAt: inv.updatedAt.toISOString(),
          };
        }),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    });
  }

  async getInvoiceById(tenantId: string, id: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, tenantId },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          customer: true,
          company: true,
          deal: true,
          quotation: true,
          payments: { orderBy: { paymentDate: 'desc' } },
          timelineEvents: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });

      if (!invoice) return null;

      const currency = invoice.currency || 'INR';
      const tot = toNumber(invoice.totalAmount || invoice.amount);
      const pd = toNumber(invoice.paidAmount);
      const bal = toNumber(invoice.balanceAmount) || (tot - pd);
      const isOverdue = this.checkIsOverdue(invoice.dueDate, bal, invoice.status);

      return {
        ...invoice,
        status: isOverdue && invoice.status !== 'CANCELLED' && invoice.status !== 'VOID' ? 'OVERDUE' : invoice.status,
        amount: tot,
        subtotal: toNumber(invoice.subtotal),
        discountValue: toNumber(invoice.discountValue),
        discountAmount: toNumber(invoice.discountAmount),
        taxableAmount: toNumber(invoice.taxableAmount),
        cgstAmount: toNumber(invoice.cgstAmount),
        sgstAmount: toNumber(invoice.sgstAmount),
        igstAmount: toNumber(invoice.igstAmount),
        otherTaxAmount: toNumber(invoice.otherTaxAmount),
        roundOff: toNumber(invoice.roundOff),
        totalAmount: tot,
        totalAmountFormatted: formatCurrency(tot, currency),
        paidAmount: pd,
        paidAmountFormatted: formatCurrency(pd, currency),
        balanceAmount: bal,
        balanceAmountFormatted: formatCurrency(bal, currency),
        items: invoice.items.map((it) => ({
          ...it,
          quantity: toNumber(it.quantity),
          unitPrice: toNumber(it.unitPrice),
          discountValue: toNumber(it.discountValue),
          discountAmount: toNumber(it.discountAmount),
          taxRate: toNumber(it.taxRate),
          taxAmount: toNumber(it.taxAmount),
          lineTotal: toNumber(it.lineTotal),
        })),
        payments: invoice.payments.map((p) => ({
          ...p,
          amount: toNumber(p.amount),
          amountFormatted: formatCurrency(toNumber(p.amount), p.currency || currency),
        })),
      };
    });
  }

  async generateInvoicePdf(tenantId: string, id: string): Promise<string> {
    const invoice = await this.getInvoiceById(tenantId, id);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const [settings, tenant] = await Promise.all([
      this.prisma.tenantInvoiceSettings.findUnique({ where: { tenantId } }),
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    return this.pdfService.generateInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8),
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: invoice.currency,
      paymentTerms: invoice.paymentTerms,
      companyName: settings?.legalName || tenant?.name || 'Company',
      companyAddress: settings?.billingAddress || tenant?.address,
      companyCity: settings?.city,
      companyState: settings?.state,
      companyPostalCode: settings?.postalCode,
      companyCountry: settings?.country,
      companyGstin: settings?.gstin || tenant?.taxId,
      companyPan: settings?.pan,
      companyLogo: tenant?.logo,
      bankName: settings?.bankName,
      accountNumber: settings?.accountNumber,
      ifscCode: settings?.ifscCode,
      accountHolderName: settings?.accountHolderName,
      upiId: settings?.upiId,
      customerName: invoice.customer?.name,
      customerCompany: invoice.company?.name || invoice.customer?.company,
      customerEmail: invoice.customer?.email,
      customerPhone: (invoice.company as any)?.phone || null,
      customerAddress: (invoice.customerBillingAddress as any)?.address,
      customerCity: (invoice.customerBillingAddress as any)?.city,
      customerState: (invoice.customerBillingAddress as any)?.state,
      customerPostalCode: (invoice.customerBillingAddress as any)?.postalCode,
      customerGstin: (invoice.customerBillingAddress as any)?.gstin,
      customerPan: (invoice.customerBillingAddress as any)?.pan,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      taxableAmount: invoice.taxableAmount,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      otherTaxAmount: invoice.otherTaxAmount,
      roundOff: invoice.roundOff,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceAmount: invoice.balanceAmount,
      notes: invoice.notes,
      termsAndConditions: invoice.termsAndConditions,
    });
  }

  async sendInvoice(
    tenantId: string,
    id: string,
    userId: string,
    dto?: SendInvoiceEmailDto,
  ) {
    return this.emailService.sendInvoiceEmail(tenantId, id, userId, dto);
  }

  async deleteInvoice(tenantId: string, id: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, tenantId },
        include: { payments: true },
      });

      if (!invoice) throw new NotFoundException('Invoice not found');

      if (invoice.payments.length > 0) {
        throw new BadRequestException(
          'Cannot delete an invoice with recorded payments. Please void or cancel the invoice instead to maintain financial audit integrity.',
        );
      }

      await tx.invoice.delete({ where: { id, tenantId } });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'INVOICE_DELETED',
          module: 'INVOICES',
          details: {
            invoiceId: id,
            invoiceNumber: invoice.invoiceNumber,
            amount: toNumber(invoice.totalAmount || invoice.amount),
          },
        },
      });

      return { id };
    });
  }

  async updateInvoiceStatus(tenantId: string, id: string, status: string, userId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, tenantId },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');

      const upper = status.toUpperCase();
      const validStatuses = ['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID', 'REFUNDED'];
      if (!validStatuses.includes(upper)) {
        throw new BadRequestException(`Invalid invoice status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
      }

      if (invoice.status === 'PAID' && upper === 'DRAFT') {
        throw new BadRequestException('Cannot revert a PAID invoice to DRAFT.');
      }

      const updated = await tx.invoice.update({
        where: { id, tenantId },
        data: {
          status: upper,
          ...(upper === 'CANCELLED' && { cancelledAt: new Date() }),
          ...(upper === 'PAID' && !invoice.paidAt && { paidAt: new Date() }),
          ...(upper === 'VIEWED' && !invoice.viewedAt && { viewedAt: new Date() }),
        },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          userId,
          action: 'INVOICE_STATUS_CHANGED',
          description: `Invoice ${invoice.invoiceNumber || id.slice(0, 8)} status changed from ${invoice.status} to ${upper}`,
          invoiceId: id,
          customerId: invoice.customerId,
          companyId: invoice.companyId,
          dealId: invoice.dealId,
          metadata: { previousStatus: invoice.status, newStatus: upper },
        },
      });

      return updated;
    });
  }
}
