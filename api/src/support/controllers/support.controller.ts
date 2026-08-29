import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SupportService } from '../services/support.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import {
  checkRateLimit,
  incrementRateLimit,
  getClientIp,
} from '../../common/utils/rate-limit.util';
import * as path from 'path';

const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.log',
  '.json',
  '.csv',
  '.zip',
  '.xlsx',
  '.xls',
  '.doc',
  '.docx',
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.m4v',
]);

const MAX_INDIVIDUAL_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_ATTACHMENTS_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_ATTACHMENTS_COUNT = 10;

const SUPPORT_RATE_LIMIT = { maxRequests: 30, windowMs: 10 * 60 * 1000 }; // 30 requests per 10 mins

@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly supportService: SupportService) {}

  @Get('health')
  getHealth() {
    return {
      success: true,
      data: this.supportService.getSystemStatus(),
    };
  }

  @Get('ping')
  getPing() {
    return {
      status: 'ok',
      timestamp: Date.now(),
      server: 'ClixPro CRM API Gateway',
    };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard)
  @Get('tickets')
  async getTickets(@Req() req: any) {
    const userId = req.user.id;
    const tenantId = req.tenantId;
    const tickets = await this.supportService.getUserTickets(userId, tenantId);
    return {
      success: true,
      data: tickets,
    };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard)
  @Get('tickets/:id')
  async getTicketById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const tenantId = req.tenantId;
    const ticket = await this.supportService.getTicketById(id, userId, tenantId);
    if (!ticket) {
      throw new NotFoundException('Support ticket not found or access denied');
    }
    return {
      success: true,
      data: ticket,
    };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard)
  @Post('tickets/:id/reply')
  async replyTicket(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Req() req: any,
  ) {
    if (!body?.message || !body.message.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }
    const userId = req.user.id;
    const userName = req.user?.name || req.user?.user_metadata?.name || req.user?.email || 'Customer';
    const tenantId = req.tenantId;

    const updatedTicket = await this.supportService.addReplyToTicket(
      id,
      userId,
      userName,
      body.message,
      tenantId,
    );
    if (!updatedTicket) {
      throw new NotFoundException('Support ticket not found or access denied');
    }
    return {
      success: true,
      data: updatedTicket,
    };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard)
  @Patch('tickets/:id')
  async updateTicket(
    @Param('id') id: string,
    @Body() body: {
      subject?: string;
      description?: string;
      category?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      status?: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
    },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const tenantId = req.tenantId;
    const userRole = req.userRole?.name || req.userRole || req.user?.role;
    const isSuperAdmin = Boolean(req.isSuperAdmin || req.user?.isSuperAdmin);

    const updated = await this.supportService.updateTicket(
      id,
      userId,
      body,
      tenantId,
      userRole,
      isSuperAdmin,
    );

    return {
      success: true,
      data: updated,
    };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard)
  @Delete('tickets/:id')
  async deleteTicket(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const tenantId = req.tenantId;
    const userRole = req.userRole?.name || req.userRole || req.user?.role;
    const isSuperAdmin = Boolean(req.isSuperAdmin || req.user?.isSuperAdmin);

    const result = await this.supportService.deleteTicket(
      id,
      userId,
      tenantId,
      userRole,
      isSuperAdmin,
    );

    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(SupabaseAuthGuard, TenantGuard)
  @Post('ticket')
  async createTicket(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const userId = req.user.id;
    const tenantId = req.tenantId;
    const userEmail = req.user.email;
    const userName = req.user.name || req.user.user_metadata?.name || userEmail || 'Workspace Member';
    const ip = getClientIp(req);
    const identifier = `support_${userId}_${ip}`;

    const rateLimit = await checkRateLimit(identifier, SUPPORT_RATE_LIMIT);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetTime - Date.now()) / 1000,
      );
      res.header('Retry-After', retryAfterSeconds.toString());
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many support tickets submitted. Please try again later.',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      const fastifyReq = req;
      const isMultipart = typeof fastifyReq.isMultipart === 'function' && fastifyReq.isMultipart();

      let subject = '';
      let category = '';
      let priority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
      let description = '';
      let diagnosticsStr = '';
      const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];
      let totalSize = 0;

      if (isMultipart) {
        const parts = fastifyReq.parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (attachments.length >= MAX_ATTACHMENTS_COUNT) {
              throw new BadRequestException(
                `Maximum of ${MAX_ATTACHMENTS_COUNT} attachments allowed per ticket`,
              );
            }

            const ext = path.extname(part.filename || '').toLowerCase();
            if (!ALLOWED_EXTENSIONS.has(ext)) {
              throw new BadRequestException(
                `File type '${ext || 'unknown'}' is not permitted. Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
              );
            }

            const buffer = await part.toBuffer();
            if (buffer.length > MAX_INDIVIDUAL_FILE_SIZE) {
              throw new BadRequestException(
                `File '${part.filename}' exceeds the 50MB size limit`,
              );
            }

            totalSize += buffer.length;
            if (totalSize > MAX_TOTAL_ATTACHMENTS_SIZE) {
              throw new BadRequestException(
                'Total attachments size exceeds the 100MB limit',
              );
            }

            const sanitizedFilename = path
              .basename(part.filename || 'attachment')
              .replace(/[^a-zA-Z0-9._-]/g, '_');

            attachments.push({
              filename: sanitizedFilename,
              content: buffer,
              contentType: part.mimetype || 'application/octet-stream',
            });
          } else {
            if (part.fieldname === 'subject') subject = String(part.value || '').trim();
            if (part.fieldname === 'category') category = String(part.value || '').trim();
            if (part.fieldname === 'priority') priority = String(part.value || 'Medium').trim() as any;
            if (part.fieldname === 'description') description = String(part.value || '').trim();
            if (part.fieldname === 'diagnostics') diagnosticsStr = String(part.value || '').trim();
          }
        }
      }

      // Check body fields as fallback (for JSON requests or pre-parsed body)
      const body = req.body || {};
      if (!subject && body.subject) subject = String(body.subject).trim();
      if (!category && body.category) category = String(body.category).trim();
      if (!priority && body.priority) priority = String(body.priority).trim() as any;
      if (!description && body.description) description = String(body.description).trim();
      if (!diagnosticsStr && body.diagnostics) {
        diagnosticsStr = typeof body.diagnostics === 'string' ? body.diagnostics : JSON.stringify(body.diagnostics);
      }

      if (!subject || !description) {
        throw new BadRequestException('Subject and description are required');
      }

      let diagnostics: any = {};
      if (diagnosticsStr) {
        try {
          diagnostics = JSON.parse(diagnosticsStr);
        } catch {
          diagnostics = {};
        }
      }

      diagnostics.email = userEmail;
      diagnostics.userId = userId;
      diagnostics.tenantId = tenantId;
      diagnostics.currentUserName = userName;

      await incrementRateLimit(identifier, SUPPORT_RATE_LIMIT);

      const data = await this.supportService.sendSupportTicket(
        subject,
        category || 'General',
        priority || 'Medium',
        description,
        diagnostics,
        attachments,
        { userId, tenantId, userEmail, userName },
      );

      return {
        success: true,
        ticketId: data.ticketId,
        estimatedResponseTime: data.estimatedResponseTime,
        ticket: data.ticket,
      };
    } catch (error: any) {
      this.logger.error(`Error processing support ticket: ${error?.message || error}`, error?.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { success: false, error: error.message || 'Failed to process ticket' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
