import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { ConvertLeadDto } from '../dto/convert-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { LeadsQueryService } from './leads.query.service';
import { LeadsConvertService } from './leads.convert.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { StorageService } from '../../common/services/storage.service';

/**
 * @file leads/services/leads.service.ts
 * Leads core CRUD service.
 * Query & formatting logic is in leads.query.service.ts.
 * Conversion logic is in leads.convert.service.ts.
 *
 * ENCRYPTION: Lead.name, Lead.email, Lead.phone, Lead.company are AES-256-GCM encrypted.
 *             Lead.emailHash is an HMAC-SHA256 deterministic hash for exact-match lookups.
 *             Note.message is AES-256-GCM encrypted.
 *             Decryption happens transparently on every read path.
 */

/** Fields encrypted on Lead records. */
const LEAD_ENCRYPTED_FIELDS = ['name', 'email', 'phone', 'company'] as const;
/** Fields encrypted on Note records. */
const NOTE_ENCRYPTED_FIELDS = ['message'] as const;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsQueryService: LeadsQueryService,
    private readonly leadsConvertService: LeadsConvertService,
    private readonly enc: EncryptionService,
    @Optional() private readonly storageService?: StorageService,
  ) {}

  // ─── Query Delegation ───────────────────────────────────────────────────────

  async getLeads(
    tenantId: string,
    query: PaginationQueryDto & { stage?: string; status?: string },
  ) {
    return this.leadsQueryService.getLeads(tenantId, query);
  }

  async getHotLeads(tenantId: string) {
    return this.leadsQueryService.getHotLeads(tenantId);
  }

  // ─── Conversion Delegation ──────────────────────────────────────────────────

  async convertLead(
    tenantId: string,
    userId: string,
    leadId: string,
    data: ConvertLeadDto,
  ) {
    return this.leadsConvertService.convertLead(tenantId, userId, leadId, data);
  }

  // ─── Core CRUD Operations ───────────────────────────────────────────────────

  async createLead(tenantId: string, userId: string, data: CreateLeadDto) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      if (data.assignedToId && data.assignedToId !== userId) {
        const isValidAssignee = await tx.tenantUser.findFirst({
          where: { userId: data.assignedToId, tenantId, status: 'ACTIVE' },
        });
        if (!isValidAssignee) {
          throw new BadRequestException(
            'Invalid assignment: User does not belong to this workspace or is inactive.',
          );
        }
      }

      const isWon = data.stage === 'WON';
      let companyId = null;
      const companyName = data.company ? data.company.trim() : null;

      if (companyName) {
        // Use nameHash for exact-match lookup on encrypted company name
        const companyNameHash = this.enc.hash(companyName);
        let company = await tx.company.findFirst({
          where: { tenantId, nameHash: companyNameHash, deletedAt: null },
        });
        if (!company) {
          const { encrypted: encName, hash: nameHash } =
            this.enc.encryptWithHash(companyName);
          company = await tx.company.create({
            data: {
              tenantId,
              name: encName!,
              nameHash,
              ownerId: userId,
              status: 'ACTIVE',
            },
          });
        }
        companyId = company.id;
      }

      const { encrypted: encEmail, hash: emailHash } =
        this.enc.encryptWithHash(data.email);

      const lead = await tx.lead.create({
        data: {
          tenantId,
          name: this.enc.encrypt(data.name)!,
          company: this.enc.encrypt(companyName || 'Unknown Company')!,
          companyId,
          email: encEmail!,
          emailHash,
          phone: this.enc.encrypt(data.phone),
          source: data.source || 'Direct',
          stage: data.stage || 'NEW',
          priority: data.priority || 'MEDIUM',
          value: data.valueAmount || data.value || 0,
          expectedCloseDate: data.expectedCloseDate
            ? new Date(data.expectedCloseDate)
            : null,
          tags: data.tags || [],
          assignedToId: data.assignedToId || userId,
          createdById: userId,
          isConverted: isWon,
          convertedAt: isWon ? new Date() : null,
        },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          leadId: lead.id,
          action: 'Lead Created',
          description: `Created lead for ${companyName || 'Unknown Company'}`,
          userId,
        },
      });

      // Return decrypted lead for immediate API response
      return this.decryptLead(lead);
    });
  }

  async getLeadById(tenantId: string, leadId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId, tenantId, deletedAt: null },
        include: {
          companyRecord: true,
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              notes: true,
              meetings: true,
              attachments: true,
              timelineEvents: true,
            },
          },
        },
      });
      if (!lead) throw new NotFoundException('Lead not found');
      return this.decryptLead(lead);
    });
  }

  async updateLead(
    tenantId: string,
    userId: string,
    id: string,
    data: UpdateLeadDto,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existingLead = await tx.lead.findUnique({
        where: { id, tenantId },
        select: {
          id: true,
          stage: true,
          name: true,
          company: true,
          email: true,
          emailHash: true,
          phone: true,
          assignedToId: true,
          customerId: true,
          isConverted: true,
          value: true,
        },
      });
      if (!existingLead) throw new NotFoundException('Lead not found');

      const targetStage = data.stage || existingLead.stage;
      const isWon = targetStage === 'WON';
      const wasWon = existingLead.stage === 'WON';
      const stageChanged = data.stage && existingLead.stage !== data.stage;
      let finalCompanyId = undefined;
      let finalCompanyName = undefined;

      // Decrypt existing for comparison
      const existingCompanyPlain = this.enc.decrypt(existingLead.company);

      if (
        data.company !== undefined &&
        data.company !== existingCompanyPlain
      ) {
        finalCompanyName = data.company.trim();
        if (finalCompanyName) {
          const companyNameHash = this.enc.hash(finalCompanyName);
          let company = await tx.company.findFirst({
            where: { tenantId, nameHash: companyNameHash, deletedAt: null },
          });
          if (!company) {
            const { encrypted: encName, hash: nameHash } =
              this.enc.encryptWithHash(finalCompanyName);
            company = await tx.company.create({
              data: {
                tenantId,
                name: encName!,
                nameHash,
                ownerId: userId,
                status: 'ACTIVE',
              },
            });
          }
          finalCompanyId = company.id;
        } else {
          finalCompanyId = null;
          finalCompanyName = 'Unknown Company';
        }
      }

      if (
        data.assignedToId &&
        data.assignedToId !== existingLead.assignedToId &&
        data.assignedToId !== userId
      ) {
        const isValidAssignee = await tx.tenantUser.findFirst({
          where: { userId: data.assignedToId, tenantId, status: 'ACTIVE' },
        });
        if (!isValidAssignee) {
          throw new BadRequestException(
            'Invalid assignment: User does not belong to this workspace or is inactive.',
          );
        }
      }

      let customerId = existingLead.customerId;
      if (isWon && !wasWon && !customerId) {
        const encName = this.enc.encrypt(
          data.name || this.enc.decrypt(existingLead.name) || '',
        );
        const encEmail = this.enc.encrypt(
          data.email || this.enc.decrypt(existingLead.email) || '',
        );
        const emailHash = this.enc.hash(
          data.email || this.enc.decrypt(existingLead.email) || '',
        );
        const encCompany = this.enc.encrypt(
          finalCompanyName || existingCompanyPlain || '',
        );
        const customer = await tx.customer.create({
          data: {
            tenantId,
            name: encName!,
            email: encEmail,
            emailHash,
            company: encCompany!,
            companyId: finalCompanyId,
            status: 'ACTIVE',
          },
        });
        customerId = customer.id;
      }

      // Build encrypted update payload
      const updateData: any = {};
      if (data.name) updateData.name = this.enc.encrypt(data.name);
      if (finalCompanyName !== undefined)
        updateData.company = this.enc.encrypt(finalCompanyName);
      if (finalCompanyId !== undefined) updateData.companyId = finalCompanyId;
      if (data.email) {
        const { encrypted, hash } = this.enc.encryptWithHash(data.email);
        updateData.email = encrypted;
        updateData.emailHash = hash;
      }
      if (data.phone !== undefined)
        updateData.phone = this.enc.encrypt(data.phone);
      if (data.source) updateData.source = data.source;
      if (data.value !== undefined) updateData.value = data.value;
      if (data.valueAmount !== undefined && data.value === undefined)
        updateData.value = data.valueAmount;
      if (data.stage) updateData.stage = data.stage;
      if (data.priority) updateData.priority = data.priority;
      if (data.expectedCloseDate !== undefined) {
        updateData.expectedCloseDate = data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : null;
      }
      if (data.tags) updateData.tags = data.tags;
      if (data.assignedToId) updateData.assignedToId = data.assignedToId;
      if (isWon && !wasWon) {
        updateData.isConverted = true;
        updateData.convertedAt = new Date();
        updateData.customerId = customerId;
      }
      updateData.updatedById = userId;
      updateData.lastActivityAt = new Date();

      const lead = await tx.lead.update({
        where: { id, tenantId },
        data: updateData,
      });

      if (stageChanged) {
        let description = `Moved from ${existingLead.stage} to ${data.stage}`;
        if (data.stage === 'WON') {
          description +=
            '. Revenue: ' +
            (data.actualRevenue || data.value || existingLead.value || 0) +
            '. Reason: ' +
            (data.wonReason || 'Not specified') +
            '. ' +
            (data.notes ? 'Notes: ' + data.notes : '');
        } else if (data.stage === 'LOST') {
          description +=
            '. Reason: ' +
            (data.lostReason || 'Not specified') +
            '. Competitor: ' +
            (data.competitor || 'None') +
            '. ' +
            (data.notes ? 'Notes: ' + data.notes : '');
        }

        await tx.timelineEvent.create({
          data: {
            tenantId,
            leadId: id,
            action: 'Stage Changed',
            description,
            userId,
          },
        });
      }
      return this.decryptLead(lead);
    });
  }

  async deleteLead(tenantId: string, userId: string, id: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existing = await tx.lead.findUnique({
        where: { id, tenantId },
        select: {
          id: true,
          stage: true,
          customerId: true,
          email: true,
          name: true,
          company: true,
        },
      });
      if (!existing) throw new NotFoundException('Lead not found');

      const lead = await tx.lead.update({
        where: { id, tenantId },
        data: {
          deletedAt: new Date(),
          updatedById: userId,
          lastActivityAt: new Date(),
        },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          leadId: id,
          action: 'Lead Deleted',
          description: `Lead was softly deleted`,
          userId,
        },
      });

      return lead;
    });
  }

  async getLeadAttachments(tenantId: string, leadId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      return tx.attachment.findMany({
        where: { tenantId, leadId },
        include: {
          user: { select: { name: true, email: true, id: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async createLeadAttachment(
    tenantId: string,
    leadId: string,
    userId: string,
    data: {
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
    },
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      const attachment = await tx.attachment.create({
        data: {
          tenantId,
          leadId,
          userId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          fileType: data.fileType,
        },
        include: {
          user: { select: { name: true, email: true, id: true } },
        },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          leadId,
          action: 'Attachment Added',
          description: `Uploaded ${data.fileName}`,
          userId,
        },
      });

      return attachment;
    });
  }

  async uploadAndCreateLeadAttachment(
    tenantId: string,
    leadId: string,
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType?: string,
  ) {
    if (!this.storageService) {
      throw new BadRequestException('Storage service is unavailable');
    }

    // 1. Upload to Supabase Storage bucket: crm-attachments/{tenantId}/leads/{leadId}/...
    const uploadResult = await this.storageService.uploadAttachment(
      tenantId,
      `leads/${leadId}`,
      fileBuffer,
      originalFilename,
      mimeType,
    );

    // 2. Persist database record with real Supabase Storage URL
    return this.createLeadAttachment(tenantId, leadId, userId, {
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.storageUrl,
      fileSize: uploadResult.fileSize,
      fileType: uploadResult.fileType,
    });
  }

  async deleteLeadAttachment(tenantId: string, leadId: string, attachmentId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const attachment = await tx.attachment.findUnique({
        where: { id: attachmentId, tenantId, leadId },
      });
      if (!attachment) {
        throw new NotFoundException('Attachment not found');
      }

      await tx.attachment.delete({
        where: { id: attachmentId },
      });

      return { success: true };
    });
  }

  async getLeadNotes(tenantId: string, leadId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      const notes = await tx.note.findMany({
        where: { tenantId, leadId },
        include: {
          user: { select: { name: true, email: true, id: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      // Decrypt Note.message on read
      return notes.map((n) => ({
        ...n,
        message: this.enc.decrypt(n.message),
      }));
    });
  }

  async createLeadNote(
    tenantId: string,
    leadId: string,
    userId: string,
    data: { content: string },
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!lead) {
        throw new NotFoundException('Lead not found');
      }

      const note = await tx.note.create({
        data: {
          tenantId,
          leadId,
          userId,
          message: this.enc.encrypt(data.content)!, // Encrypt Note.message
        },
        include: {
          user: { select: { name: true, email: true, id: true } },
        },
      });

      await tx.timelineEvent.create({
        data: {
          tenantId,
          leadId,
          action: 'Note Added',
          description: 'A new note was added',
          userId,
        },
      });

      // Return decrypted for API response
      return { ...note, message: this.enc.decrypt(note.message) };
    });
  }

  async getLeadTimeline(tenantId: string, leadId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.timelineEvent.findMany({
        where: { tenantId, leadId },
        include: {
          user: { select: { name: true, email: true, id: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async createTimelineEvent(
    tenantId: string,
    leadId: string,
    action: string,
    description: string,
    userId: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.timelineEvent.create({
        data: {
          tenantId,
          leadId,
          userId,
          action,
          description,
        },
      });
    });
  }

  async bulkDeleteLeads(tenantId: string, userId: string, ids: string[]) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const leads = await tx.lead.updateMany({
        where: { id: { in: ids }, tenantId },
        data: {
          deletedAt: new Date(),
          updatedById: userId,
          lastActivityAt: new Date(),
        },
      });

      const timelineEvents = ids.map((id) => ({
        tenantId,
        leadId: id,
        action: 'Lead Deleted',
        description: 'Lead was softly deleted (Bulk)',
        userId,
      }));

      if (timelineEvents.length > 0) {
        await tx.timelineEvent.createMany({ data: timelineEvents });
      }

      return leads;
    });
  }


  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /** Decrypts all PII fields on a lead object in-place and returns it. */
  private decryptLead<T extends Record<string, any>>(lead: T): T {
    return this.enc.decryptFields(lead, LEAD_ENCRYPTED_FIELDS as any);
  }
}
