import { SupportTicketRecord } from '../interfaces/support.interface';
import {
    escapeHtml,
    mapEnumToPriority,
    mapPriorityToEnum,
} from './support-mapper.util';

export function calculateEstimatedResponseTime(priority: string): string {
  if (priority === 'Critical') return '< 1 Hour (Priority Escalation)';
  if (priority === 'High') return '< 4 Hours';
  if (priority === 'Medium') return '< 12 Hours';
  return 'Within 24 Hours';
}

export function buildFallbackSupportTicket(params: {
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  tenantId?: string;
  subject: string;
  category?: string;
  priority: string;
  description: string;
  diagnostics: any;
  attachments: { filename: string; content: Buffer; contentType?: string }[];
  estimatedResponseTime: string;
}): SupportTicketRecord {
  const mappedPriority = mapPriorityToEnum(params.priority);
  const now = new Date().toISOString();
  return {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    ticketId: params.ticketId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    tenantId: params.tenantId,
    subject: params.subject,
    category: params.category || 'General',
    priority: mapEnumToPriority(mappedPriority),
    status: 'OPEN',
    description: params.description,
    diagnostics: params.diagnostics,
    attachments: params.attachments.map((a) => ({
      filename: a.filename,
      size: a.content.length,
      contentType: a.contentType,
    })),
    estimatedResponseTime: params.estimatedResponseTime,
    createdAt: now,
    updatedAt: now,
    replies: [
      {
        id: `rep_${Date.now()}`,
        author: params.userName,
        authorRole: 'Client',
        message: params.description,
        createdAt: now,
        isStaff: false,
      },
    ],
  };
}

export function buildSupportEmailHtml(params: {
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  diagnostics: any;
  userEmail: string;
  userName: string;
  userId: string;
  attachmentsCount: number;
}): string {
  const {
    ticketId,
    subject,
    category,
    priority,
    description,
    diagnostics,
    userEmail,
    userName,
    userId,
    attachmentsCount,
  } = params;

  const safeSubject = escapeHtml(subject);
  const safeCategory = escapeHtml(category);
  const safePriority = escapeHtml(priority);
  const safeDescription = escapeHtml(description);

  const safeDiagnostics = {
    currentUserName: escapeHtml(
      diagnostics?.currentUserName || userName || 'N/A',
    ),
    email: escapeHtml(diagnostics?.email || userEmail || 'N/A'),
    userId: escapeHtml(diagnostics?.userId || userId || 'N/A'),
    role: escapeHtml(diagnostics?.role || 'N/A'),
    currentUrl: escapeHtml(diagnostics?.currentUrl || 'N/A'),
    browser: escapeHtml(diagnostics?.browser || 'N/A'),
    operatingSystem: escapeHtml(diagnostics?.operatingSystem || 'N/A'),
    deviceType: escapeHtml(diagnostics?.deviceType || 'N/A'),
    screenResolution: escapeHtml(diagnostics?.screenResolution || 'N/A'),
    timezone: escapeHtml(diagnostics?.timezone || 'N/A'),
    appVersion: escapeHtml(diagnostics?.appVersion || 'N/A'),
    timestamp: escapeHtml(diagnostics?.timestamp || new Date().toISOString()),
  };

  const priorityColor =
    priority === 'Critical'
      ? '#ef4444'
      : priority === 'High'
        ? '#f97316'
        : priority === 'Medium'
          ? '#eab308'
          : '#10b981';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">Clixpro CRM Support Ticket</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p><strong>Ticket ID:</strong> ${escapeHtml(ticketId)}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Category:</strong> ${safeCategory}</p>
        <p><strong>Priority:</strong> <span style="background-color: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${safePriority}</span></p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 4px; white-space: pre-wrap;">
          <strong>Description:</strong><br/>
          ${safeDescription}
        </div>
        
        <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">User & System Diagnostics</h3>
        <table style="width: 100%; font-size: 13px; text-align: left; border-collapse: collapse;">
          <tbody>
            <tr><th style="padding: 4px;">User Name:</th><td>${safeDiagnostics.currentUserName}</td></tr>
            <tr><th style="padding: 4px;">Email:</th><td>${safeDiagnostics.email}</td></tr>
            <tr><th style="padding: 4px;">User ID:</th><td>${safeDiagnostics.userId}</td></tr>
            <tr><th style="padding: 4px;">Role:</th><td>${safeDiagnostics.role}</td></tr>
            <tr><th style="padding: 4px;">Current URL:</th><td>${safeDiagnostics.currentUrl}</td></tr>
            <tr><th style="padding: 4px;">Browser:</th><td>${safeDiagnostics.browser}</td></tr>
            <tr><th style="padding: 4px;">OS:</th><td>${safeDiagnostics.operatingSystem}</td></tr>
            <tr><th style="padding: 4px;">Device:</th><td>${safeDiagnostics.deviceType}</td></tr>
            <tr><th style="padding: 4px;">Resolution:</th><td>${safeDiagnostics.screenResolution}</td></tr>
            <tr><th style="padding: 4px;">Timezone:</th><td>${safeDiagnostics.timezone}</td></tr>
            <tr><th style="padding: 4px;">App Version:</th><td>${safeDiagnostics.appVersion}</td></tr>
            <tr><th style="padding: 4px;">Submitted At:</th><td>${safeDiagnostics.timestamp}</td></tr>
          </tbody>
        </table>
        
        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
          <em>Attachments: ${attachmentsCount} files included.</em>
        </p>
      </div>
    </div>
  `;
}
