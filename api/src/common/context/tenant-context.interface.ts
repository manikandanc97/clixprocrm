export interface RequestTenantContext {
  tenantId?: string;
  userId?: string;
  isSuperAdmin: boolean;
  isOrgOwner?: boolean;
  branchId?: string | null;
  userRole?: any;
}

