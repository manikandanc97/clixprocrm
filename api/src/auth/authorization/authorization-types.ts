export type DataScope =
  | 'OWN'
  | 'TEAM'
  | 'SUBORDINATES'
  | 'BRANCH'
  | 'ORGANIZATION'
  | 'SHARED';

export const DATA_SCOPE_HIERARCHY: Record<DataScope, number> = {
  OWN: 1,
  TEAM: 2,
  SUBORDINATES: 3,
  BRANCH: 4,
  SHARED: 5,
  ORGANIZATION: 6,
};

export interface UserAuthContext {
  userId: string;
  tenantId?: string;
  isSuperAdmin?: boolean;
  isOrgOwner?: boolean;
  roleName?: string;
  roles?: Array<{
    id: string;
    name: string;
    isSystem: boolean;
    isActive: boolean;
    permissions?: Array<{
      module: string;
      action?: string | null;
      scope?: DataScope | string;
      hasAccess: boolean;
    }>;
  }>;
  teamIds?: string[];
  branchId?: string | null;
  reportingManagerId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RecordAccessContext {
  id?: string;
  tenantId?: string;
  ownerId?: string | null;
  assignedToId?: string | null;
  createdById?: string | null;
  teamId?: string | null;
  branchId?: string | null;
  [key: string]: any;
}

export interface PermissionDefinition {
  key: string; // e.g. 'crm:leads:view'
  module: string; // e.g. 'crm'
  resource: string; // e.g. 'leads'
  action: string; // e.g. 'view'
  label: string;
  description: string;
  supportedScopes: DataScope[];
  defaultScope: DataScope;
}

export interface EffectivePermission {
  permission: string;
  scope: DataScope;
  hasAccess: boolean;
}
