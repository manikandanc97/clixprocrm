import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingGatewayService } from './billing-gateway.service';
import { BillingWebhookController } from './billing-webhook.controller';
import { BillingWebhookService } from './billing-webhook.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BillingWebhookController],
  providers: [BillingGatewayService, BillingWebhookService],
  exports: [BillingGatewayService, BillingWebhookService],
})
export class BillingModule {}
