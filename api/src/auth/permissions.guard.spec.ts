import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard Security Validation', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createMockContext(
    userRole: any,
    requiredPermissions?: string[],
  ): ExecutionContext {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(requiredPermissions);
    const request = { userRole };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  describe('1. Platform & Admin Role Bypasses', () => {
    it('allows SUPERADMIN unconditionally', () => {
      const ctx = createMockContext({ name: 'SUPER_ADMIN', permissions: [] }, [
        'Roles:Manage',
      ]);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows ADMIN unconditionally', () => {
      const ctx = createMockContext({ name: 'ADMIN', permissions: [] }, [
        'Roles:Manage',
        'Employees:Manage',
      ]);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows OWNER unconditionally', () => {
      const ctx = createMockContext({ name: 'OWNER', permissions: [] }, [
        'Roles:Manage',
      ]);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('rejects deactivated roles regardless of name', () => {
      const ctx = createMockContext(
        { name: 'ADMIN', isActive: false, permissions: [] },
        ['Roles:Manage'],
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('2. Exact Canonical Permission Enforcement', () => {
    it('allows user with exact canonical permission (e.g. Tasks)', () => {
      const userRole = {
        name: 'EMPLOYEE',
        permissions: [{ module: 'Tasks', hasAccess: true }],
      };
      const ctx = createMockContext(userRole, ['Tasks']);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('denies user when hasAccess is false', () => {
      const userRole = {
        name: 'EMPLOYEE',
        permissions: [{ module: 'Tasks', hasAccess: false }],
      };
      const ctx = createMockContext(userRole, ['Tasks']);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('denies user with unrelated module (e.g. Leads cannot access Roles)', () => {
      const userRole = {
        name: 'SALES',
        permissions: [{ module: 'Leads', hasAccess: true }],
      };
      const ctx = createMockContext(userRole, ['Roles']);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('3. Action-Level Privilege Escalation Prevention', () => {
    it('PREVENTS Employees:View from satisfying Employees:Manage', () => {
      const userRole = {
        name: 'STAFF',
        permissions: [{ module: 'Employees:View', hasAccess: true }],
      };
      const ctx = createMockContext(userRole, ['Employees:Manage']);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('PREVENTS Roles:View from satisfying Roles:Manage', () => {
      const userRole = {
        name: 'STAFF',
        permissions: [{ module: 'Roles:View', hasAccess: true }],
      };
      const ctx = createMockContext(userRole, ['Roles:Manage']);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('PREVENTS Lead permissions from satisfying unrelated modules via fuzzy substrings', () => {
      const userRole = {
        name: 'SALES',
        permissions: [{ module: 'LeadManager', hasAccess: true }],
      };
      const ctx = createMockContext(userRole, ['Roles:Manage']);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('ALLOWS full module grant (e.g. Employees) to satisfy read-only action (Employees:View)', () => {
      const userRole = {
        name: 'MANAGER',
        permissions: [{ module: 'Employees', hasAccess: true }],
      };
      const ctx = createMockContext(userRole, ['Employees:View']);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('ALLOWS wildcard ALL permission for custom super roles', () => {
      const userRole = {
        name: 'AUDITOR',
        permissions: [{ module: 'ALL', hasAccess: true }],
      };
      const ctx = createMockContext(userRole, ['Roles:Manage']);
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
