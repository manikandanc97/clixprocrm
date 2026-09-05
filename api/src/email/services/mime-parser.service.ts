import { Injectable, Logger } from '@nestjs/common';
import { simpleParser, ParsedMail, HeaderValue } from 'mailparser';

export interface ParsedEmailAttachment {
  fileName: string;
  contentType: string;
  content: Buffer;
  size: number;
  contentId?: string | null;
  isInline: boolean;
}

export interface ParsedInboundEmail {
  internetMessageId: string | null;
  inReplyTo: string | null;
  references: string[];
  fromAddress: string;
  fromName: string | null;
  toRecipients: string[];
  ccRecipients: string[];
  bccRecipients: string[];
  replyTo: string | null;
  subject: string;
  date: Date;
  bodyPlain: string;
  bodyHtml: string;
  headers: Record<string, string>;
  attachments: ParsedEmailAttachment[];
}

export const ALLOWED_HEADER_KEYS = new Set([
  'authentication-results',
  'received-spf',
  'dkim-signature',
  'return-path',
  'auto-submitted',
  'list-unsubscribe',
]);

@Injectable()
export class MimeParserService {
  private readonly logger = new Logger(MimeParserService.name);

  /**
   * Safely parses raw RFC 5322 MIME email buffer or string.
   */
  async parseMime(rawMime: Buffer | string): Promise<ParsedInboundEmail> {
    try {
      const parsed: ParsedMail = await simpleParser(rawMime);

      // 1. Message-ID extraction
      const internetMessageId = parsed.messageId ? parsed.messageId.trim() : null;

      // 2. In-Reply-To extraction
      let inReplyTo: string | null = null;
      if (parsed.inReplyTo) {
        inReplyTo = Array.isArray(parsed.inReplyTo)
          ? parsed.inReplyTo[0]?.trim() || null
          : String(parsed.inReplyTo).trim() || null;
      }

      // 3. References extraction
      let references: string[] = [];
      if (parsed.references) {
        if (Array.isArray(parsed.references)) {
          references = parsed.references
            .map((r) => (typeof r === 'string' ? r.trim() : ''))
            .filter(Boolean);
        } else if (typeof parsed.references === 'string') {
          references = parsed.references
            .split(/\s+/)
            .map((r) => r.trim())
            .filter(Boolean);
        }
      }

      // 4. From address extraction
      const fromObj = parsed.from?.value?.[0];
      const fromAddress = fromObj?.address?.trim().toLowerCase() || 'unknown@sender.invalid';
      const fromName = fromObj?.name?.trim() || null;

      // 5. To recipients
      const toRecipients: string[] = [];
      if (parsed.to) {
        const toList = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
        for (const item of toList) {
          if (item.value && Array.isArray(item.value)) {
            for (const addr of item.value) {
              if (addr.address) toRecipients.push(addr.address.trim().toLowerCase());
            }
          }
        }
      }

      // 6. CC recipients
      const ccRecipients: string[] = [];
      if (parsed.cc) {
        const ccList = Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc];
        for (const item of ccList) {
          if (item.value && Array.isArray(item.value)) {
            for (const addr of item.value) {
              if (addr.address) ccRecipients.push(addr.address.trim().toLowerCase());
            }
          }
        }
      }

      // 7. BCC recipients
      const bccRecipients: string[] = [];
      if (parsed.bcc) {
        const bccList = Array.isArray(parsed.bcc) ? parsed.bcc : [parsed.bcc];
        for (const item of bccList) {
          if (item.value && Array.isArray(item.value)) {
            for (const addr of item.value) {
              if (addr.address) bccRecipients.push(addr.address.trim().toLowerCase());
            }
          }
        }
      }

      // 8. Reply-To
      const replyToObj = parsed.replyTo?.value?.[0];
      const replyTo = replyToObj?.address?.trim().toLowerCase() || null;

      // 9. Subject & Date
      const subject = parsed.subject?.trim() || '(No Subject)';
      const date = parsed.date instanceof Date && !isNaN(parsed.date.getTime())
        ? parsed.date
        : new Date();

      // 10. Bodies
      const bodyPlain = parsed.text || '';
      const bodyHtml = typeof parsed.html === 'string' ? parsed.html : '';

      // 11. Curated allowed headers only
      const headers: Record<string, string> = {};
      if (parsed.headerLines && Array.isArray(parsed.headerLines)) {
        for (const h of parsed.headerLines) {
          const lowerKey = (h.key || '').toLowerCase();
          if (ALLOWED_HEADER_KEYS.has(lowerKey)) {
            const colonIdx = h.line.indexOf(':');
            const val = colonIdx !== -1 ? h.line.slice(colonIdx + 1).trim() : h.line.trim();
            headers[lowerKey] = val;
          }
        }
      }

      // 12. Attachments
      const attachments: ParsedEmailAttachment[] = [];
      if (parsed.attachments && Array.isArray(parsed.attachments)) {
        for (const att of parsed.attachments) {
          const fileName = att.filename || `attachment_${Date.now()}`;
          const contentType = att.contentType || 'application/octet-stream';
          const content = att.content || Buffer.alloc(0);
          const size = att.size !== undefined ? att.size : content.length;
          const contentId = att.cid ? att.cid.replace(/^<|>$/g, '').trim() : null;
          const isInline = !!att.related || (att as any).disposition === 'inline' || Boolean(contentId);

          attachments.push({
            fileName,
            contentType,
            content,
            size,
            contentId,
            isInline,
          });
        }
      }

      return {
        internetMessageId,
        inReplyTo,
        references,
        fromAddress,
        fromName,
        toRecipients,
        ccRecipients,
        bccRecipients,
        replyTo,
        subject,
        date,
        bodyPlain,
        bodyHtml,
        headers,
        attachments,
      };
    } catch (err: any) {
      this.logger.error(`MIME parse error: ${err?.message || err}`);
      throw err;
    }
  }

  private headerValueToString(val: HeaderValue): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) {
      return val.map((v) => this.headerValueToString(v)).join(', ');
    }
    if (typeof val === 'object') {
      if ('value' in val) {
        return this.headerValueToString((val as any).value);
      }
      return JSON.stringify(val);
    }
    return String(val);
  }
}
