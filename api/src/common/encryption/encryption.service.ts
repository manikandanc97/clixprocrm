import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * @file common/encryption/encryption.service.ts
 *
 * Centralized AES-256-GCM field-level encryption service.
 *
 * KEY SECURITY RULES enforced here:
 *  - Key is ONLY read from environment (FIELD_ENCRYPTION_KEY).
 *  - Application fails fast on startup if the key is missing or wrong length.
 *  - Keys are never logged, never sent to the frontend, never stored in DB.
 *  - Decrypted values are never logged.
 *  - Encryption is transparent: callers pass/receive plain strings.
 *
 * CIPHERTEXT FORMAT (base64-encoded):
 *   <12-byte IV> | <N-byte ciphertext> | <16-byte auth-tag>
 *   All concatenated and base64-encoded as a single string.
 *
 * LOOKUP HASH:
 *   HMAC-SHA256(key=HMAC_SALT, data=normalize(value))
 *   Used for deterministic exact-match lookups on encrypted columns.
 *   Stored in separate *Hash columns in DB.
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly ALGO = 'aes-256-gcm';
  private readonly IV_LEN = 12;
  private readonly TAG_LEN = 16;
  private encKey!: Buffer<ArrayBufferLike>;
  private hmacKey!: Buffer<ArrayBufferLike>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const raw = this.configService.get<string>('FIELD_ENCRYPTION_KEY');
    if (!raw) {
      throw new InternalServerErrorException(
        '[EncryptionService] FIELD_ENCRYPTION_KEY environment variable is not set. ' +
          'Application cannot start without an encryption key. ' +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }

    // Derive two separate 32-byte keys from the master key via HKDF
    const masterKey = Buffer.from(raw, 'hex');
    if (masterKey.length !== 32) {
      throw new InternalServerErrorException(
        '[EncryptionService] FIELD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ' +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }

    // hkdfSync returns ArrayBuffer — wrap in Buffer for use with crypto APIs
    this.encKey = Buffer.from(
      crypto.hkdfSync(
        'sha256',
        masterKey,
        'clixprocrm-enc',
        'field-encryption-v1',
        32,
      ),
    );
    this.hmacKey = Buffer.from(
      crypto.hkdfSync(
        'sha256',
        masterKey,
        'clixprocrm-enc',
        'field-hmac-v1',
        32,
      ),
    );
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM.
   * Returns null/undefined passthrough for null/undefined/empty inputs.
   */
  encrypt(plaintext: string | null | undefined): string | null {
    if (plaintext === null || plaintext === undefined || plaintext === '') {
      return plaintext ?? null;
    }

    const iv = crypto.randomBytes(this.IV_LEN);
    const cipher = crypto.createCipheriv(this.ALGO, this.encKey, iv, {
      authTagLength: this.TAG_LEN,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Format: iv(12) + ciphertext(N) + tag(16), all base64
    return Buffer.concat([iv, encrypted, tag]).toString('base64');
  }

  /**
   * Decrypts an AES-256-GCM ciphertext string.
   * Returns null/undefined passthrough for null/undefined/empty inputs.
   * Returns the original value unchanged if it doesn't look like ciphertext
   * (safety fallback during migration window — plaintext records not yet encrypted).
   */
  decrypt(ciphertext: string | null | undefined): string | null {
    if (ciphertext === null || ciphertext === undefined || ciphertext === '') {
      return ciphertext ?? null;
    }

    try {
      const buf = Buffer.from(ciphertext, 'base64');
      const minLen = this.IV_LEN + this.TAG_LEN + 1;
      if (buf.length < minLen) {
        // Not encrypted yet (migration fallback) — return as-is
        return ciphertext;
      }

      const iv = buf.subarray(0, this.IV_LEN);
      const tag = buf.subarray(buf.length - this.TAG_LEN);
      const encrypted = buf.subarray(this.IV_LEN, buf.length - this.TAG_LEN);

      const decipher = crypto.createDecipheriv(this.ALGO, this.encKey, iv, {
        authTagLength: this.TAG_LEN,
      });
      decipher.setAuthTag(tag);

      return decipher.update(encrypted) + decipher.final('utf8');
    } catch {
      // If decryption fails (e.g. plaintext not yet migrated), return as-is.
      // This ensures the migration window is safe.
      return ciphertext;
    }
  }

  /**
   * Computes a deterministic HMAC-SHA256 hash for exact-match DB lookups.
   * Input is normalized (trimmed + lowercased) for case-insensitive matching.
   * Returns null for null/undefined/empty inputs.
   */
  hash(value: string | null | undefined): string | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    return crypto
      .createHmac('sha256', this.hmacKey)
      .update(normalized, 'utf8')
      .digest('hex');
  }

  /**
   * Encrypts a value and returns both the ciphertext and the lookup hash.
   * Use this when you need to store an encrypted field that also supports
   * exact-match lookups via a *Hash column.
   */
  encryptWithHash(value: string | null | undefined): {
    encrypted: string | null;
    hash: string | null;
  } {
    return {
      encrypted: this.encrypt(value),
      hash: this.hash(value),
    };
  }

  /**
   * Decrypts an array of string fields on an object in-place.
   * Returns the same object reference (mutates).
   * Safe to call with a partial field list.
   */
  decryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
    for (const field of fields) {
      if (obj[field] !== undefined) {
        (obj as any)[field] = this.decrypt(obj[field]);
      }
    }
    return obj;
  }

  /**
   * Decrypts an array of objects in-place.
   */
  decryptMany<T extends Record<string, any>>(
    items: T[],
    fields: (keyof T)[],
  ): T[] {
    return items.map((item) => this.decryptFields(item, fields));
  }
}
