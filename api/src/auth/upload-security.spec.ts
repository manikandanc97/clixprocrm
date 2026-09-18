import {
    sanitizeUploadedFilename,
    validateFileMagicBytes,
    validateUploadedFile,
} from '../common/utils/upload-security.util';

describe('P5 File Upload Security & Magic Byte Suite', () => {
  describe('1. Filename & Path Traversal Sanitization', () => {
    it('strips directory traversal sequences', () => {
      expect(sanitizeUploadedFilename('../../../etc/passwd')).toBe('passwd');
      expect(
        sanitizeUploadedFilename('..\\..\\windows\\system32\\calc.exe'),
      ).toBe('calc.exe');
      expect(sanitizeUploadedFilename('uploads/../../secret.pdf')).toBe(
        'secret.pdf',
      );
    });

    it('strips null bytes and control characters', () => {
      expect(sanitizeUploadedFilename('image\0.png')).toBe('image.png');
      expect(sanitizeUploadedFilename('document\x00.pdf')).toBe('document.pdf');
    });

    it('sanitizes unsafe characters to underscores', () => {
      expect(sanitizeUploadedFilename('my report<script>?.pdf')).toBe(
        'my_report_script__.pdf',
      );
    });
  });

  describe('2. Dangerous & Executable Extensions', () => {
    it('rejects executable extensions', () => {
      const exes = [
        'payload.exe',
        'script.sh',
        'batch.bat',
        'shell.php',
        'backdoor.py',
        'code.ps1',
      ];
      for (const f of exes) {
        const res = validateUploadedFile({
          filename: f,
          mimeType: 'application/octet-stream',
          size: 1024,
        });
        expect(res.safe).toBe(false);
        expect(res.error).toContain('strictly disallowed');
      }
    });

    it('allows valid document and image extensions', () => {
      const allowed = ['report.pdf', 'photo.jpg', 'avatar.png', 'data.csv'];
      for (const f of allowed) {
        const res = validateUploadedFile({
          filename: f,
          mimeType: f.endsWith('.pdf')
            ? 'application/pdf'
            : f.endsWith('.jpg')
              ? 'image/jpeg'
              : 'image/png',
          size: 1024,
        });
        expect(res.safe).toBe(true);
      }
    });
  });

  describe('3. Magic Byte Verification', () => {
    it('validates authentic PNG magic header', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const res = validateFileMagicBytes(pngBuffer, 'image/png');
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/png');
    });

    it('validates authentic JPEG magic header', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = validateFileMagicBytes(jpegBuffer, 'image/jpeg');
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('image/jpeg');
    });

    it('validates authentic PDF magic header', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\n%...');
      const res = validateFileMagicBytes(pdfBuffer, 'application/pdf');
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe('application/pdf');
    });

    it('rejects disguised executable masquerading as PNG', () => {
      const fakePng = Buffer.from('MZ\x90\x00\x03\x00\x00\x00'); // Windows PE header
      const res = validateFileMagicBytes(fakePng, 'image/png');
      expect(res.valid).toBe(false);
    });
  });

  describe('4. File Size Limits', () => {
    it('rejects files exceeding maximum limit', () => {
      const res = validateUploadedFile({
        filename: 'huge_video.pdf',
        mimeType: 'application/pdf',
        size: 50 * 1024 * 1024, // 50MB
        maxSizeBytes: 25 * 1024 * 1024, // 25MB limit
      });
      expect(res.safe).toBe(false);
      expect(res.error).toContain('exceeds maximum limit');
    });
  });
});
