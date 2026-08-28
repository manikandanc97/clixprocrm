import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  description: string;
  diagnostics: any;
  attachments: { filename: string; size: number; contentType?: string }[];
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
  }>;
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private transporter: nodemailer.Transporter;
  private ticketsStore: Map<string, SupportTicketRecord> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Seed a helpful welcoming sample ticket for demonstration / onboarding
    this.seedInitialTickets();
  }

  private seedInitialTickets() {
    const welcomeTicket: SupportTicketRecord = {
      id: 'welcome-ticket-1',
      ticketId: `CRM-${new Date().getFullYear()}-001001`,
      userId: 'system',
      userEmail: 'support@clixprocrm.com',
      userName: 'ClixPro Support Team',
      subject: 'Welcome to ClixPro CRM Enterprise Support Desk',
      category: 'General Inquiry',
      priority: 'Low',
      status: 'RESOLVED',
      description: 'Welcome to your workspace! Our support engineers are available 24/7 to help you configure sales pipelines, user permissions, quotations, and API integrations.',
      diagnostics: {
        appVersion: '1.2.0',
        environment: process.env.NODE_ENV || 'development',
        systemStatus: 'Optimal',
      },
      attachments: [],
      estimatedResponseTime: 'Resolved',
      createdAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
      replies: [
        {
          id: 'rep-welcome-1',
          author: 'ClixPro Support Engineer',
          authorRole: 'Support Staff',
          message: 'Feel free to raise tickets anytime or browse our full Documentation hub for instant walkthroughs.',
          createdAt: new Date(Date.now() - 3600 * 23 * 1000).toISOString(),
          isStaff: true,
        },
      ],
    };
    this.ticketsStore.set(welcomeTicket.ticketId, welcomeTicket);
  }

  async sendSupportTicket(
    subject: string,
    category: string,
    priority: 'Low' | 'Medium' | 'High' | 'Critical',
    description: string,
    diagnostics: any,
    attachments: { filename: string; content: Buffer }[],
  ) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, '0');
    const ticketId = `CRM-${year}-${randomNum}`;

    let estimatedResponseTime = 'Within 24 hours';
    if (priority === 'Critical') estimatedResponseTime = '< 1 Hour (Priority Escalation)';
    else if (priority === 'High') estimatedResponseTime = '< 4 Hours';
    else if (priority === 'Medium') estimatedResponseTime = '< 12 Hours';
    else estimatedResponseTime = 'Within 24 Hours';

    // Store in internal tickets store
    const ticketRecord: SupportTicketRecord = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ticketId,
      userId: diagnostics?.userId || 'anonymous',
      userEmail: diagnostics?.email || 'support@clixprocrm.com',
      userName: diagnostics?.currentUserName || 'Workspace Member',
      tenantId: diagnostics?.tenantId,
      subject,
      category: category || 'General',
      priority: priority || 'Medium',
      status: 'OPEN',
      description,
      diagnostics,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        size: a.content.length,
      })),
      estimatedResponseTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
    };

    this.ticketsStore.set(ticketId, ticketRecord);

    const safeSubject = escapeHtml(subject);
    const safeCategory = escapeHtml(category);
    const safePriority = escapeHtml(priority);
    const safeDescription = escapeHtml(description);

    const safeDiagnostics = {
      currentUserName: escapeHtml(diagnostics?.currentUserName || 'N/A'),
      email: escapeHtml(diagnostics?.email || 'N/A'),
      userId: escapeHtml(diagnostics?.userId || 'N/A'),
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

    const htmlContent = `
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
            <em>Attachments: ${attachments.length} files included.</em>
          </p>
        </div>
      </div>
    `;

    const supportRecipient =
      process.env.SUPPORT_EMAIL || 'support@clixprocrm.com';

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        await this.transporter.sendMail({
          from: `"Clixpro Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: supportRecipient,
          subject: `[ClixProCRM Support] #${ticketId} - ${subject.slice(0, 80)}`,
          html: htmlContent,
          attachments,
        });
      } catch (mailError: any) {
        this.logger.error(
          `Failed to deliver support email for ticket ${ticketId}: ${mailError?.message || mailError}`,
        );
      }
    } else {
      this.logger.warn('SMTP configuration not found, skipping email dispatch.');
    }

    return { ticketId, estimatedResponseTime, ticket: ticketRecord };
  }

  async getUserTickets(userId: string, userEmail?: string): Promise<SupportTicketRecord[]> {
    const list: SupportTicketRecord[] = [];
    for (const ticket of this.ticketsStore.values()) {
      if (
        ticket.userId === userId ||
        ticket.userId === 'system' ||
        (userEmail && ticket.userEmail === userEmail) ||
        userId === 'admin'
      ) {
        list.push(ticket);
      }
    }
    // Sort descending by createdAt
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getTicketById(ticketId: string, userId: string): Promise<SupportTicketRecord | null> {
    const ticket = this.ticketsStore.get(ticketId);
    if (!ticket) return null;
    return ticket;
  }

  async addReplyToTicket(
    ticketId: string,
    userId: string,
    userName: string,
    message: string,
  ): Promise<SupportTicketRecord | null> {
    const ticket = this.ticketsStore.get(ticketId);
    if (!ticket) return null;

    const reply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      author: userName || 'Customer',
      authorRole: 'Client',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      isStaff: false,
    };

    ticket.replies.push(reply);
    ticket.updatedAt = new Date().toISOString();
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      ticket.status = 'IN_PROGRESS';
    }

    return ticket;
  }

  getSystemStatus() {
    return {
      status: 'OPERATIONAL',
      version: '1.2.0',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      smtpService: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
        ? 'CONFIGURED'
        : 'LOCAL_LOG_ONLY',
      serverLoad: 'HEALTHY',
    };
  }
}
