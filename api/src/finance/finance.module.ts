import { Module } from '@nestjs/common';
import { EmailService } from '../common/services/email.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceSettingsController } from './controllers/invoice-settings.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { QuotationsController } from './controllers/quotations.controller';
import { RevenueController } from './controllers/revenue.controller';
import { InvoiceEmailService } from './services/invoice-email.service';
import { InvoicePdfService } from './services/invoice-pdf.service';
import { InvoiceSettingsService } from './services/invoice-settings.service';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { QuotationsService } from './services/quotations.service';
import { RevenueService } from './services/revenue.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    RevenueController,
    InvoicesController,
    QuotationsController,
    PaymentsController,
    InvoiceSettingsController,
  ],
  providers: [
    RevenueService,
    InvoicesService,
    QuotationsService,
    PaymentsService,
    InvoiceSettingsService,
    InvoicePdfService,
    InvoiceEmailService,
    EmailService,
  ],
  exports: [
    RevenueService,
    InvoicesService,
    QuotationsService,
    PaymentsService,
    InvoiceSettingsService,
    InvoicePdfService,
    InvoiceEmailService,
  ],
})
export class FinanceModule {}
