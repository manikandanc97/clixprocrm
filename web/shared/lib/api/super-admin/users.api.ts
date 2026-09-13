import client from "../client";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isSuperAdmin: boolean;
  createdAt: string;
  organizations: Array<{
    tenantId: string;
    name: string;
    slug: string;
    status: "ACTIVE" | "SUSPENDED";
    role: string;
    membershipStatus: string;
  }>;
}


export const fetchPlatformUsers = async (params?: {
  search?: string;
  status?: string;
  isSuperAdmin?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  users: PlatformUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      users: PlatformUser[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>("/super-admin/users", { params });
  return response.data.data;
};

export const updatePlatformUserStatus = async (
  id: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
): Promise<{ success: boolean; data: PlatformUser; message: string }> => {
  const response = await client.patch<{ success: boolean; data: PlatformUser; message: string }>(
    `/super-admin/users/${id}/status`,
    { status }
  );
  return response.data;
};

export const toggleSuperAdminRole = async (
  id: string,
  isSuperAdmin: boolean
): Promise<{ success: boolean; data: PlatformUser; message: string }> => {
  const response = await client.patch<{ success: boolean; data: PlatformUser; message: string }>(
    `/super-admin/users/${id}/super-admin`,
    { isSuperAdmin }
  );
  return response.data;
};

export const transferSuperAdminRole = async (
  targetUserId: string
): Promise<{ success: boolean; data: PlatformUser; message: string }> => {
  const response = await client.post<{ success: boolean; data: PlatformUser; message: string }>(
    "/super-admin/users/transfer-super-admin",
    { targetUserId }
  );
  return response.data;
};

export const deletePlatformUser = async (
  id: string
): Promise<{ success: boolean; data: { id: string }; message: string }> => {
  const response = await client.delete<{ success: boolean; data: { id: string }; message: string }>(
    `/super-admin/users/${id}`
  );
  return response.data;
};

