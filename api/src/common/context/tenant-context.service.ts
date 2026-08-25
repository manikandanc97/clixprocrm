import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestTenantContext } from './tenant-context.interface';

@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestTenantContext>();

  /**
   * Runs a given callback within an isolated RequestTenantContext.
   */
  run<T>(context: RequestTenantContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Retrieves the current RequestTenantContext if active in the async scope.
   */
  getContext(): RequestTenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Updates the current async store with verified context attributes.
   * Safe to call multiple times in the request lifecycle (e.g. after guard verification).
   */
  setContext(updates: Partial<RequestTenantContext>): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      if (updates.tenantId !== undefined) store.tenantId = updates.tenantId;
      if (updates.userId !== undefined) store.userId = updates.userId;
      if (updates.isSuperAdmin !== undefined) store.isSuperAdmin = updates.isSuperAdmin;
      if (updates.isOrgOwner !== undefined) store.isOrgOwner = updates.isOrgOwner;
      if (updates.branchId !== undefined) store.branchId = updates.branchId;
      if (updates.userRole !== undefined) store.userRole = updates.userRole;
    }
  }

  /**
   * Gets the verified tenantId from current request context.
   */
  getTenantId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.tenantId;
  }

  /**
   * Gets the verified userId from current request context.
   */
  getUserId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.userId;
  }

  /**
   * Checks if the active context is authenticated as Super Admin.
   */
  isSuperAdmin(): boolean {
    return this.asyncLocalStorage.getStore()?.isSuperAdmin === true;
  }

  /**
   * Checks if the active user is the organization owner.
   */
  isOrgOwner(): boolean {
    return this.asyncLocalStorage.getStore()?.isOrgOwner === true;
  }

  /**
   * Gets the verified user role object from current request context.
   */
  getUserRole(): any {
    return this.asyncLocalStorage.getStore()?.userRole;
  }
}
