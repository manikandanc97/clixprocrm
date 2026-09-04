/**
 * Central Queue Constants for ClixProCRM BullMQ Infrastructure.
 *
 * All queue names must be defined here to avoid magic strings and ensure consistent
 * queue topology across producers and future worker processors.
 */

export const QUEUE_NAMES = {
  EMAIL: 'crm-email-queue',
  IMPORT: 'crm-import-queue',
  WEBHOOK: 'crm-webhook-queue',
  MEDIA: 'crm-media-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
