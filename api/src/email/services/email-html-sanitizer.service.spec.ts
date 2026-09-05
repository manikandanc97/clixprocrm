import { EmailHtmlSanitizerService } from './email-html-sanitizer.service';

describe('EmailHtmlSanitizerService Suite', () => {
  let sanitizer: EmailHtmlSanitizerService;

  beforeEach(() => {
    sanitizer = new EmailHtmlSanitizerService();
  });

  it('1. should strip script tags and executable JavaScript', () => {
    const maliciousHtml = `
      <div>
        <p>Legitimate content</p>
        <script>alert('xss vulnerability')</script>
        <script type="text/javascript">document.location='http://attacker.com'</script>
      </div>
    `;

    const sanitized = sanitizer.sanitize(maliciousHtml);

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('alert(');
    expect(sanitized).not.toContain('attacker.com');
    expect(sanitized).toContain('<p>Legitimate content</p>');
  });

  it('2. should strip inline event handlers (onload, onerror, onclick, onmouseover)', () => {
    const maliciousHtml = `
      <img src="valid.jpg" onerror="alert('xss')" onload="fetch('http://evil.com')" />
      <a href="https://example.com" onclick="stealCookies()" onmouseover="trackUser()">Click me</a>
      <body onfocus="maliciousCode()">Body content</body>
    `;

    const sanitized = sanitizer.sanitize(maliciousHtml);

    expect(sanitized).not.toContain('onerror=');
    expect(sanitized).not.toContain('onload=');
    expect(sanitized).not.toContain('onclick=');
    expect(sanitized).not.toContain('onmouseover=');
    expect(sanitized).not.toContain('onfocus=');
    expect(sanitized).toContain('Click me');
  });

  it('3. should neutralize dangerous protocol links (javascript:, vbscript:, data:text/html)', () => {
    const maliciousHtml = `
      <a href="javascript:alert(1)">Exploit 1</a>
      <a href="vbscript:msgbox(1)">Exploit 2</a>
      <a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Exploit 3</a>
      <a href="https://safe.example.com">Safe Link</a>
    `;

    const sanitized = sanitizer.sanitize(maliciousHtml);

    expect(sanitized).not.toContain('href="javascript:');
    expect(sanitized).not.toContain('href="vbscript:');
    expect(sanitized).not.toContain('href="data:text/html');
    expect(sanitized).toContain('href="https://safe.example.com"');
  });

  it('4. should preserve inline CID image references (cid:...) for rich emails', () => {
    const emailHtml = `
      <div>
        <h2>Invoice Details</h2>
        <img src="cid:company_logo_123" alt="Company Logo" width="200" />
        <img src="https://cdn.example.com/banner.png" alt="Banner" />
      </div>
    `;

    const sanitized = sanitizer.sanitize(emailHtml);

    expect(sanitized).toContain('src="cid:company_logo_123"');
    expect(sanitized).toContain('src="https://cdn.example.com/banner.png"');
    expect(sanitized).toContain('Invoice Details');
  });

  it('5. should enforce target="_blank" and rel="noopener noreferrer" on external links', () => {
    const htmlWithLinks = `
      <p>Check out our <a href="https://partner.com">partner site</a>.</p>
    `;

    const sanitized = sanitizer.sanitize(htmlWithLinks);

    expect(sanitized).toContain('target="_blank"');
    expect(sanitized).toContain('rel="noopener noreferrer"');
    expect(sanitized).toContain('href="https://partner.com"');
  });

  it('6. should clean CSS expressions and dangerous protocols from style attributes', () => {
    const htmlWithStyles = `
      <div style="color: red; width: expression(alert(1)); background: url('javascript:alert(2)'); font-size: 14px;">
        Styled Content
      </div>
    `;

    const sanitized = sanitizer.sanitize(htmlWithStyles);

    expect(sanitized).not.toContain('expression(');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('color: red;');
    expect(sanitized).toContain('font-size: 14px;');
  });

  it('7. should generate clean plain-text snippets truncated to maxLength', () => {
    const richHtml = `
      <div style="font-family: sans-serif;">
        <h1 style="color: blue;">Welcome to ClixProCRM!</h1>
        <p>We are delighted to welcome you to our platform. Let us know if you have questions.</p>
      </div>
    `;

    const snippet = sanitizer.generateSnippet(null, richHtml, 60);

    expect(snippet.length).toBeLessThanOrEqual(60);
    expect(snippet).not.toContain('<h1');
    expect(snippet).not.toContain('<p');
    expect(snippet).toContain('Welcome to ClixProCRM!');
  });
});
