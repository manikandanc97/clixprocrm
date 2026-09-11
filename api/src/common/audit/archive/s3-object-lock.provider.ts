import * as crypto from 'crypto';
import {
  AuditArchiveProvider,
  CanonicalAuditArchiveRecord,
  PutArchiveResult,
  HeadArchiveResult,
} from './audit-archive.interface';
import { Logger } from '@nestjs/common';

export interface S3ObjectLockConfig {
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  retentionDays: number;
}

/**
 * Builds the deterministic object key for an audit record.
 * Pattern: audit/{scope}/{YYYY}/{MM}/{DD}/{recordId}.json
 */
export function buildAuditObjectKey(
  recordId: string,
  tenantId: string | null,
  createdAt: Date | string,
): string {
  const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const scope = tenantId ? `tenant/${tenantId}` : 'platform';
  return `audit/${scope}/${year}/${month}/${day}/${recordId}.json`;
}

export class S3ObjectLockProvider implements AuditArchiveProvider {
  private readonly logger = new Logger(S3ObjectLockProvider.name);
  private readonly inMemoryStorage = new Map<
    string,
    { data: CanonicalAuditArchiveRecord; retainUntil: Date }
  >();

  constructor(private readonly config: S3ObjectLockConfig) {}

  /**
   * Uploads an audit record with S3 Object Lock in COMPLIANCE mode.
   * If static AWS credentials are not configured, uses in-memory WORM simulation.
   */
  async putObject(
    key: string,
    record: CanonicalAuditArchiveRecord,
    retentionDays: number,
  ): Promise<PutArchiveResult> {
    const days = Math.max(1, retentionDays || this.config.retentionDays || 365);
    const retainUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // If AWS credentials exist, perform SigV4 PUT to S3 with Object Lock headers
    if (
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.bucket
    ) {
      try {
        const payloadStr = JSON.stringify(record);
        const host = `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
        const url = `https://${host}/${key}`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-amz-server-side-encryption': 'AES256',
          'x-amz-object-lock-mode': 'COMPLIANCE',
          'x-amz-object-lock-retain-until-date': retainUntil.toISOString(),
          'x-amz-meta-record-id': record.record.id,
          'x-amz-meta-record-hash': record.record.recordHash,
          'x-amz-meta-chain-scope': record.chainScope,
          'x-amz-meta-archive-version': record.archiveVersion,
        };

        const signedHeaders = this.signAwsRequest(
          'PUT',
          `/${key}`,
          headers,
          payloadStr,
        );

        const response = await fetch(url, {
          method: 'PUT',
          headers: signedHeaders,
          body: payloadStr,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(
            `S3 Object Lock upload failed with status ${response.status}: ${errText}`,
          );
        }

        const etag = response.headers.get('etag') || undefined;
        const versionId = response.headers.get('x-amz-version-id') || undefined;

        return { objectKey: key, versionId, etag };
      } catch (err: any) {
        this.logger.error(
          `S3 Object Lock upload error for ${key}: ${err?.message || err}`,
        );
        throw err;
      }
    }

    // In-memory compliance storage for test/development environments
    if (this.inMemoryStorage.has(key)) {
      const existing = this.inMemoryStorage.get(key)!;
      if (existing.retainUntil > new Date()) {
        if (existing.data.record.recordHash === record.record.recordHash) {
          return { objectKey: key };
        }
        throw new Error(
          `S3 Object Lock compliance violation: cannot overwrite immutable object ${key}`,
        );
      }
    }

    this.inMemoryStorage.set(key, { data: record, retainUntil });
    return { objectKey: key };
  }

  async getObject(key: string): Promise<CanonicalAuditArchiveRecord | null> {
    if (
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.bucket
    ) {
      try {
        const host = `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
        const url = `https://${host}/${key}`;
        const headers = this.signAwsRequest('GET', `/${key}`, {}, '');

        const response = await fetch(url, { method: 'GET', headers });
        if (response.status === 404) return null;
        if (!response.ok) {
          throw new Error(`S3 GET failed with status ${response.status}`);
        }
        return await response.json();
      } catch (err: any) {
        this.logger.error(
          `S3 getObject error for ${key}: ${err?.message || err}`,
        );
        throw err;
      }
    }

    const stored = this.inMemoryStorage.get(key);
    return stored ? JSON.parse(JSON.stringify(stored.data)) : null;
  }

  async headObject(key: string): Promise<HeadArchiveResult> {
    if (
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.bucket
    ) {
      try {
        const host = `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
        const url = `https://${host}/${key}`;
        const headers = this.signAwsRequest('HEAD', `/${key}`, {}, '');

        const response = await fetch(url, { method: 'HEAD', headers });
        if (response.status === 404) return { exists: false };
        if (!response.ok) {
          throw new Error(`S3 HEAD failed with status ${response.status}`);
        }

        const recordHash =
          response.headers.get('x-amz-meta-record-hash') || undefined;
        return { exists: true, recordHash };
      } catch (err: any) {
        this.logger.error(
          `S3 headObject error for ${key}: ${err?.message || err}`,
        );
        throw err;
      }
    }

    const stored = this.inMemoryStorage.get(key);
    if (!stored) return { exists: false };
    return {
      exists: true,
      recordHash: stored.data.record.recordHash,
      metadata: {
        'record-hash': stored.data.record.recordHash,
        'record-id': stored.data.record.id,
      },
    };
  }

  /**
   * Generates AWS Signature Version 4 headers for standard S3 REST calls.
   */
  private signAwsRequest(
    method: string,
    canonicalUri: string,
    headers: Record<string, string>,
    payload: string,
  ): Record<string, string> {
    const accessKey = this.config.accessKeyId || '';
    const secretKey = this.config.secretAccessKey || '';
    const region = this.config.region || 'us-east-1';
    const service = 's3';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const host = `${this.config.bucket}.s3.${region}.amazonaws.com`;

    const payloadHash = crypto
      .createHash('sha256')
      .update(payload, 'utf8')
      .digest('hex');

    const allHeaders: Record<string, string> = {
      ...headers,
      host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
    };

    const sortedHeaderKeys = Object.keys(allHeaders).sort();
    const canonicalHeaders = sortedHeaderKeys
      .map((k) => `${k.toLowerCase()}:${allHeaders[k].trim()}\n`)
      .join('');
    const signedHeaders = sortedHeaderKeys
      .map((k) => k.toLowerCase())
      .join(';');

    const canonicalRequest = [
      method,
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto
      .createHmac('sha256', `AWS4${secretKey}`)
      .update(dateStamp)
      .digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto
      .createHmac('sha256', kRegion)
      .update(service)
      .digest();
    const kSigning = crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest();
    const signature = crypto
      .createHmac('sha256', kSigning)
      .update(stringToSign)
      .digest('hex');

    const authHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...allHeaders,
      Authorization: authHeader,
    };
  }
}
