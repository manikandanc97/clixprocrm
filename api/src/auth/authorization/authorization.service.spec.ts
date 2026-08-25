import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { AuthorizationCacheService } from './authorization-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserAuthContext, RecordAccessContext } from './authorization-types';

describe('Authorization Engine & Multi-Tenant Access Control (Enterprise Hierarchy)', () => {
  let authService: AuthorizationService;
  let cacheService: AuthorizationCacheService;
  let prismaService: any;

  const mockPrismaService = {
    withTenantContext: jest.fn(async ({ tenantId }, fn) => fn(mockPrismaService)),
    createSealedAuditLog: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
    tenantUser: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
    },
    recordShare: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        AuthorizationCacheService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    authService = module.get<AuthorizationService>(AuthorizationService);
    cacheService = module.get<AuthorizationCacheService>(AuthorizationCacheService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('1. Cross-Tenant Isolation Boundary', () => {
    it('ALLOWS access when user and record belong to the same tenant', async () => {
      const userContext: UserAuthContext = {
        userId: 'usr-1',
        tenantId: 'tenant-a',
        isOrgOwner: true,
      };

      const record: RecordAccessContext = {
        id: 'rec-1',
        tenantId: 'tenant-a',
      };

      const allowed = await authService.can(userContext, 'crm:leads:view', record);
      expect(allowed).toBe(true);
    });

    it('ALWAYS DENIES access when user tries to access a record from a different tenant (Cross-Tenant Attack)', async () => {
      const userContext: UserAuthContext = {
        userId: 'usr-1',
        tenantId: 'tenant-a',
        isOrgOwner: true,
      };

      const crossTenantRecord: RecordAccessContext = {
        id: 'rec-1',
        tenantId: 'tenant-b', // Different organization
      };

      const allowed = await authService.can(userContext, 'crm:leads:view', crossTenantRecord);
      expect(allowed).toBe(false);
    });

    it('Platform Super Admin can operate across tenants', async () => {
      const superAdminContext: UserAuthContext = {
        userId: 'super-admin-usr',
        isSuperAdmin: true,
      };

      const record: RecordAccessContext = {
        id: 'rec-1',
        tenantId: 'tenant-any',
      };

      const allowed = await authService.can(superAdminContext, 'crm:leads:view', record);
      expect(allowed).toBe(true);
    });
  });

  describe('2. Data Scope Evaluation (OWN, TEAM, SUBORDINATES, BRANCH, ORGANIZATION, SHARED)', () => {
    it('OWN scope: ALLOWS access to own record and DENIES access to other user record', async () => {
      const salesRepContext: UserAuthContext = {
        userId: 'rep-1',
        tenantId: 'tenant-a',
      };

      // Mock effective permissions returning OWN scope for crm:leads:view
      mockPrismaService.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-1',
        tenantId: 'tenant-a',
        userId: 'rep-1',
        isOrgOwner: false,
        status: 'ACTIVE',
        role: {
          name: 'Sales Rep',
          isActive: true,
          permissions: [
            { module: 'crm:leads:view', scope: 'OWN', hasAccess: true },
          ],
        },
      });

      const ownRecord: RecordAccessContext = {
        id: 'lead-own',
        tenantId: 'tenant-a',
        assignedToId: 'rep-1',
      };

      const otherRecord: RecordAccessContext = {
        id: 'lead-other',
        tenantId: 'tenant-a',
        assignedToId: 'rep-2',
      };

      expect(await authService.can(salesRepContext, 'crm:leads:view', ownRecord)).toBe(true);
      expect(await authService.can(salesRepContext, 'crm:leads:view', otherRecord)).toBe(false);
    });

    it('TEAM scope: ALLOWS access to records in user team and DENIES unrelated team records', async () => {
      const userContext: UserAuthContext = {
        userId: 'rep-1',
        tenantId: 'tenant-a',
      };

      mockPrismaService.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-1',
        tenantId: 'tenant-a',
        userId: 'rep-1',
        isOrgOwner: false,
        status: 'ACTIVE',
        role: {
          name: 'Team Member',
          isActive: true,
          permissions: [
            { module: 'crm:leads:view', scope: 'TEAM', hasAccess: true },
          ],
        },
      });

      mockPrismaService.teamMember.findMany.mockResolvedValue([{ teamId: 'team-alpha' }]);
      mockPrismaService.team.findMany.mockResolvedValue([]);

      const teamRecord: RecordAccessContext = {
        id: 'lead-team',
        tenantId: 'tenant-a',
        teamId: 'team-alpha',
        assignedToId: 'rep-2',
      };

      const unrelatedTeamRecord: RecordAccessContext = {
        id: 'lead-unrelated',
        tenantId: 'tenant-a',
        teamId: 'team-beta',
        assignedToId: 'rep-3',
      };

      expect(await authService.can(userContext, 'crm:leads:view', teamRecord)).toBe(true);
      expect(await authService.can(userContext, 'crm:leads:view', unrelatedTeamRecord)).toBe(false);
    });

    it('SUBORDINATES scope: ALLOWS manager to access subordinate records and DENIES peer records', async () => {
      const managerContext: UserAuthContext = {
        userId: 'mgr-1',
        tenantId: 'tenant-a',
      };

      mockPrismaService.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-mgr',
        tenantId: 'tenant-a',
        userId: 'mgr-1',
        isOrgOwner: false,
        status: 'ACTIVE',
        role: {
          name: 'Sales Manager',
          isActive: true,
          permissions: [
            { module: 'crm:deals:edit', scope: 'SUBORDINATES', hasAccess: true },
          ],
        },
      });

      // Hierarchy: mgr-1 -> sub-1
      mockPrismaService.tenantUser.findMany.mockResolvedValue([
        { id: 'tu-mgr', userId: 'mgr-1', reportingManagerId: null },
        { id: 'tu-sub-1', userId: 'sub-1', reportingManagerId: 'tu-mgr' },
        { id: 'tu-peer', userId: 'peer-1', reportingManagerId: null },
      ]);

      const subRecord: RecordAccessContext = {
        id: 'deal-sub',
        tenantId: 'tenant-a',
        ownerId: 'sub-1',
      };

      const peerRecord: RecordAccessContext = {
        id: 'deal-peer',
        tenantId: 'tenant-a',
        ownerId: 'peer-1',
      };

      expect(await authService.can(managerContext, 'crm:deals:edit', subRecord)).toBe(true);
      expect(await authService.can(managerContext, 'crm:deals:edit', peerRecord)).toBe(false);
    });

    it('ORGANIZATION scope: ALLOWS access across entire organization', async () => {
      const adminContext: UserAuthContext = {
        userId: 'admin-1',
        tenantId: 'tenant-a',
        roleName: 'ADMIN',
      };

      const anyRecordInTenant: RecordAccessContext = {
        id: 'lead-123',
        tenantId: 'tenant-a',
        assignedToId: 'random-user',
      };

      expect(await authService.can(adminContext, 'crm:leads:edit', anyRecordInTenant)).toBe(true);
    });

    it('SHARED scope: ALLOWS access when explicit valid record share exists', async () => {
      const userContext: UserAuthContext = {
        userId: 'rep-1',
        tenantId: 'tenant-a',
      };

      mockPrismaService.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-1',
        tenantId: 'tenant-a',
        userId: 'rep-1',
        isOrgOwner: false,
        status: 'ACTIVE',
        role: {
          name: 'Collaborator',
          isActive: true,
          permissions: [
            { module: 'crm:deals:view', scope: 'SHARED', hasAccess: true },
          ],
        },
      });

      mockPrismaService.recordShare.findFirst.mockResolvedValue({
        id: 'share-1',
        tenantId: 'tenant-a',
        resourceId: 'deal-shared',
        sharedWithUserId: 'rep-1',
      });

      const sharedRecord: RecordAccessContext = {
        id: 'deal-shared',
        tenantId: 'tenant-a',
        ownerId: 'rep-2',
      };

      expect(await authService.can(userContext, 'crm:deals:view', sharedRecord)).toBe(true);
    });
  });

  describe('3. Single Organization Owner Lifecycle & Safeguards', () => {
    it('Atomic transfer ownership switches isOrgOwner, promotes new owner to ADMIN, and logs sealed audit trail', async () => {
      const tenantId = 'tenant-a';
      const currentOwnerId = 'owner-1';
      const newOwnerId = 'usr-2';

      mockPrismaService.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-usr-2',
        tenantId,
        userId: newOwnerId,
        status: 'ACTIVE',
        user: { email: 'newowner@example.com' },
      });

      mockPrismaService.role.findFirst.mockResolvedValue({
        id: 'role-admin-id',
        name: 'ADMIN',
        isSystem: true,
      });

      const result = await authService.transferOrganizationOwnership(
        tenantId,
        currentOwnerId,
        newOwnerId,
        { actorUserId: currentOwnerId, ipAddress: '127.0.0.1' },
      );

      expect(result.success).toBe(true);
      expect(result.newOwnerId).toBe(newOwnerId);

      // Verify old owner isOrgOwner = false
      expect(mockPrismaService.tenantUser.updateMany).toHaveBeenCalledWith({
        where: { tenantId, userId: currentOwnerId },
        data: { isOrgOwner: false },
      });

      // Verify new owner isOrgOwner = true and roleId = admin
      expect(mockPrismaService.tenantUser.update).toHaveBeenCalledWith({
        where: { id: 'tu-usr-2' },
        data: { isOrgOwner: true, roleId: 'role-admin-id' },
      });

      // Verify sealed audit log creation
      expect(mockPrismaService.createSealedAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          action: 'ORGANIZATION_OWNERSHIP_TRANSFERRED',
          targetUserId: newOwnerId,
        }),
        mockPrismaService,
      );
    });

    it('Owner safeguards prevent deactivating or deleting the active Organization Owner', async () => {
      mockPrismaService.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-owner',
        tenantId: 'tenant-a',
        userId: 'owner-1',
        isOrgOwner: true,
        role: { name: 'ADMIN' },
      });

      await expect(
        authService.validateOwnerSafeguards('tenant-a', 'owner-1', 'delete'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        authService.validateOwnerSafeguards('tenant-a', 'owner-1', 'deactivate'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Owner safeguards prevent deleting the last active Administrator', async () => {
      mockPrismaService.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-admin',
        tenantId: 'tenant-a',
        userId: 'admin-1',
        isOrgOwner: false,
        role: { name: 'ADMIN' },
      });

      mockPrismaService.tenantUser.count.mockResolvedValue(1); // Exactly 1 admin left

      await expect(
        authService.validateOwnerSafeguards('tenant-a', 'admin-1', 'delete'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Authorization Cache Invalidation', () => {
    it('invalidates cache immediately on user and tenant changes', () => {
      const permMap = new Map();
      permMap.set('crm:leads:view', 'ORGANIZATION');

      cacheService.setPermissions('tenant-a', 'usr-1', permMap, false, false);
      expect(cacheService.getPermissions('tenant-a', 'usr-1')).not.toBeNull();

      cacheService.invalidateUser('tenant-a', 'usr-1');
      expect(cacheService.getPermissions('tenant-a', 'usr-1')).toBeNull();
    });
  });
});
