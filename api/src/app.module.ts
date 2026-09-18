import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './common/billing/billing.module';
import { TenantContextModule } from './common/context/tenant-context.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { SubscriptionEntitlementModule } from './common/plans/subscription-entitlement.module';
import { CompaniesModule } from './companies/companies.module';
import { ContactsModule } from './contacts/contacts.module';
import { CustomersModule } from './customers/customers.module';
import { DealsModule } from './deals/deals.module';
import { EmailModule } from './email/email.module';
import { FinanceModule } from './finance/finance.module';
import { InsightsModule } from './insights/insights.module';
import { LeadsModule } from './leads/leads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { SupportModule } from './support/support.module';
import { SystemModule } from './system/system.module';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TenantContextModule, // Global: Request-scoped TenantContextService available everywhere
    EncryptionModule, // Global: EncryptionService available everywhere
    BillingModule, // Global: Billing & Webhook Gateway available everywhere
    SubscriptionEntitlementModule, // Global: Subscription & Entitlement Service available everywhere
    QueueModule, // Global: BullMQ Queue Infrastructure
    PrismaModule,
    AuthModule,
    SuperAdminModule,

    ContactsModule,
    CompaniesModule,
    LeadsModule,
    DealsModule,
    ActivitiesModule,
    FinanceModule,
    InsightsModule,
    NotificationsModule,
    WorkspaceModule,
    AdminModule,
    SystemModule,
    SupportModule,
    AiModule,
    CustomersModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
