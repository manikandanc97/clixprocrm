import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailHtmlSanitizerService {
  /**
   * Sanitizes untrusted inbound HTML against stored XSS attacks,
   * script injection, event handlers, and malicious URI schemes,
   * while preserving rich email formatting, safe inline styles, and inline CID images.
   */
  sanitize(rawHtml: string | null | undefined): string {
    if (!rawHtml || typeof rawHtml !== 'string') {
      return '';
    }

    let cleaned = rawHtml;

    // 1. Remove dangerous paired tags and all their inner contents
    const dangerousPairedTags = ['script', 'iframe', 'object', 'embed', 'applet', 'form', 'textarea', 'select', 'button'];
    for (const tag of dangerousPairedTags) {
      const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }

    // 2. Remove dangerous self-closing / single tags
    cleaned = cleaned.replace(/<(meta|base|link|input|frame|frameset|head|title)\b[^>]*\/?>/gi, '');
    cleaned = cleaned.replace(/<\/(meta|base|link|input|frame|frameset|head|title)>/gi, '');

    // 3. Remove inline event handlers (onload, onerror, onclick, onmouseover, onfocus, etc.)
    cleaned = cleaned.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

    // 4. Remove dangerous URI schemes in href, src, action, etc.
    cleaned = cleaned.replace(
      /\b(href|src|action|formaction|background|poster)\s*=\s*(["'])\s*(?:(?:javascript|vbscript|livescript)\s*:|data\s*:\s*(?:text\/html|image\/svg\+xml))[^"']*\2/gi,
      '$1="about:blank"',
    );
    cleaned = cleaned.replace(
      /\b(href|src|action|formaction|background|poster)\s*=\s*(?:(?:javascript|vbscript|livescript)\s*:|data\s*:\s*(?:text\/html|image\/svg\+xml))[^\s>]+/gi,
      '$1="about:blank"',
    );

    // 5. Clean CSS expressions and dangerous functions in style attributes
    cleaned = cleaned.replace(/\bstyle\s*=\s*(["'])(.*?)\1/gi, (match, quote, styleContent) => {
      let safeStyle = styleContent
        .replace(/expression\s*\([^)]*\)/gi, '')
        .replace(/url\s*\(\s*['"]?\s*(?:javascript|vbscript|data\s*:\s*text\/html):[^)]*\)/gi, '')
        .replace(/-moz-binding/gi, '')
        .replace(/@import/gi, '');
      return `style=${quote}${safeStyle}${quote}`;
    });

    // 6. Ensure links open in a new tab securely (target="_blank" rel="noopener noreferrer")
    cleaned = cleaned.replace(/<a\b([^>]*)>/gi, (match, attributes) => {
      let attrs = attributes;
      if (!/\btarget\s*=/i.test(attrs)) {
        attrs += ' target="_blank"';
      } else {
        attrs = attrs.replace(/\btarget\s*=\s*(["'])?[^"'\s>]+(\1)?/i, 'target="_blank"');
      }

      if (!/\brel\s*=/i.test(attrs)) {
        attrs += ' rel="noopener noreferrer"';
      } else {
        attrs = attrs.replace(/\brel\s*=\s*(["'])?[^"'\s>]+(\1)?/i, 'rel="noopener noreferrer"');
      }

      return `<a${attrs}>`;
    });

    // 7. Neutralize any lingering protocol injection tokens
    cleaned = cleaned.replace(/(javascript|vbscript|data\s*:\s*text\/html):/gi, 'blocked:');

    return cleaned;
  }

  /**
   * Generates a plain-text snippet for email thread lists and previews (up to maxLength chars).
   */
  generateSnippet(text: string | null | undefined, html: string | null | undefined, maxLength = 160): string {
    if (text && text.trim().length > 0) {
      return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
    }

    if (html && html.trim().length > 0) {
      // Strip all HTML tags
      let stripped = html.replace(/<[^>]+>/g, ' ');
      // Decode basic HTML entities
      stripped = stripped
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'");

      return stripped.replace(/\s+/g, ' ').trim().slice(0, maxLength);
    }

    return '';
  }
}
