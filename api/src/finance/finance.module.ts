import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RevenueController } from './controllers/revenue.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { QuotationsController } from './controllers/quotations.controller';
import { PaymentsController } from './controllers/payments.controller';
import { InvoiceSettingsController } from './controllers/invoice-settings.controller';
import { RevenueService } from './services/revenue.service';
import { InvoicesService } from './services/invoices.service';
import { QuotationsService } from './services/quotations.service';
import { PaymentsService } from './services/payments.service';
import { InvoiceSettingsService } from './services/invoice-settings.service';
import { InvoicePdfService } from './services/invoice-pdf.service';
import { InvoiceEmailService } from './services/invoice-email.service';
import { EmailService } from '../common/services/email.service';

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
