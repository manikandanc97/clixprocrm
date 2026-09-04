import { BaseJobPayload } from './job-payloads';

/**
 * Constants for Import Job Names in ClixProCRM BullMQ Queue.
 */
export const IMPORT_JOB_NAMES = {
  LEADS_BULK_IMPORT: 'leads-bulk-import',
} as const;

export type ImportJobName = (typeof IMPORT_JOB_NAMES)[keyof typeof IMPORT_JOB_NAMES];

/**
 * Represents a single normalized lead row in a bulk import payload.
 * Strictly lightweight properties only. No raw files, buffers, or base64 data.
 */
export interface LeadsBulkImportRow {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  value?: number | string;
  valueAmount?: number | string;
  stage?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  [key: string]: any;
}

/**
 * Payload for Leads Bulk Import jobs.
 * Extends BaseJobPayload to enforce multi-tenant isolation, tracing, and idempotency.
 */
export interface LeadsBulkImportJobPayload extends BaseJobPayload {
  leads: LeadsBulkImportRow[];
  duplicateStrategy: 'skip' | 'update' | 'create';
  importBatchId?: string;
}

/**
 * Union of all supported import job payloads in ClixProCRM.
 */
export type ImportJobPayload = LeadsBulkImportJobPayload;
