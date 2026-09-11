export interface RolePermission {
  module: string;
  hasAccess: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  color?: string | null;
  priority?: number;
  permissions: RolePermission[];
  _count?: {
    users: number;
    permissions: number;
    invitations?: number;
  };
}

export interface RoleFormData {
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

export interface RoleSortConfig {
  key: string;
  direction: "asc" | "desc";
}
