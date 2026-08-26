import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateInvoiceSettingsDto } from '../dto/enterprise-invoice.dto';
import { toNumber } from '../../common/utils/crm-formatters.util';

@Injectable()
export class InvoiceSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves organization invoice settings, creating defaults if not yet created.
   */
  async getSettings(tenantId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      let settings = await tx.tenantInvoiceSettings.findUnique({
        where: { tenantId },
      });

      if (!settings) {
        // Fetch tenant details to initialize sensible defaults
        const tenant = await tx.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true, address: true, taxId: true, currency: true },
        });

        settings = await tx.tenantInvoiceSettings.create({
          data: {
            tenantId,
            legalName: tenant?.name || 'Company Name',
            billingAddress: tenant?.address || '',
            gstin: tenant?.taxId || '',
            invoicePrefix: 'INV',
            nextInvoiceNumber: 1,
            financialYear: '2026-2027',
            taxType: 'GST',
            defaultTaxRate: 18.0,
            country: 'India',
            defaultNotes: 'Thank you for doing business with us.',
            defaultTerms: 'Payment is due within 15 days of invoice date.',
          },
        });
      }

      return {
        ...settings,
        defaultTaxRate: toNumber(settings.defaultTaxRate),
      };
    });
  }

  /**
   * Updates organization invoice settings.
   */
  async updateSettings(
    tenantId: string,
    userId: string,
    dto: UpdateInvoiceSettingsDto,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.tenantInvoiceSettings.findUnique({
        where: { tenantId },
      });

      const dataToSave: any = {
        ...(dto.invoicePrefix !== undefined && { invoicePrefix: dto.invoicePrefix.toUpperCase().trim() }),
        ...(dto.nextInvoiceNumber !== undefined && { nextInvoiceNumber: Math.max(1, dto.nextInvoiceNumber) }),
        ...(dto.financialYear !== undefined && { financialYear: dto.financialYear }),
        ...(dto.gstin !== undefined && { gstin: dto.gstin?.toUpperCase() }),
        ...(dto.pan !== undefined && { pan: dto.pan?.toUpperCase() }),
        ...(dto.legalName !== undefined && { legalName: dto.legalName }),
        ...(dto.billingAddress !== undefined && { billingAddress: dto.billingAddress }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.bankName !== undefined && { bankName: dto.bankName }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.ifscCode !== undefined && { ifscCode: dto.ifscCode?.toUpperCase() }),
        ...(dto.accountHolderName !== undefined && { accountHolderName: dto.accountHolderName }),
        ...(dto.upiId !== undefined && { upiId: dto.upiId }),
        ...(dto.defaultNotes !== undefined && { defaultNotes: dto.defaultNotes }),
        ...(dto.defaultTerms !== undefined && { defaultTerms: dto.defaultTerms }),
        ...(dto.taxType !== undefined && { taxType: dto.taxType }),
        ...(dto.defaultTaxRate !== undefined && { defaultTaxRate: dto.defaultTaxRate }),
      };

      const updated = existing
        ? await tx.tenantInvoiceSettings.update({
            where: { tenantId },
            data: dataToSave,
          })
        : await tx.tenantInvoiceSettings.create({
            data: {
              tenantId,
              ...dataToSave,
            },
          });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'INVOICE_SETTINGS_UPDATED',
          module: 'INVOICES',
          details: JSON.parse(JSON.stringify({ ...dto })),
        },
      });

      return {
        ...updated,
        defaultTaxRate: toNumber(updated.defaultTaxRate),
      };
    });
  }
}
