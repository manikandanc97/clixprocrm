import { Module, Global } from '@nestjs/common';
import { BillingGatewayService } from './billing-gateway.service';
import { BillingWebhookService } from './billing-webhook.service';
import { BillingWebhookController } from './billing-webhook.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BillingWebhookController],
  providers: [BillingGatewayService, BillingWebhookService],
  exports: [BillingGatewayService, BillingWebhookService],
})
export class BillingModule {}

