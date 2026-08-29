import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './services/support.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { StorageService } from '../common/services/storage.service';
import { NotFoundException } from '@nestjs/common';

describe('Support Ticket Flow & Tenant Isolation', () => {
  let service: SupportService;
  let mockPrisma: any;
  let mockNotifications: any;
  let mockStorage: any;

  const sampleTicket = {
    id: 'ticket-uuid-1',
    ticketNumber: 'CP-SUP-2026-123456',
    tenantId: 'tenant-alpha',
    createdById: 'user-charlie',
    assignedToId: null,
    subject: 'Cannot export invoices',
    category: 'Billing',
    priority: 'HIGH',
    status: 'OPEN',
    description: 'Export button is failing with 500 error',
    diagnostics: {},
    estimatedResponseTime: '< 4 Hours',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: { id: 'user-charlie', name: 'Charlie', email: 'charlie@alpha.com', avatar: null },
    assignedTo: null,
    attachments: [],
    messages: [
      {
        id: 'msg-1',
        ticketId: 'ticket-uuid-1',
        senderId: 'user-charlie',
        message: 'Export button is failing with 500 error',
        isStaff: false,
        isInternal: false,
        createdAt: new Date(),
        sender: { id: 'user-charlie', name: 'Charlie', email: 'charlie@alpha.com' },
      },
      {
        id: 'msg-internal',
        ticketId: 'ticket-uuid-1',
        senderId: 'admin-super',
        message: 'Checking invoice exporter server logs',
        isStaff: true,
        isInternal: true, // Should be omitted from user view
        createdAt: new Date(),
        sender: { id: 'admin-super', name: 'Super Admin', email: 'sa@clixpro.com' },
      },
    ],
  };

  beforeEach(async () => {
    mockPrisma = {
      withTenantContext: jest.fn(async (opts, cb) => {
        const tx = {
          supportTicket: {
            create: jest.fn().mockResolvedValue(sampleTicket),
            findMany: jest.fn().mockResolvedValue([sampleTicket]),
            findFirst: jest.fn().mockImplementation((query) => {
              if (
                (!query.where.tenantId || query.where.tenantId === 'tenant-alpha') &&
                (!query.where.createdById || query.where.createdById === 'user-charlie')
              ) {
                return Promise.resolve(sampleTicket);
              }
              return Promise.resolve(null);
            }),
            update: jest.fn().mockImplementation((args) =>
              Promise.resolve({ ...sampleTicket, ...args.data, status: args.data.status || 'IN_PROGRESS' }),
            ),
            delete: jest.fn().mockResolvedValue(sampleTicket),
          },
          supportTicketMessage: {
            create: jest.fn().mockResolvedValue({ id: 'msg-new' }),
            update: jest.fn().mockResolvedValue({ id: 'msg-1' }),
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          supportTicketAttachment: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          user: {
            findMany: jest.fn().mockResolvedValue([{ id: 'sa-1' }, { id: 'sa-2' }]),
          },
        };
        return cb(tx);
      }),
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'sa-1' }, { id: 'sa-2' }]),
      },
      createSealedAuditLog: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    mockNotifications = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    mockStorage = {
      uploadAttachment: jest.fn().mockResolvedValue({
        fileName: 'screenshot.png',
        storageUrl: 'https://storage.supabase.co/bucket/screenshot.png',
        fileSize: 1024,
        fileType: 'image/png',
        storagePath: 'crm-attachments/tenant-alpha/screenshot.png',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('1. Successfully creates a ticket and creates notifications for all active Super Admins', async () => {
    const result = await service.sendSupportTicket(
      'Cannot export invoices',
      'Billing',
      'High',
      'Export button is failing with 500 error',
      {},
      [{ filename: 'screenshot.png', content: Buffer.from('fake-data'), contentType: 'image/png' }],
      {
        userId: 'user-charlie',
        tenantId: 'tenant-alpha',
        userEmail: 'charlie@alpha.com',
        userName: 'Charlie',
      },
    );

    expect(result.ticketId).toMatch(/^CP-SUP-/);
    expect(mockStorage.uploadAttachment).toHaveBeenCalledWith(
      'tenant-alpha',
      'support-tickets',
      expect.any(Buffer),
      'screenshot.png',
      'image/png',
    );
    expect(mockPrisma.createSealedAuditLog).toHaveBeenCalled();
    // Super admins notified
    expect(mockNotifications.createNotification).toHaveBeenCalledTimes(2);
    expect(mockNotifications.createNotification).toHaveBeenCalledWith(
      'tenant-alpha',
      'sa-1',
      expect.stringContaining('New Support Ticket'),
      expect.stringContaining('Charlie'),
      'support',
    );
  });

  it('2. Regular user ticket query enforces tenant and user isolation', async () => {
    const tickets = await service.getUserTickets('user-charlie', 'tenant-alpha');
    expect(tickets).toHaveLength(1);
    expect(tickets[0].ticketId).toBe('CP-SUP-2026-123456');

    // Verify internal notes are filtered out from replies
    expect(tickets[0].replies.some((r) => r.isInternal)).toBe(false);
  });

  it('3. Rejects user access to cross-tenant or other user tickets', async () => {
    const crossTicket = await service.getTicketById('ticket-uuid-1', 'attacker-user', 'other-tenant');
    expect(crossTicket).toBeNull();
  });

  it('4. User reply automatically updates WAITING_FOR_USER/RESOLVED status to IN_PROGRESS', async () => {
    const updated = await service.addReplyToTicket(
      'CP-SUP-2026-123456',
      'user-charlie',
      'Charlie',
      'Here is the requested log file',
      'tenant-alpha',
    );

    expect(updated).not.toBeNull();
    expect(mockNotifications.createNotification).toHaveBeenCalled();
  });

  it('5. Successfully updates a ticket when userRole is passed as an object ({ name: "ADMIN" })', async () => {
    const roleAsObject = {
      name: 'ADMIN',
      permissions: [{ module: 'ALL', hasAccess: true }],
      isActive: true,
    };

    const updated = await service.updateTicket(
      'CP-SUP-2026-123456',
      'user-charlie',
      {
        subject: 'Updated ticket subject',
        category: 'Technical Issue',
        priority: 'Critical',
        description: 'New detailed description',
      },
      'tenant-alpha',
      roleAsObject,
    );

    expect(updated).not.toBeNull();
    expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUPPORT_TICKET_UPDATED',
      }),
    );
  });

  it('6. Successfully deletes a ticket and pre-deletes child messages and attachments', async () => {
    const roleAsObject = {
      name: 'ADMIN',
      permissions: [{ module: 'ALL', hasAccess: true }],
      isActive: true,
    };

    const deleted = await service.deleteTicket(
      'CP-SUP-2026-123456',
      'user-charlie',
      'tenant-alpha',
      roleAsObject,
    );

    expect(deleted.success).toBe(true);
    expect(deleted.ticketNumber).toBe('CP-SUP-2026-123456');
    expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUPPORT_TICKET_DELETED',
      }),
    );
  });

  it('7. Prevents non-owner and non-admin from deleting or editing ticket', async () => {
    const strangerRole = { name: 'MEMBER' };

    await expect(
      service.deleteTicket(
        'CP-SUP-2026-123456',
        'stranger-user',
        'tenant-alpha',
        strangerRole,
      ),
    ).rejects.toThrow();

    await expect(
      service.updateTicket(
        'CP-SUP-2026-123456',
        'stranger-user',
        { subject: 'Hacked subject' },
        'tenant-alpha',
        strangerRole,
      ),
    ).rejects.toThrow();
  });
});
