import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { TenantContextModule } from './common/context/tenant-context.module';
import { BillingModule } from './common/billing/billing.module';
import { SubscriptionEntitlementModule } from './common/plans/subscription-entitlement.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ContactsModule } from './contacts/contacts.module';
import { CompaniesModule } from './companies/companies.module';
import { LeadsModule } from './leads/leads.module';
import { DealsModule } from './deals/deals.module';
import { ActivitiesModule } from './activities/activities.module';
import { FinanceModule } from './finance/finance.module';
import { InsightsModule } from './insights/insights.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { AdminModule } from './admin/admin.module';
import { SystemModule } from './system/system.module';
import { SupportModule } from './support/support.module';
import { AiModule } from './ai/ai.module';
import { CustomersModule } from './customers/customers.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
