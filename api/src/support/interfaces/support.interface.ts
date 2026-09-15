export interface SupportTicketRecord {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  tenantId?: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  description: string;
  diagnostics: any;
  attachments: {
    filename: string;
    size: number;
    contentType?: string;
    url?: string;
  }[];
  estimatedResponseTime: string;
  createdAt: string;
  updatedAt: string;
  replies: Array<{
    id: string;
    author: string;
    authorRole: string;
    message: string;
    createdAt: string;
    isStaff: boolean;
    isInternal?: boolean;
  }>;
}
