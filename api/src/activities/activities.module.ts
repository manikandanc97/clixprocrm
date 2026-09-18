import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { MeetingsController } from './meetings.controller';
import { CalendarService } from './services/calendar.service';
import { MeetingsService } from './services/meetings.service';
import { TasksExportService } from './services/tasks.export.service';
import { TasksHistoryService } from './services/tasks.history.service';
import { TasksQueryService } from './services/tasks.query.service';
import { TasksService } from './services/tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  controllers: [TasksController, MeetingsController, CalendarController],
  providers: [
    TasksService,
    TasksQueryService,
    TasksExportService,
    TasksHistoryService,
    MeetingsService,
    CalendarService,
  ],
  exports: [
    TasksService,
    TasksQueryService,
    TasksExportService,
    TasksHistoryService,
    MeetingsService,
    CalendarService,
  ],
})
export class ActivitiesModule {}
