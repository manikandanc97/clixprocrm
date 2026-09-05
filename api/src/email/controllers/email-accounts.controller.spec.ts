import { Test, TestingModule } from '@nestjs/testing';
import { EmailAccountsController, isUserTenantAdmin } from './email-accounts.controller';
import { EmailAccountsService } from '../services/email-accounts.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';

describe('EmailAccountsController', () => {
  let controller: EmailAccountsController;
  let service: EmailAccountsService;

  const mockService = {
    getAccounts: jest.fn().mockResolvedValue([]),
    createAccount: jest.fn().mockResolvedValue({ id: 'acc-1', email: 'test@example.com' }),
    getAccountById: jest.fn().mockResolvedValue({ id: 'acc-1', email: 'test@example.com' }),
    updateAccount: jest.fn().mockResolvedValue({ id: 'acc-1', displayName: 'Updated' }),
    deleteAccount: jest.fn().mockResolvedValue({ success: true, id: 'acc-1' }),
    verifyAccount: jest.fn().mockResolvedValue({ success: true }),
    verifyDirect: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailAccountsController],
      providers: [
        {
          provide: EmailAccountsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmailAccountsController>(EmailAccountsController);
    service = module.get<EmailAccountsService>(EmailAccountsService);
    jest.clearAllMocks();
  });

  describe('isUserTenantAdmin helper', () => {
    it('should identify super admin', () => {
      expect(isUserTenantAdmin({ isSuperAdmin: true })).toBe(true);
    });

    it('should identify org owner', () => {
      expect(isUserTenantAdmin({ isOrgOwner: true })).toBe(true);
    });

    it('should identify ADMIN role', () => {
      expect(isUserTenantAdmin({ userRole: { name: 'ADMIN' } })).toBe(true);
      expect(isUserTenantAdmin({ userRole: { name: 'admin' } })).toBe(true);
    });

    it('should identify non-admin user', () => {
      expect(isUserTenantAdmin({ userRole: { name: 'SALES' } })).toBe(false);
      expect(isUserTenantAdmin({ userRole: { name: 'SUPPORT' } })).toBe(false);
    });
  });

  describe('Controller endpoints routing & delegation', () => {
    const mockReq = {
      tenantId: 'tenant-123',
      user: { id: 'user-456' },
      userRole: { name: 'SALES' },
      isSuperAdmin: false,
      isOrgOwner: false,
    };

    it('getAccounts should delegate with tenantId and userId', async () => {
      const res = await controller.getAccounts(mockReq);
      expect(res.success).toBe(true);
      expect(mockService.getAccounts).toHaveBeenCalledWith('tenant-123', 'user-456', false);
    });

    it('createAccount should delegate payload', async () => {
      const dto = { email: 'new@example.com' };
      const res = await controller.createAccount(mockReq, dto as any);
      expect(res.success).toBe(true);
      expect(mockService.createAccount).toHaveBeenCalledWith('tenant-123', 'user-456', false, dto);
    });

    it('getAccountById should delegate', async () => {
      const res = await controller.getAccountById(mockReq, 'acc-1');
      expect(res.success).toBe(true);
      expect(mockService.getAccountById).toHaveBeenCalledWith('tenant-123', 'user-456', false, 'acc-1');
    });

    it('updateAccount should delegate', async () => {
      const dto = { displayName: 'Updated' };
      const res = await controller.updateAccount(mockReq, 'acc-1', dto);
      expect(res.success).toBe(true);
      expect(mockService.updateAccount).toHaveBeenCalledWith('tenant-123', 'user-456', false, 'acc-1', dto);
    });

    it('deleteAccount should delegate', async () => {
      const res = await controller.deleteAccount(mockReq, 'acc-1');
      expect(res.success).toBe(true);
      expect(mockService.deleteAccount).toHaveBeenCalledWith('tenant-123', 'user-456', false, 'acc-1');
    });

    it('verifyAccount should delegate', async () => {
      const res = await controller.verifyAccount(mockReq, 'acc-1');
      expect(res.success).toBe(true);
      expect(mockService.verifyAccount).toHaveBeenCalledWith('tenant-123', 'user-456', false, 'acc-1');
    });

    it('verifyDirect should delegate without tenant/user context', async () => {
      const dto = { smtpHost: 'smtp.example.com', smtpPort: 587 };
      const res = await controller.verifyDirect(dto as any);
      expect(res.success).toBe(true);
      expect(mockService.verifyDirect).toHaveBeenCalledWith(dto);
    });
  });
});
