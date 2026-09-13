import client from "../client";

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: "ACTIVE" | "SUSPENDED";
  currency: string;
  timezone: string;
  userCount: number;
  leadCount: number;
  customerCount: number;
  dealCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}


export interface PlatformOrganizationDetail extends PlatformOrganization {
  taxId?: string | null;
  address?: string | null;
  logo?: string | null;
  counts?: Record<string, number>;
  members?: Array<{
    membershipId: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    role: string;
    joinedAt: string;
  }>;
}


export const fetchPlatformOrganizations = async (params?: {
  search?: string;
  status?: "ACTIVE" | "SUSPENDED";
  plan?: string;
  page?: number;
  limit?: number;
}): Promise<{
  organizations: PlatformOrganization[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const response = await client.get<{
    success: boolean;
    data: {
      organizations: PlatformOrganization[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>("/super-admin/organizations", { params });
  return response.data.data;
};

export const fetchPlatformOrganizationDetails = async (id: string): Promise<PlatformOrganizationDetail> => {
  const response = await client.get<{ success: boolean; data: PlatformOrganizationDetail }>(
    `/super-admin/organizations/${id}`
  );
  return response.data.data;
};

export const createPlatformOrganization = async (data: {
  name: string;
  slug?: string;
  plan?: string;
  currency?: string;
  timezone?: string;
}): Promise<{ success: boolean; data: PlatformOrganization; message: string }> => {
  const response = await client.post<{ success: boolean; data: PlatformOrganization; message: string }>(
    "/super-admin/organizations",
    data
  );
  return response.data;
};

export const updatePlatformOrganization = async (
  id: string,
  data: Partial<PlatformOrganization>
): Promise<{ success: boolean; data: PlatformOrganization; message: string }> => {
  const response = await client.put<{ success: boolean; data: PlatformOrganization; message: string }>(
    `/super-admin/organizations/${id}`,
    data
  );
  return response.data;
};

export const updateOrganizationStatus = async (
  id: string,
  status: "ACTIVE" | "SUSPENDED",
  reason?: string
): Promise<{ success: boolean; data: PlatformOrganization; message: string }> => {
  const response = await client.patch<{ success: boolean; data: PlatformOrganization; message: string }>(
    `/super-admin/organizations/${id}/status`,
    { status, reason }
  );
  return response.data;
};

export const deletePlatformOrganization = async (id: string): Promise<{ success: boolean; data: { id: string }; message: string }> => {
  const response = await client.delete<{ success: boolean; data: { id: string }; message: string }>(
    `/super-admin/organizations/${id}`
  );
  return response.data;
};

