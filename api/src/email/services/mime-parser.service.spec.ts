import { MimeParserService } from './mime-parser.service';

describe('MimeParserService Suite', () => {
  let parser: MimeParserService;

  beforeEach(() => {
    parser = new MimeParserService();
  });

  it('1. should parse a simple plain-text email with Message-ID and headers', async () => {
    const rawMime = [
      'From: "Sender One" <sender@example.com>',
      'To: recipient@example.com',
      'Subject: Plain Text Test',
      'Message-ID: <msg-12345@example.com>',
      'Date: Sat, 05 Sep 2026 10:00:00 +0000',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Hello from plain text email body!',
    ].join('\r\n');

    const result = await parser.parseMime(rawMime);

    expect(result.internetMessageId).toBe('<msg-12345@example.com>');
    expect(result.fromAddress).toBe('sender@example.com');
    expect(result.fromName).toBe('Sender One');
    expect(result.toRecipients).toEqual(['recipient@example.com']);
    expect(result.subject).toBe('Plain Text Test');
    expect(result.bodyPlain.trim()).toBe('Hello from plain text email body!');
    expect(result.attachments).toHaveLength(0);
  });

  it('2. should parse an HTML email with in-reply-to, references, and CC recipients', async () => {
    const rawMime = [
      'From: Alice <alice@example.com>',
      'To: Bob <bob@example.com>',
      'Cc: Charlie <charlie@example.com>',
      'Subject: Re: Project Update',
      'Message-ID: <reply-67890@example.com>',
      'In-Reply-To: <parent-11111@example.com>',
      'References: <root-00000@example.com> <parent-11111@example.com>',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<p>Thank you for the update!</p>',
    ].join('\r\n');

    const result = await parser.parseMime(rawMime);

    expect(result.internetMessageId).toBe('<reply-67890@example.com>');
    expect(result.inReplyTo).toBe('<parent-11111@example.com>');
    expect(result.references).toEqual(['<root-00000@example.com>', '<parent-11111@example.com>']);
    expect(result.toRecipients).toEqual(['bob@example.com']);
    expect(result.ccRecipients).toEqual(['charlie@example.com']);
    expect(result.bodyHtml).toContain('<p>Thank you for the update!</p>');
  });

  it('3. should extract curated transport headers and discard unapproved headers', async () => {
    const rawMime = [
      'From: security@provider.com',
      'To: user@clixprocrm.com',
      'Subject: Transport Headers Test',
      'Message-ID: <auth-results-test@provider.com>',
      'Authentication-Results: mx.google.com; dkim=pass; spf=pass',
      'Received-SPF: pass (google.com: domain of security@provider.com designates 1.2.3.4 as permitted sender)',
      'DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=provider.com; s=2026',
      'Return-Path: <bounce@provider.com>',
      'Auto-Submitted: auto-replied',
      'List-Unsubscribe: <mailto:unsubscribe@provider.com>',
      'X-Internal-Secret: ultra-confidential-token-12345',
      'Authorization: Bearer secret_token_xyz',
      'Content-Type: text/plain',
      '',
      'Header security validation body',
    ].join('\r\n');

    const result = await parser.parseMime(rawMime);

    expect(result.headers['authentication-results']).toContain('dkim=pass');
    expect(result.headers['received-spf']).toContain('pass');
    expect(result.headers['dkim-signature']).toContain('v=1');
    expect(result.headers['return-path']).toContain('bounce@provider.com');
    expect(result.headers['auto-submitted']).toBe('auto-replied');
    expect(result.headers['list-unsubscribe']).toContain('unsubscribe@provider.com');

    // Sensitive / unapproved headers MUST NOT exist
    expect(result.headers['x-internal-secret']).toBeUndefined();
    expect(result.headers['authorization']).toBeUndefined();
  });

  it('4. should extract attachments with CID, contentType, and binary buffer', async () => {
    const boundary = '----Boundary_Test_123';
    const rawMime = [
      'From: dev@example.com',
      'To: user@example.com',
      'Subject: Multipart Email with Attachment',
      'Message-ID: <multipart-test@example.com>',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      'See attached report.',
      `--${boundary}`,
      'Content-Type: text/plain; name="report.txt"',
      'Content-Disposition: attachment; filename="report.txt"',
      'Content-Transfer-Encoding: 7bit',
      '',
      'This is the attached report content.',
      `--${boundary}`,
      'Content-Type: image/png',
      'Content-ID: <logo_cid@clixprocrm>',
      'Content-Disposition: inline; filename="logo.png"',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64'),
      `--${boundary}--`,
    ].join('\r\n');

    const result = await parser.parseMime(rawMime);

    expect(result.attachments).toHaveLength(2);

    const txtAtt = result.attachments.find((a) => a.fileName === 'report.txt');
    expect(txtAtt).toBeDefined();
    expect(txtAtt?.contentType).toBe('text/plain');
    expect(txtAtt?.content.toString('utf8').trim()).toBe('This is the attached report content.');
    expect(txtAtt?.isInline).toBe(false);

    const inlineAtt = result.attachments.find((a) => a.fileName === 'logo.png');
    expect(inlineAtt).toBeDefined();
    expect(inlineAtt?.contentType).toBe('image/png');
    expect(inlineAtt?.contentId).toBe('logo_cid@clixprocrm');
    expect(inlineAtt?.isInline).toBe(true);
  });

  it('5. should handle malformed or empty headers safely without crashing', async () => {
    const rawMime = '\r\n\r\nJust a raw text body without any RFC headers at all.';
    const result = await parser.parseMime(rawMime);

    expect(result.internetMessageId).toBeNull();
    expect(result.fromAddress).toBe('unknown@sender.invalid');
    expect(result.toRecipients).toHaveLength(0);
    expect(result.subject).toBe('(No Subject)');
    expect(result.bodyPlain).toContain('Just a raw text body');
  });
});
