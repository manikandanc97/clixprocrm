import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './services/support.service';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-mail-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

describe('SupportService Security - HTML Injection Prevention', () => {
  let service: SupportService;

  beforeEach(async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'support@example.com';
    process.env.SUPPORT_EMAIL = 'security-team@clixprocrm.com';

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportService],
    }).compile();

    service = module.get<SupportService>(SupportService);
    jest.clearAllMocks();
  });

  it('CRITICAL: Sanitizes and escapes malicious HTML payload in subject, description, and diagnostics', async () => {
    const maliciousPayload = {
      subject: '<script>alert("XSS")</script>Urgent Help',
      category: '<img src=x onerror=alert(1)>',
      priority: 'High',
      description:
        '<iframe src="https://evil.com"></iframe>Please help with login',
      diagnostics: {
        currentUserName: '<b onmouseover="alert(1)">Admin</b>',
        email: 'user@example.com<script>',
      },
      attachments: [],
    };

    await service.sendSupportTicket(
      maliciousPayload.subject,
      maliciousPayload.category,
      maliciousPayload.priority,
      maliciousPayload.description,
      maliciousPayload.diagnostics,
      maliciousPayload.attachments,
    );

    expect(mockSendMail).toHaveBeenCalled();
    const mailOptions = mockSendMail.mock.calls[0][0];

    // Ensure raw HTML tags are escaped
    expect(mailOptions.html).not.toContain('<script>alert("XSS")</script>');
    expect(mailOptions.html).toContain(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
    );
    expect(mailOptions.html).not.toContain('<iframe src="https://evil.com">');
    expect(mailOptions.html).toContain(
      '&lt;iframe src=&quot;https://evil.com&quot;&gt;',
    );
    expect(mailOptions.to).toBe('security-team@clixprocrm.com');
  });
});
