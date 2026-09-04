import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { LeadsService } from './services/leads.service';
import { LeadsImportService } from './services/leads.import.service';
import { MeetingsService } from '../activities/services/meetings.service';
import { ImportQueueProducer } from '../queue/producers/import-queue.producer';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { BulkImportDto } from './dto/bulk-import.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../common/utils/rate-limit.util';
import { Request } from 'express';

import { PlanLimitGuard } from '../common/plans/plan-feature.guard';
import { RequirePlanLimit } from '../common/plans/plan-feature.decorator';

@Controller('crm/leads')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadsImportService: LeadsImportService,
    private readonly meetingsService: MeetingsService,
    @Optional() private readonly importQueueProducer?: ImportQueueProducer,
  ) {}

  @Get()
  async getLeads(
    @Req() req: any,
    @Query() query: PaginationQueryDto & { stage?: string; status?: string },
  ) {
    const data = await this.leadsService.getLeads(req.tenantId, query);
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  @UseGuards(PlanLimitGuard)
  @RequirePlanLimit('maxLeads')
  async createLead(@Req() req: any, @Body() body: CreateLeadDto) {
    const data = await this.leadsService.createLead(
      req.tenantId,
      req.user.sub,
      body,
    );
    return { success: true, data };
  }

  @Post('bulk')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async bulkDeleteLeads(@Req() req: any, @Body() body: any) {
    const ip = getClientIp(req);
    const identifier = `bulk_delete_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.BULK_DELETE);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res?.setHeader('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.BULK_DELETE);

    if (!body.ids || !Array.isArray(body.ids)) {
      throw new HttpException(
        { success: false, message: 'Invalid request. Expected array of ids.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.leadsService.bulkDeleteLeads(
      req.tenantId,
      req.user.sub,
      body.ids,
    );
    return { success: true, data: { count: body.ids.length } };
  }

  @Get(':id')
  async getLeadById(@Req() req: any, @Param('id') id: string) {
    const data = await this.leadsService.getLeadById(req.tenantId, id);
    return { success: true, data };
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async updateLead(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateLeadDto,
  ) {
    const data = await this.leadsService.updateLead(
      req.tenantId,
      req.user.sub,
      id,
      body,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async deleteLead(@Req() req: any, @Param('id') id: string) {
    const ip = getClientIp(req);
    const identifier = `delete_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.DELETE);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res?.setHeader('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.DELETE);

    await this.leadsService.deleteLead(req.tenantId, req.user.sub, id);
    return { success: true, data: { id } };
  }

  @Get(':id/attachments')
  async getLeadAttachments(@Req() req: any, @Param('id') id: string) {
    const data = await this.leadsService.getLeadAttachments(req.tenantId, id);
    return { success: true, data };
  }

  @Post(':id/attachments')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createLeadAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const ip = getClientIp(req);
    const identifier = `upload_${ip}`;
    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.FILE_UPLOAD);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res?.setHeader('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.FILE_UPLOAD);

    // 1. If base64 file data is passed in JSON payload
    if (body?.fileData) {
      const base64Data = body.fileData.includes(';base64,')
        ? body.fileData.split(';base64,')[1]
        : body.fileData;
      const fileBuffer = Buffer.from(base64Data, 'base64');
      const filename = body.fileName || 'attachment';
      const fileType = body.fileType || 'application/octet-stream';

      const data = await this.leadsService.uploadAndCreateLeadAttachment(
        req.tenantId,
        id,
        req.user.sub,
        fileBuffer,
        filename,
        fileType,
      );
      return { success: true, data };
    }

    // 2. If multipart/form-data upload
    if (typeof req.isMultipart === 'function' && req.isMultipart()) {
      try {
        const file = await req.file();
        if (file) {
          const fileBuffer = await file.toBuffer();
          const filename = file.filename || 'attachment';
          const fileType = file.mimetype || 'application/octet-stream';

          const data = await this.leadsService.uploadAndCreateLeadAttachment(
            req.tenantId,
            id,
            req.user.sub,
            fileBuffer,
            filename,
            fileType,
          );
          return { success: true, data };
        }
      } catch (err: any) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: `Failed to process multipart upload: ${err?.message || err}`,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 3. Fallback: Pre-uploaded or URL-provided metadata
    const data = await this.leadsService.createLeadAttachment(
      req.tenantId,
      id,
      req.user.sub,
      body,
    );
    return { success: true, data };
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async deleteLeadAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    const data = await this.leadsService.deleteLeadAttachment(
      req.tenantId,
      id,
      attachmentId,
    );
    return { success: true, data };
  }

  @Get(':id/notes')
  async getLeadNotes(@Req() req: any, @Param('id') id: string) {
    const data = await this.leadsService.getLeadNotes(req.tenantId, id);
    return { success: true, data };
  }

  @Post(':id/notes')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createLeadNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.leadsService.createLeadNote(
      req.tenantId,
      id,
      req.user.sub,
      body,
    );
    return { success: true, data };
  }

  @Get(':id/timeline')
  async getLeadTimeline(@Req() req: any, @Param('id') id: string) {
    const data = await this.leadsService.getLeadTimeline(req.tenantId, id);
    return { success: true, data };
  }

  @Post(':id/timeline')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createTimelineEvent(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.leadsService.createTimelineEvent(
      req.tenantId,
      id,
      body.action,
      body.description,
      req.user.sub,
    );
    return { success: true, data };
  }

  @Get(':id/meetings')
  async getLeadMeetings(@Req() req: any, @Param('id') id: string) {
    const data = await this.meetingsService.getLeadMeetings(req.tenantId, id);
    return { success: true, data };
  }

  @Post(':id/meetings')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async createLeadMeeting(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const meetingData = {
      ...body,
      leadId: id,
    };
    const data = await this.meetingsService.createMeeting(
      req.tenantId,
      req.user.sub,
      meetingData,
    );
    return { success: true, data };
  }

  @Post(':id/convert')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async convertLead(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ConvertLeadDto,
  ) {
    const data = await this.leadsService.convertLead(
      req.tenantId,
      req.user.sub,
      id,
      body,
    );
    return { success: true, message: 'Lead converted successfully', data };
  }

  @Post('import')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  async importLeads(@Req() req: any, @Body() body: BulkImportDto) {
    const ip = getClientIp(req);
    const identifier = `import_${ip}`;

    const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.IMPORT);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      req.res.setHeader('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await incrementRateLimit(identifier, RATE_LIMITS.IMPORT);

    if (!body.leads || body.leads.length === 0) {
      throw new HttpException(
        { success: false, message: 'No leads provided' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (this.importQueueProducer?.isQueueAvailable()) {
      const enqueueResult = await this.importQueueProducer.enqueueLeadsImport({
        tenantId: req.tenantId,
        userId: req.user.sub,
        leads: body.leads,
        duplicateStrategy: body.duplicateStrategy,
      });

      if (enqueueResult.enqueued) {
        return {
          success: true,
          data: {
            jobId: enqueueResult.jobId,
            status: 'queued',
            count: body.leads.length,
            message: 'Leads import job enqueued successfully',
          },
        };
      }
    }

    // Direct execution fallback if queue is unavailable
    const data = await this.leadsImportService.bulkImportLeads(
      req.tenantId,
      req.user.sub,
      body.leads,
      body.duplicateStrategy,
    );

    return { success: true, data };
  }
}
