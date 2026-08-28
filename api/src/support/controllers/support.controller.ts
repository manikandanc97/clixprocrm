import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupportService } from '../services/support.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
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
]);

const MAX_INDIVIDUAL_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TOTAL_ATTACHMENTS_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ATTACHMENTS_COUNT = 10;

const SUPPORT_RATE_LIMIT = { maxRequests: 20, windowMs: 10 * 60 * 1000 }; // 20 requests per 10 mins

@Controller('support')
export class SupportController {
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

  @UseGuards(SupabaseAuthGuard)
  @Get('tickets')
  async getTickets(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const email = req.user?.email;
    const tickets = await this.supportService.getUserTickets(userId, email);
    return {
      success: true,
      data: tickets,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('tickets/:id')
  async getTicketById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const ticket = await this.supportService.getTicketById(id, userId);
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    return {
      success: true,
      data: ticket,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('tickets/:id/reply')
  async replyTicket(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Req() req: any,
  ) {
    if (!body?.message || !body.message.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const userName = req.user?.name || req.user?.email || 'Customer';
    const updatedTicket = await this.supportService.addReplyToTicket(
      id,
      userId,
      userName,
      body.message,
    );
    if (!updatedTicket) {
      throw new NotFoundException('Support ticket not found');
    }
    return {
      success: true,
      data: updatedTicket,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('ticket')
  async createTicket(@Req() req: any, @Res() res: any) {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
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
      if (!fastifyReq.isMultipart()) {
        throw new BadRequestException('Request must be multipart/form-data');
      }

      let subject = '';
      let category = '';
      let priority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
      let description = '';
      let diagnosticsStr = '';
      const attachments: { filename: string; content: Buffer }[] = [];
      let totalSize = 0;

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
              `File '${part.filename}' exceeds the 20MB size limit`,
            );
          }

          totalSize += buffer.length;
          if (totalSize > MAX_TOTAL_ATTACHMENTS_SIZE) {
            throw new BadRequestException(
              'Total attachments size exceeds the 50MB limit',
            );
          }

          const sanitizedFilename = path
            .basename(part.filename || 'attachment')
            .replace(/[^a-zA-Z0-9._-]/g, '_');

          attachments.push({ filename: sanitizedFilename, content: buffer });
        } else {
          if (part.fieldname === 'subject') subject = String(part.value || '').trim();
          if (part.fieldname === 'category') category = String(part.value || '').trim();
          if (part.fieldname === 'priority') priority = String(part.value || 'Medium').trim() as any;
          if (part.fieldname === 'description') description = String(part.value || '').trim();
          if (part.fieldname === 'diagnostics') diagnosticsStr = String(part.value || '').trim();
        }
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

      // Attach authenticated user identity to diagnostics
      diagnostics.email = req.user?.email || diagnostics.email;
      diagnostics.userId = userId;

      await incrementRateLimit(identifier, SUPPORT_RATE_LIMIT);

      const data = await this.supportService.sendSupportTicket(
        subject,
        category || 'General',
        priority || 'Medium',
        description,
        diagnostics,
        attachments,
      );

      return res.status(200).send({
        success: true,
        ticketId: data.ticketId,
        estimatedResponseTime: data.estimatedResponseTime,
        ticket: data.ticket,
      });
    } catch (error: any) {
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
