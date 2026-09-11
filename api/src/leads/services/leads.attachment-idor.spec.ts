import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { LeadsQueryService } from './leads.query.service';
import { LeadsConvertService } from './leads.convert.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { NotFoundException } from '@nestjs/common';

describe('LeadsService Security - Attachment IDOR & Cross-Tenant Access Prevention', () => {
  let service: LeadsService;
  let prismaMock: any;
  let encryptionMock: any;

  beforeEach(async () => {
    prismaMock = {
      lead: {
        findUnique: jest.fn(),
      },
      attachment: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      note: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      timelineEvent: {
        create: jest.fn(),
      },
      withTenantContext: jest
        .fn()
        .mockImplementation((ctx, cb) => cb(prismaMock)),
    };

    encryptionMock = {
      encrypt: jest.fn((val) => val),
      decrypt: jest.fn((val) => val),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LeadsQueryService, useValue: {} },
        { provide: LeadsConvertService, useValue: {} },
        { provide: EncryptionService, useValue: encryptionMock },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    jest.clearAllMocks();
  });

  it('P2: REJECTS attachment creation if leadId belongs to a different tenant (Cross-Tenant IDOR)', async () => {
    // Tenant B tries to attach file to lead-1 owned by Tenant A
    prismaMock.lead.findUnique.mockResolvedValue(null);

    await expect(
      service.createLeadAttachment(
        'tenant-b',
        'lead-owned-by-tenant-a',
        'user-1',
        {
          fileName: 'confidential.pdf',
          fileUrl: 'https://cdn.example.com/confidential.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        },
      ),
    ).rejects.toThrow(NotFoundException);

    // Verify ownership query strictly scoped by tenantId
    expect(prismaMock.lead.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'lead-owned-by-tenant-a',
        tenantId: 'tenant-b',
        deletedAt: null,
      },
      select: { id: true },
    });

    // Verify attachment creation is NEVER executed
    expect(prismaMock.attachment.create).not.toHaveBeenCalled();
  });

  it('P2: ALLOWS attachment creation when leadId belongs to authenticated tenant', async () => {
    prismaMock.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
    prismaMock.attachment.create.mockResolvedValue({
      id: 'att-1',
      fileName: 'invoice.pdf',
      fileUrl: 'https://cdn.example.com/invoice.pdf',
      fileSize: 2048,
      fileType: 'application/pdf',
    });

    const result = await service.createLeadAttachment(
      'tenant-a',
      'lead-1',
      'user-1',
      {
        fileName: 'invoice.pdf',
        fileUrl: 'https://cdn.example.com/invoice.pdf',
        fileSize: 2048,
        fileType: 'application/pdf',
      },
    );

    expect(prismaMock.lead.findUnique).toHaveBeenCalledWith({
      where: { id: 'lead-1', tenantId: 'tenant-a', deletedAt: null },
      select: { id: true },
    });
    expect(prismaMock.attachment.create).toHaveBeenCalled();
    expect(result.id).toBe('att-1');
  });

  it('P2: REJECTS note creation if leadId belongs to a different tenant', async () => {
    prismaMock.lead.findUnique.mockResolvedValue(null);

    await expect(
      service.createLeadNote('tenant-b', 'lead-owned-by-tenant-a', 'user-1', {
        content: 'Secret notes',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.note.create).not.toHaveBeenCalled();
  });
});
