import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { MeetingsController } from './meetings.controller';
import { CalendarController } from './calendar.controller';
import { TasksService } from './services/tasks.service';
import { TasksQueryService } from './services/tasks.query.service';
import { TasksExportService } from './services/tasks.export.service';
import { TasksHistoryService } from './services/tasks.history.service';
import { MeetingsService } from './services/meetings.service';
import { CalendarService } from './services/calendar.service';

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
