import { Module } from '@nestjs/common';
import { StorageService } from '../common/services/storage.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportController } from './controllers/support.controller';
import { SupportService } from './services/support.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService, StorageService],
  exports: [SupportService],
})
export class SupportModule {}
