import * as path from 'path';

export const DISALLOWED_EXTENSIONS = new Set([
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.ps1',
  '.vbs',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.py',
  '.pyc',
  '.php',
  '.phtml',
  '.phar',
  '.jsp',
  '.asp',
  '.aspx',
  '.cgi',
  '.pl',
  '.jar',
  '.war',
  '.elf',
  '.bin',
  '.com',
  '.scr',
  '.msi',
  '.reg',
  '.hta',
  '.cpl',
]);

export const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.pdf',
  '.csv',
  '.txt',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
  '.json',
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.mkv',
  '.m4v',
]);

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-m4v',
]);

/**
 * Sanitizes a user-provided filename to prevent path traversal and null-byte injection.
 */
export function sanitizeUploadedFilename(rawFilename: string): string {
  if (!rawFilename) return `upload_${Date.now()}`;

  // Strip null bytes and control chars
  let cleaned = rawFilename.replace(/[\0\x00-\x1F\x7F]/g, '');

  // Extract basename to eliminate path traversal ../ or ..\
  cleaned = path.basename(cleaned);

  // Strip invalid file system characters
  cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevent multiple consecutive dots or hidden files
  cleaned = cleaned.replace(/^\.+/, '').replace(/\.{2,}/g, '.');

  return cleaned || `upload_${Date.now()}`;
}

/**
 * Validates file buffer against known magic byte signatures.
 */
export function validateFileMagicBytes(buffer: Buffer, declaredMime: string): { valid: boolean; detectedMime?: string } {
  if (!buffer || buffer.length < 4) {
    return { valid: false };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: declaredMime === 'image/png', detectedMime: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: declaredMime === 'image/jpeg' || declaredMime === 'image/jpg', detectedMime: 'image/jpeg' };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: declaredMime === 'image/gif', detectedMime: 'image/gif' };
  }

  // WebP: RIFF ... WEBP (52 49 46 46 ... 57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: declaredMime === 'image/webp', detectedMime: 'image/webp' };
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: declaredMime === 'application/pdf', detectedMime: 'application/pdf' };
  }

  // ZIP / Office Documents: PK.. (50 4B 03 04 or 50 4B 05 06 or 50 4B 07 08)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return {
      valid:
        declaredMime === 'application/zip' ||
        declaredMime.includes('officedocument') ||
        declaredMime.includes('ms-'),
      detectedMime: 'application/zip',
    };
  }

  // Text/CSV: Check if printable ASCII/UTF-8
  if (declaredMime === 'text/plain' || declaredMime === 'text/csv' || declaredMime === 'application/json') {
    let isText = true;
    const checkLength = Math.min(buffer.length, 512);
    for (let i = 0; i < checkLength; i++) {
      const byte = buffer[i];
      if (byte === 0 || (byte < 7 && byte !== 9 && byte !== 10 && byte !== 13)) {
        isText = false;
        break;
      }
    }
    return { valid: isText, detectedMime: declaredMime };
  }

  // If declared as image/pdf/zip but didn't match magic bytes, reject
  if (
    declaredMime.startsWith('image/') ||
    declaredMime === 'application/pdf' ||
    declaredMime.includes('zip')
  ) {
    return { valid: false };
  }

  return { valid: true, detectedMime: declaredMime };
}

/**
 * Complete file upload security validator.
 */
export function validateUploadedFile(params: {
  filename: string;
  mimeType: string;
  size: number;
  maxSizeBytes?: number;
  buffer?: Buffer;
}): { safe: boolean; sanitizedFilename: string; error?: string } {
  const maxBytes = params.maxSizeBytes || 25 * 1024 * 1024; // 25MB default

  if (params.size > maxBytes) {
    return {
      safe: false,
      sanitizedFilename: sanitizeUploadedFilename(params.filename),
      error: `File size (${params.size} bytes) exceeds maximum limit (${maxBytes} bytes)`,
    };
  }

  const sanitizedFilename = sanitizeUploadedFilename(params.filename);
  const ext = path.extname(sanitizedFilename).toLowerCase();

  if (!ext || DISALLOWED_EXTENSIONS.has(ext)) {
    return {
      safe: false,
      sanitizedFilename,
      error: `Executable or dangerous file extension "${ext}" is strictly disallowed`,
    };
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      safe: false,
      sanitizedFilename,
      error: `File extension "${ext}" is not supported`,
    };
  }

  if (params.mimeType && !ALLOWED_MIME_TYPES.has(params.mimeType.toLowerCase())) {
    return {
      safe: false,
      sanitizedFilename,
      error: `File MIME type "${params.mimeType}" is not supported`,
    };
  }

  if (params.buffer) {
    const magicCheck = validateFileMagicBytes(params.buffer, params.mimeType);
    if (!magicCheck.valid) {
      return {
        safe: false,
        sanitizedFilename,
        error: 'File content does not match declared file signature',
      };
    }
  }

  return { safe: true, sanitizedFilename };
}
