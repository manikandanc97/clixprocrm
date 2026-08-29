import { Module } from '@nestjs/common';
import { SupportController } from './controllers/support.controller';
import { SupportService } from './services/support.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageService } from '../common/services/storage.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService, StorageService],
  exports: [SupportService],
})
export class SupportModule {}
