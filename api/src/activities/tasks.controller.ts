import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './services/tasks.service';
import { TasksQueryService } from './services/tasks.query.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PlanLimitGuard } from '../common/plans/plan-feature.guard';
import { RequirePlanLimit } from '../common/plans/plan-feature.decorator';

@Controller('crm/tasks')
@UseGuards(SupabaseAuthGuard, TenantGuard, PermissionsGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly tasksQueryService: TasksQueryService,
  ) {}

  @Get()
  @Permissions('Tasks')
  async getTasks(@Req() req: any, @Query() query: TaskQueryDto) {
    const data = await this.tasksQueryService.getTasks(req.tenantId, {
      ...query,
      userId: req.user.id || req.user.sub,
      role: req.user.role,
    });
    // TaskQueryService returns an object `{ stats, dashboardStats, tasks, pagination }` natively
    return { success: true, data };
  }

  @Post()
  @Permissions('Tasks')
  @UseGuards(PlanLimitGuard)
  @RequirePlanLimit('maxTasks')
  async createTask(@Req() req: any, @Body() body: CreateTaskDto) {
    const data = await this.tasksService.createTask(
      req.tenantId,
      req.user.id || req.user.sub,
      body,
    );
    return { success: true, data };
  }

  @Get('dashboard')
  @Permissions('Tasks')
  async getDashboard(@Req() req: any) {
    const result = await this.tasksQueryService.getTasks(req.tenantId, {
      userId: req.user.id || req.user.sub,
      role: req.user.role,
      limit: 1000,
    });
    return {
      success: true,
      data: {
        stats: result.stats,
        dashboardStats: result.dashboardStats,
      },
    };
  }

  @Get('board')
  @Permissions('Tasks')
  async getBoard(@Req() req: any, @Query('search') search: string = '') {
    const result = await this.tasksQueryService.getTasks(req.tenantId, {
      userId: req.user.id || req.user.sub,
      role: req.user.role,
      limit: 1000,
      search,
    });

    const columns = {
      PENDING: result.tasks.filter((t) => t.status === 'PENDING'),
      IN_PROGRESS: result.tasks.filter((t) => t.status === 'IN_PROGRESS'),
      BLOCKED: result.tasks.filter((t) => t.status === 'BLOCKED'),
      COMPLETED: result.tasks.filter((t) => t.status === 'COMPLETED'),
      CANCELLED: result.tasks.filter((t) => t.status === 'CANCELLED'),
      OVERDUE: result.tasks.filter((t) => t.status === 'OVERDUE'),
    };

    return { success: true, data: columns };
  }

  @Get('calendar')
  @Permissions('Tasks')
  async getCalendar(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.tasksQueryService.getTasks(req.tenantId, {
      userId: req.user.id || req.user.sub,
      role: req.user.role,
      limit: 500,
      startDate,
      endDate,
    });

    const calendarEvents = result.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: task.dueDateValue || task.createdAt,
      end: task.dueDateValue || task.createdAt,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      isOverdue: task.isOverdue,
      rawTask: task,
    }));

    return { success: true, data: calendarEvents };
  }

  @Get('export')
  @Permissions('Tasks')
  async exportTasks(@Req() req: any, @Query() query: any, @Res() res: any) {
    const csvString = await this.tasksQueryService.exportTasks(
      req.tenantId,
      req.user.id || req.user.sub,
      query,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tasks_export_${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.status(200).send(csvString);
  }

  @Get(':id')
  @Permissions('Tasks')
  async getTaskById(@Req() req: any, @Param('id') id: string) {
    const data = await this.tasksQueryService.getTaskById(req.tenantId, id, {
      userId: req.user.id || req.user.sub,
      role: req.user.role,
    });
    if (!data) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, data };
  }

  @Put(':id')
  @Permissions('Tasks')
  async updateTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ) {
    const data = await this.tasksService.updateTask(
      req.tenantId,
      req.user,
      id,
      body,
    );
    return { success: true, data };
  }

  @Get(':id/history')
  @Permissions('Tasks')
  async getTaskHistory(@Req() req: any, @Param('id') id: string) {
    const data = await this.tasksQueryService.getTaskHistory(req.tenantId, id);
    return { success: true, data };
  }

  @Delete(':id')
  @Permissions('Tasks')
  async deleteTask(@Req() req: any, @Param('id') id: string) {
    const data = await this.tasksService.deleteTask(req.tenantId, req.user, id);
    return { success: true, data };
  }

  @Post(':id/timeline')
  @Permissions('Tasks')
  async addTimelineEvent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { action: string; description?: string; metadata?: any },
  ) {
    const data = await this.tasksService.addTimelineEvent(
      req.tenantId,
      req.user,
      id,
      body,
    );
    return { success: true, data };
  }

  @Patch(':id/progress')
  @Permissions('Tasks')
  async updateProgress(
    @Req() req: any,
    @Param('id') id: string,
    @Body('progress') progress: number,
  ) {
    const data = await this.tasksService.updateProgress(
      req.tenantId,
      req.user,
      id,
      progress,
    );
    return { success: true, data };
  }

  @Post(':id/complete')
  @Permissions('Tasks')
  async completeTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    const data = await this.tasksService.completeTask(
      req.tenantId,
      req.user,
      id,
      note,
    );
    return { success: true, data };
  }

  @Post(':id/blockers/resolve')
  @Permissions('Tasks')
  async resolveBlocker(@Req() req: any, @Param('id') id: string) {
    const data = await this.tasksService.resolveBlocker(
      req.tenantId,
      req.user,
      id,
    );
    return { success: true, data };
  }
}
