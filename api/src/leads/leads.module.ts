import { Module, forwardRef } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { HotLeadsController } from './hot-leads.controller';
import { LeadsService } from './services/leads.service';
import { LeadsImportService } from './services/leads.import.service';
import { LeadsQueryService } from './services/leads.query.service';
import { LeadsConvertService } from './services/leads.convert.service';
import { StorageService } from '../common/services/storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ActivitiesModule)],
  controllers: [LeadsController, HotLeadsController],
  providers: [
    LeadsService,
    LeadsImportService,
    LeadsQueryService,
    LeadsConvertService,
    StorageService,
  ],
  exports: [
    LeadsService,
    LeadsImportService,
    LeadsQueryService,
    LeadsConvertService,
    StorageService,
  ],
})
export class LeadsModule {}

