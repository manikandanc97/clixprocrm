import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PlatformUsersService } from '../super-admin/services/platform-users.service';
import { EmployeesService } from '../admin/services/employees.service';
import { AuthService } from './auth.service';

describe('Single Super Admin Architectural Invariant & Safeguards Suite', () => {
  let mockPrisma: any;
  let platformUsersService: PlatformUsersService;
  let employeesService: EmployeesService;
  let authService: AuthService;
  let mockConfigService: any;
  let mockBrandingService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      tenantUser: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      createSealedAuditLog: jest.fn().mockResolvedValue({ id: 'sealed-audit-1' }),
      withTenantContext: jest.fn().mockImplementation((opts, callback) => {
        return callback(mockPrisma);
      }),
      $transaction: jest.fn().mockImplementation((callback) => {
        return callback(mockPrisma);
      }),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('mock-val'),
    };

    mockBrandingService = {
      processAndUploadAvatar: jest.fn(),
      processAndUploadLogo: jest.fn(),
    };

    platformUsersService = new PlatformUsersService(mockPrisma as any);
    employeesService = new EmployeesService(mockPrisma as any, mockConfigService as any);
    authService = new AuthService(mockPrisma as any, mockBrandingService as any);
  });

  describe('1. Platform Super Admin Transfer of Ownership (Atomic Flow)', () => {
    it('should REJECT transfer if caller is NOT the active Super Admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-regular',
        isSuperAdmin: false,
        status: 'ACTIVE',
      });

      await expect(
        platformUsersService.transferSuperAdmin('target-1', 'user-regular'),
      ).rejects.toThrow(
        new ForbiddenException('Only the current active Super Admin can transfer platform ownership.'),
      );
    });

    it('should REJECT transfer if target user is already the current Super Admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'super-admin-1',
        isSuperAdmin: true,
        status: 'ACTIVE',
      });

      await expect(
        platformUsersService.transferSuperAdmin('super-admin-1', 'super-admin-1'),
      ).rejects.toThrow(
        new BadRequestException('Target user is already the current Super Admin.'),
      );
    });

    it('should REJECT transfer if target user does not exist', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'super-admin-1', isSuperAdmin: true, status: 'ACTIVE' })
        .mockResolvedValueOnce(null);

      await expect(
        platformUsersService.transferSuperAdmin('missing-target', 'super-admin-1'),
      ).rejects.toThrow(new NotFoundException('Target user not found.'));
    });

    it('should REJECT transfer if target user is INACTIVE or SUSPENDED', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'super-admin-1', isSuperAdmin: true, status: 'ACTIVE' })
        .mockResolvedValueOnce({ id: 'target-suspended', isSuperAdmin: false, status: 'SUSPENDED' });

      await expect(
        platformUsersService.transferSuperAdmin('target-suspended', 'super-admin-1'),
      ).rejects.toThrow(
        new BadRequestException('Target user account must be ACTIVE to receive Super Admin ownership.'),
      );
    });

    it('should ATOMICALLY transfer Super Admin ownership in a single database transaction', async () => {
      const currentAdmin = {
        id: 'old-super-admin',
        email: 'oldadmin@platform.com',
        isSuperAdmin: true,
        status: 'ACTIVE',
      };
      const targetUser = {
        id: 'new-super-admin',
        email: 'newadmin@platform.com',
        name: 'New Admin',
        isSuperAdmin: false,
        status: 'ACTIVE',
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(currentAdmin)
        .mockResolvedValueOnce(targetUser);

      mockPrisma.user.update
        .mockResolvedValueOnce({ ...currentAdmin, isSuperAdmin: false })
        .mockResolvedValueOnce({ ...targetUser, isSuperAdmin: true });

      const res = await platformUsersService.transferSuperAdmin(
        'new-super-admin',
        'old-super-admin',
        { ip: '192.168.1.1', userAgent: 'Jest/Test' },
      );

      expect(res.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify old admin demoted and new admin promoted in the transaction
      expect(mockPrisma.user.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { id: 'old-super-admin' },
          data: { isSuperAdmin: false },
        }),
      );
      expect(mockPrisma.user.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { id: 'new-super-admin' },
          data: { isSuperAdmin: true },
        }),
      );

      // Verify sealed audit log
      expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'old-super-admin',
          targetUserId: 'new-super-admin',
          action: 'SUPER_ADMIN_TRANSFERRED',
          details: expect.objectContaining({
            previousSuperAdminId: 'old-super-admin',
            newSuperAdminId: 'new-super-admin',
          }),
        }),
        expect.anything(),
      );
    });
  });

  describe('2. Sole Super Admin Protection Safeguards', () => {
    it('should REJECT deactivating or suspending the sole Super Admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'super-admin-1',
        isSuperAdmin: true,
        status: 'ACTIVE',
      });

      await expect(
        platformUsersService.updateUserStatus('super-admin-1', 'SUSPENDED', 'super-admin-1'),
      ).rejects.toThrow(
        new ForbiddenException(
          'Cannot deactivate or suspend the sole active Super Admin. Transfer platform ownership first.',
        ),
      );
    });

    it('should REJECT direct demotion of the Super Admin', async () => {
      await expect(
        platformUsersService.toggleSuperAdmin('super-admin-1', false, 'super-admin-1'),
      ).rejects.toThrow(
        new BadRequestException(
          'Direct demotion of the platform Super Admin is prohibited. The platform must always have exactly ONE active Super Admin. Transfer platform ownership to another active user instead.',
        ),
      );
    });

    it('should REJECT tenant employee deletion when target is the platform Super Admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'super-admin-1',
        isSuperAdmin: true,
      });

      await expect(
        employeesService.deleteEmployee('tenant-1', 'super-admin-1', 'ADMIN'),
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Cannot delete the Platform Super Admin from workspace employee management.',
        }),
      );
    });

    it('should REJECT creating an employee with SUPER_ADMIN role inside an organization', async () => {
      await expect(
        employeesService.inviteEmployee('tenant-1', 'user@test.com', 'SUPER_ADMIN'),
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'SUPER_ADMIN is a platform-level role and cannot be created inside an organization.',
        }),
      );
    });

    it('should REJECT deleting account when user is the platform Super Admin', async () => {
      mockPrisma.tenantUser.findUnique.mockResolvedValueOnce({
        id: 'membership-1',
        role: { name: 'ADMIN' },
        tenant: { name: 'My Company', slug: 'my-company' },
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'super-admin-1',
        isSuperAdmin: true,
      });

      await expect(
        authService.deleteAccount('super-admin-1', 'tenant-1', {
          confirm1: 'my company',
          confirm2: 'delete my account',
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'The Platform Super Admin account cannot be deleted through tenant account deletion.',
        ),
      );
    });

    it('should REJECT Super Admin deleting the platform Super Admin account via platformUsersService', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'super-admin-1',
        isSuperAdmin: true,
        name: 'Root Admin',
        email: 'root@clixpro.com',
      });

      await expect(
        platformUsersService.deleteUser('super-admin-1', 'super-admin-2'),
      ).rejects.toThrow(
        new ForbiddenException(
          'Cannot delete the active Platform Super Admin. Transfer platform ownership to another user first.',
        ),
      );
    });

    it('should REJECT Super Admin deleting their own logged-in account', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'super-admin-1',
        isSuperAdmin: false,
        name: 'Root Admin',
        email: 'root@clixpro.com',
      });

      await expect(
        platformUsersService.deleteUser('super-admin-1', 'super-admin-1'),
      ).rejects.toThrow(
        new ForbiddenException(
          'Cannot delete your own account while logged in as Super Admin.',
        ),
      );
    });

    it('should successfully delete a standard user and record sealed audit log', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-to-delete',
        isSuperAdmin: false,
        name: 'Regular User',
        email: 'regular@example.com',
      });

      mockPrisma.tenantUser.findMany = jest.fn().mockResolvedValueOnce([]);
      mockPrisma.userSession = { deleteMany: jest.fn() };
      mockPrisma.mfaRecoveryCode = { deleteMany: jest.fn() };
      mockPrisma.teamMember = { deleteMany: jest.fn() };
      mockPrisma.team = { updateMany: jest.fn() };
      mockPrisma.recordShare = { deleteMany: jest.fn() };
      mockPrisma.aiMessage = { deleteMany: jest.fn() };
      mockPrisma.aiConversation = { deleteMany: jest.fn() };
      mockPrisma.customer = { updateMany: jest.fn() };
      mockPrisma.lead = { updateMany: jest.fn() };
      mockPrisma.task = { updateMany: jest.fn() };
      mockPrisma.meeting = { updateMany: jest.fn() };
      mockPrisma.deal = { updateMany: jest.fn() };
      mockPrisma.company = { updateMany: jest.fn() };
      mockPrisma.quotation = { updateMany: jest.fn() };
      mockPrisma.invoice = { updateMany: jest.fn() };
      mockPrisma.payment = { updateMany: jest.fn() };
      mockPrisma.timelineEvent = { updateMany: jest.fn() };
      mockPrisma.note = { deleteMany: jest.fn() };
      mockPrisma.attachment = { deleteMany: jest.fn() };
      mockPrisma.notification = { deleteMany: jest.fn() };
      mockPrisma.auditLog.updateMany = jest.fn();

      const result = await platformUsersService.deleteUser('user-to-delete', 'super-admin-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('permanently deleted');
      expect(mockPrisma.createSealedAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'super-admin-1',
          action: 'USER_DELETED',
          module: 'SuperAdmin',
          details: expect.objectContaining({
            deletedUserId: 'user-to-delete',
            deletedUserEmail: 'regular@example.com',
          }),
        }),
        expect.anything(),
      );
    });
  });
});
