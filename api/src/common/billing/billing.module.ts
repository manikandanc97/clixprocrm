import { Module, Global } from '@nestjs/common';
import { BillingGatewayService } from './billing-gateway.service';
import { BillingWebhookController } from './billing-webhook.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BillingWebhookController],
  providers: [BillingGatewayService],
  exports: [BillingGatewayService],
})
export class BillingModule {}
