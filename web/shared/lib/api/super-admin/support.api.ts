import client from "../client";

export interface PlatformSupportTicket {
  id: string;
  ticketNumber: string;
  tenantId: string;
  createdById: string;
  assignedToId: string | null;
  subject: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED";
  description: string;
  diagnostics?: Record<string, unknown>;
  estimatedResponseTime?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }>;
  messages?: Array<{
    id: string;
    senderId: string;
    message: string;
    isStaff: boolean;
    isInternal: boolean;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      isSuperAdmin?: boolean;
    };
  }>;
  _count?: {
    messages: number;
  };
}

export interface SupportTicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingForUser: number;
  resolved: number;
  closed: number;
  critical: number;
}

export const fetchPlatformSupportStats = async (): Promise<SupportTicketStats> => {
  const response = await client.get<{ success: boolean; data: SupportTicketStats }>(
    "/super-admin/support/stats"
  );
  return response.data.data;
};

export const fetchPlatformSupportTickets = async (params: {
  status?: string;
  priority?: string;
  category?: string;
  tenantId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const response = await client.get<{
    success: boolean;
    data: {
      tickets: PlatformSupportTicket[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  }>("/super-admin/support/tickets", { params });
  return response.data.data;
};

export const fetchPlatformSupportTicketDetails = async (ticketId: string): Promise<PlatformSupportTicket> => {
  const response = await client.get<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}`
  );
  return response.data.data;
};

export const replyPlatformSupportTicket = async (
  ticketId: string,
  message: string,
  isInternal = false
): Promise<PlatformSupportTicket> => {
  const response = await client.post<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}/reply`,
    { message, isInternal }
  );
  return response.data.data;
};

export const updatePlatformSupportTicketStatus = async (
  ticketId: string,
  status: string
): Promise<PlatformSupportTicket> => {
  const response = await client.patch<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}/status`,
    { status }
  );
  return response.data.data;
};

export const assignPlatformSupportTicket = async (
  ticketId: string,
  assignedToId: string | null
): Promise<PlatformSupportTicket> => {
  const response = await client.patch<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}/assign`,
    { assignedToId }
  );
  return response.data.data;
};

export const updatePlatformSupportTicket = async (
  ticketId: string,
  data: {
    subject?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
  }
): Promise<PlatformSupportTicket> => {
  const response = await client.patch<{ success: boolean; data: PlatformSupportTicket }>(
    `/super-admin/support/tickets/${ticketId}`,
    data
  );
  return response.data.data;
};

export const deletePlatformSupportTicket = async (
  ticketId: string
): Promise<{ success: boolean; id: string; ticketNumber: string }> => {
  const response = await client.delete<{
    success: boolean;
    data: { success: boolean; id: string; ticketNumber: string };
  }>(`/super-admin/support/tickets/${ticketId}`);
  return response.data.data;
};






