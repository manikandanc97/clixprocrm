import {
  EmailAttachmentStorageService,
  MAX_SINGLE_ATTACHMENT_BYTES,
  MAX_AGGREGATE_ATTACHMENTS_BYTES,
} from './email-attachment-storage.service';
import { ParsedEmailAttachment } from './mime-parser.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('EmailAttachmentStorageService Suite', () => {
  let service: EmailAttachmentStorageService;

  const TENANT_A = 'tenant-uuid-1111';
  const TENANT_B = 'tenant-uuid-2222';
  const MESSAGE_ID = 'msg-uuid-9999';

  beforeEach(() => {
    service = new EmailAttachmentStorageService();
  });

  it('1. should process valid PNG and PDF attachments and generate correct storage keys', async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);

    const attachments: ParsedEmailAttachment[] = [
      {
        fileName: 'screenshot.png',
        contentType: 'image/png',
        content: pngBuffer,
        size: pngBuffer.length,
        isInline: false,
      },
      {
        fileName: 'invoice.pdf',
        contentType: 'application/pdf',
        content: pdfBuffer,
        size: pdfBuffer.length,
        isInline: false,
      },
    ];

    const results = await service.processAndStoreAttachments(TENANT_A, MESSAGE_ID, attachments);

    expect(results).toHaveLength(2);

    expect(results[0].fileName).toBe('screenshot.png');
    expect(results[0].contentType).toBe('image/png');
    expect(results[0].isQuarantined).toBe(false);
    expect(results[0].storageKey).toMatch(new RegExp(`^tenants/${TENANT_A}/emails/${MESSAGE_ID}/[a-f0-9-]+_screenshot\\.png$`));

    expect(results[1].fileName).toBe('invoice.pdf');
    expect(results[1].contentType).toBe('application/pdf');
    expect(results[1].isQuarantined).toBe(false);
    expect(results[1].storageKey).toMatch(new RegExp(`^tenants/${TENANT_A}/emails/${MESSAGE_ID}/[a-f0-9-]+_invoice\\.pdf$`));
  });

  it('2. should quarantine dangerous executable files (.exe, .bat, .sh)', async () => {
    const batBuffer = Buffer.from('@echo off\r\ncalc.exe');
    const attachments: ParsedEmailAttachment[] = [
      {
        fileName: 'installer.exe',
        contentType: 'application/octet-stream',
        content: Buffer.from('MZ...'),
        size: 100,
        isInline: false,
      },
      {
        fileName: 'script.bat',
        contentType: 'application/x-bat',
        content: batBuffer,
        size: batBuffer.length,
        isInline: false,
      },
    ];

    const results = await service.processAndStoreAttachments(TENANT_A, MESSAGE_ID, attachments);

    expect(results[0].isQuarantined).toBe(true);
    expect(results[1].isQuarantined).toBe(true);
  });

  it('3. should quarantine attachments exceeding the 25 MB individual limit', async () => {
    const oversizedBuffer = Buffer.alloc(10); // Simulated size via size property
    const attachments: ParsedEmailAttachment[] = [
      {
        fileName: 'huge-file.pdf',
        contentType: 'application/pdf',
        content: oversizedBuffer,
        size: MAX_SINGLE_ATTACHMENT_BYTES + 1024, // 25 MB + 1 KB
        isInline: false,
      },
    ];

    const results = await service.processAndStoreAttachments(TENANT_A, MESSAGE_ID, attachments);

    expect(results[0].isQuarantined).toBe(true);
  });

  it('4. should quarantine attachments when aggregate size exceeds the 35 MB email limit', async () => {
    const attachments: ParsedEmailAttachment[] = [
      {
        fileName: 'doc1.pdf',
        contentType: 'application/pdf',
        content: Buffer.from([0x25, 0x50, 0x44, 0x46]),
        size: 20 * 1024 * 1024, // 20 MB
        isInline: false,
      },
      {
        fileName: 'doc2.pdf',
        contentType: 'application/pdf',
        content: Buffer.from([0x25, 0x50, 0x44, 0x46]),
        size: 20 * 1024 * 1024, // 20 MB (total 40 MB > 35 MB limit)
        isInline: false,
      },
    ];

    const results = await service.processAndStoreAttachments(TENANT_A, MESSAGE_ID, attachments);

    expect(results[0].isQuarantined).toBe(true);
    expect(results[1].isQuarantined).toBe(true);
  });

  it('5. should preserve inline CID attributes for embedded email images', async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const attachments: ParsedEmailAttachment[] = [
      {
        fileName: 'logo.png',
        contentType: 'image/png',
        content: pngBuffer,
        size: pngBuffer.length,
        contentId: 'logo_image_cid',
        isInline: true,
      },
    ];

    const results = await service.processAndStoreAttachments(TENANT_A, MESSAGE_ID, attachments);

    expect(results[0].isInline).toBe(true);
    expect(results[0].contentId).toBe('logo_image_cid');
  });

  it('6. should enforce tenant isolation and block cross-tenant signed URL generation', async () => {
    const tenantAKey = `tenants/${TENANT_A}/emails/${MESSAGE_ID}/att_123_doc.pdf`;

    // Access from correct tenant succeeds
    const url = await service.getSignedUrl(TENANT_A, tenantAKey);
    expect(url).toContain(tenantAKey);

    // Cross-tenant access from Tenant B MUST be rejected with ForbiddenException
    await expect(service.getSignedUrl(TENANT_B, tenantAKey)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
