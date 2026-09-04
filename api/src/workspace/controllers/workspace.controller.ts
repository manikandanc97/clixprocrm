import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceService } from '../services/workspace.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('crm/workspace')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'SALES', 'SUPPORT', 'EMPLOYEE', 'USER')
  async getWorkspace(@Req() req: any) {
    const data = await this.workspaceService.getWorkspace(req.tenantId);
    return { success: true, data };
  }

  @Patch()
  @Roles('ADMIN')
  async updateWorkspace(@Req() req: any, @Body() data: any) {
    const updated = await this.workspaceService.updateWorkspace(
      req.tenantId,
      data,
    );
    return { success: true, data: updated };
  }

  @Post('logo')
  @Roles('ADMIN')
  async uploadLogo(@Req() req: any, @Body() body: any) {
    let fileBuffer: Buffer | null = null;
    let filename = 'logo.png';

    // 1. Check if sent as base64 in body (JSON)
    if (body?.fileData) {
      const base64Data = body.fileData.includes(';base64,')
        ? body.fileData.split(';base64,')[1]
        : body.fileData;
      fileBuffer = Buffer.from(base64Data, 'base64');
      filename = body.fileName || filename;
    }

    // 2. Check if multipart/form-data
    if (!fileBuffer && typeof req.isMultipart === 'function' && req.isMultipart()) {
      try {
        const file = await req.file();
        if (file) {
          fileBuffer = await file.toBuffer();
          filename = file.filename || filename;
        }
      } catch (err: any) {
        throw new BadRequestException(
          `Failed to read multipart upload: ${err?.message || err}`,
        );
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('No image file was provided');
    }

    const result = await this.workspaceService.uploadWorkspaceLogo(
      req.tenantId,
      fileBuffer,
      filename,
      req.user?.sub || req.user?.id,
    );

    return { success: true, data: result };
  }
}
