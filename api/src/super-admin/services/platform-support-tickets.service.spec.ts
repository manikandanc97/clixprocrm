import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSupportTicketsService } from './platform-support-tickets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { SupportTicketStatus } from '@prisma/client';

describe('PlatformSupportTicketsService (Super Admin Operations)', () => {
  let service: PlatformSupportTicketsService;
  let mockPrisma: any;
  let mockNotifications: any;

  const mockTicket = {
    id: 'ticket-101',
    ticketNumber: 'CP-SUP-2026-999999',
    tenantId: 'tenant-beta',
    createdById: 'user-bob',
    assignedToId: null,
    subject: 'SSO configuration issue',
    category: 'Security',
    priority: 'HIGH',
    status: 'OPEN',
    description: 'SAML metadata certificate expired',
    diagnostics: {},
    resolvedAt: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: { id: 'tenant-beta', name: 'Beta Corp', slug: 'beta', plan: 'enterprise' },
    createdBy: { id: 'user-bob', name: 'Bob', email: 'bob@beta.com' },
    assignedTo: null,
    attachments: [],
    messages: [],
    _count: { messages: 1 },
  };

  beforeEach(async () => {
    mockPrisma = {
      withTenantContext: jest.fn(async (opts, cb) => {
        expect(opts.isSuperAdmin).toBe(true);
        const tx = {
          supportTicket: {
            findMany: jest.fn().mockResolvedValue([mockTicket]),
            count: jest.fn().mockResolvedValue(1),
            findFirst: jest.fn().mockResolvedValue(mockTicket),
            update: jest.fn().mockImplementation((args) => {
              return Promise.resolve({ ...mockTicket, ...args.data });
            }),
          },
          supportTicketMessage: {
            create: jest.fn().mockResolvedValue({ id: 'msg-staff-1' }),
          },
          user: {
            findMany: jest.fn().mockResolvedValue([{ id: 'sa-1' }]),
          },
        };
        return cb(tx);
      }),
      createSealedAuditLog: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    mockNotifications = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformSupportTicketsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<PlatformSupportTicketsService>(PlatformSupportTicketsService);
  });

  it('1. Lists tickets across all tenants with platform Super Admin context', async () => {
    const result = await service.listTickets({ status: 'ALL', priority: 'ALL' });
    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].tenant.name).toBe('Beta Corp');
  });

  it('2. Super Admin public reply notifies ticket creator and creates sealed audit log', async () => {
    await service.addReplyOrNote('ticket-101', 'sa-1', 'We have updated the SAML certificate', false);

    expect(mockNotifications.createNotification).toHaveBeenCalledWith(
      'tenant-beta',
      'user-bob',
      expect.stringContaining('Support Replied'),
      expect.stringContaining('SAML certificate'),
      'support',
    );
    expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUPPORT_TICKET_REPLIED',
        userId: 'sa-1',
        targetUserId: 'user-bob',
      }),
    );
  });

  it('3. Super Admin internal note does NOT notify ticket creator', async () => {
    mockNotifications.createNotification.mockClear();

    await service.addReplyOrNote('ticket-101', 'sa-1', 'Internal: Check Okta connector logs', true);

    expect(mockNotifications.createNotification).not.toHaveBeenCalled();
    expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUPPORT_INTERNAL_NOTE_ADDED',
      }),
    );
  });

  it('4. Super Admin status update transitions to RESOLVED and records sealed audit log', async () => {
    await service.updateTicketStatus('ticket-101', 'sa-1', SupportTicketStatus.RESOLVED);

    expect(mockNotifications.createNotification).toHaveBeenCalledWith(
      'tenant-beta',
      'user-bob',
      expect.stringContaining('Status: RESOLVED'),
      expect.any(String),
      'support',
    );
    expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUPPORT_TICKET_STATUS_CHANGED',
      }),
    );
  });

  it('5. Super Admin assignment notifies assigned user', async () => {
    await service.assignTicket('ticket-101', 'sa-1', 'agent-jack');

    expect(mockNotifications.createNotification).toHaveBeenCalledWith(
      'tenant-beta',
      'agent-jack',
      expect.stringContaining('Assigned'),
      expect.any(String),
      'support',
    );
    expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SUPPORT_TICKET_ASSIGNED',
      }),
    );
  });
});
