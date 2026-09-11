/**
 * Strips script tags, javascript: URLs, dangerous attributes, and HTML injection payloads.
 */
export function sanitizeXss(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // 1. Remove <script> tags and content
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );

  // 2. Remove <iframe>, <object>, <embed>, <applet>, <form>, <base>, <link>, <meta> tags
  sanitized = sanitized.replace(
    /<(iframe|object|embed|applet|form|base|link|meta)\b[^>]*>/gi,
    '',
  );
  sanitized = sanitized.replace(
    /<\/(iframe|object|embed|applet|form|base|link|meta)>/gi,
    '',
  );

  // 3. Remove inline event handlers like onload, onerror, onclick, onmouseover, etc.
  sanitized = sanitized.replace(
    /\s*on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi,
    '',
  );

  // 4. Remove javascript:, vbscript:, data:text/html protocol links
  sanitized = sanitized.replace(
    /(javascript|vbscript|data\s*:\s*text\/html):/gi,
    'blocked:',
  );

  return sanitized;
}

/**
 * Recursively sanitizes string properties in an object or array.
 */
export function sanitizeObjectXss<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeXss(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectXss(item)) as unknown as T;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeXss(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObjectXss(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
