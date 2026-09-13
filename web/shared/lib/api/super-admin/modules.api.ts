import client from "../client";

export interface PlatformModule {
  id: string;
  key: string;
  label: string;
  icon: string;
  route: string;
  group: string;
  navigationScope: string;
  parentId: string | null;
  sortOrder: number;
  isEnabled: boolean;
  isVisible: boolean;
  isSystem: boolean;
  permission: string | null;
  badge: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  children?: PlatformModule[];
}

export interface CreatePlatformModuleDto {
  key?: string;
  label: string;
  icon?: string;
  route: string;
  group?: string;
  navigationScope?: string;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

export interface UpdatePlatformModuleDto {
  key?: string;
  label?: string;
  icon?: string;
  route?: string;
  group?: string;
  navigationScope?: string;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

export const fetchPlatformModules = async (params?: {
  search?: string;
  group?: string;
  navigationScope?: string;
  isEnabled?: boolean;
  isVisible?: boolean;
}): Promise<{
  modules: PlatformModule[];
  stats: {
    total: number;
    enabled: number;
    disabled: number;
    system: number;
  };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      modules: PlatformModule[];
      stats: {
        total: number;
        enabled: number;
        disabled: number;
        system: number;
      };
    };
  }>("/super-admin/modules", { params });
  return response.data.data;
};

/**
 * Fetches enabled & visible TENANT_CRM navigation items.
 * Used by: usePlatformNavigation() → tenant workspace sidebar.
 */
export const fetchPlatformNavigation = async (): Promise<PlatformModule[]> => {
  const response = await client.get<{
    success: boolean;
    data: PlatformModule[];
  }>("/super-admin/modules/navigation");
  return response.data.data;
};

/**
 * Fetches enabled & visible SUPER_ADMIN navigation items.
 * Used by: useSuperAdminNavigation() → super admin platform sidebar.
 * Requires Super Admin session.
 */
export const fetchSuperAdminNavigation = async (): Promise<PlatformModule[]> => {
  const response = await client.get<{
    success: boolean;
    data: PlatformModule[];
  }>("/super-admin/modules/super-admin-navigation");
  return response.data.data;
};

export const createPlatformModule = async (data: CreatePlatformModuleDto) => {
  const response = await client.post<{
    success: boolean;
    data: PlatformModule;
    message: string;
  }>("/super-admin/modules", data);
  return response.data;
};

export const updatePlatformModule = async (
  id: string,
  data: UpdatePlatformModuleDto
) => {
  const response = await client.put<{
    success: boolean;
    data: PlatformModule;
    message: string;
  }>(`/super-admin/modules/${id}`, data);
  return response.data;
};

export const togglePlatformModuleStatus = async (
  id: string,
  params: { isEnabled?: boolean; isVisible?: boolean }
) => {
  const response = await client.patch<{
    success: boolean;
    data: PlatformModule;
    message: string;
  }>(`/super-admin/modules/${id}/toggle`, params);
  return response.data;
};

export const reorderPlatformModules = async (
  items: Array<{ id: string; sortOrder: number }>
) => {
  const response = await client.patch<{
    success: boolean;
    message: string;
  }>("/super-admin/modules/reorder", { items });
  return response.data;
};

export const deletePlatformModule = async (id: string) => {
  const response = await client.delete<{
    success: boolean;
    message: string;
  }>(`/super-admin/modules/${id}`);
  return response.data;
};

// ==========================================
// 8. PLATFORM PLANS & BILLING APIS
// ==========================================

