import { SupportTicketPriority } from '@prisma/client';
import { SupportTicketRecord } from '../interfaces/support.interface';

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function mapPriorityToEnum(priority: string): SupportTicketPriority {
  const norm = String(priority || '').toUpperCase();
  if (norm === 'CRITICAL') return SupportTicketPriority.CRITICAL;
  if (norm === 'HIGH') return SupportTicketPriority.HIGH;
  if (norm === 'LOW') return SupportTicketPriority.LOW;
  return SupportTicketPriority.MEDIUM;
}

export function mapEnumToPriority(
  priority: SupportTicketPriority,
): 'Low' | 'Medium' | 'High' | 'Critical' {
  switch (priority) {
    case SupportTicketPriority.CRITICAL:
      return 'Critical';
    case SupportTicketPriority.HIGH:
      return 'High';
    case SupportTicketPriority.LOW:
      return 'Low';
    default:
      return 'Medium';
  }
}

export function extractRoleString(roleInput: any): string {
  if (!roleInput) return '';
  if (typeof roleInput === 'string') return roleInput;
  if (typeof roleInput === 'object') {
    return roleInput.name || roleInput.role || roleInput.title || '';
  }
  return String(roleInput);
}

export function formatTicketOutput(
  ticket: any,
  includeInternal = false,
): SupportTicketRecord {
  const replies = (ticket.messages || [])
    .filter((m: any) => includeInternal || !m.isInternal)
    .map((m: any) => ({
      id: m.id,
      author:
        m.sender?.name ||
        m.sender?.email ||
        (m.isStaff ? 'ClixPro Support Staff' : 'Customer'),
      authorRole: m.isStaff
        ? ('Support Engineer' as const)
        : ('Client' as const),
      message: m.message,
      createdAt:
        m.createdAt instanceof Date
          ? m.createdAt.toISOString()
          : String(m.createdAt),
      isStaff: m.isStaff,
      isInternal: m.isInternal || false,
    }));

  const attachments = (ticket.attachments || []).map((a: any) => ({
    filename: a.fileName,
    size: a.fileSize,
    contentType: a.fileType,
    url: a.fileUrl,
  }));

  return {
    id: ticket.id,
    ticketId: ticket.ticketNumber,
    userId: ticket.createdById || ticket.createdBy?.id || 'anonymous',
    userEmail: ticket.createdBy?.email || 'support@clixprocrm.com',
    userName: ticket.createdBy?.name || 'Workspace Member',
    tenantId: ticket.tenantId,
    subject: ticket.subject,
    category: ticket.category,
    priority: mapEnumToPriority(ticket.priority),
    status: ticket.status,
    description: ticket.description,
    diagnostics: ticket.diagnostics,
    attachments,
    estimatedResponseTime: ticket.estimatedResponseTime || 'Within 24 Hours',
    createdAt:
      ticket.createdAt instanceof Date
        ? ticket.createdAt.toISOString()
        : String(ticket.createdAt),
    updatedAt:
      ticket.updatedAt instanceof Date
        ? ticket.updatedAt.toISOString()
        : String(ticket.updatedAt),
    replies,
  };
}
