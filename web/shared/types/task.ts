// task types

import { MetricCardType } from "./common";

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  createdAt?: string;
}

export interface TaskUserRef {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
  role?: string;
  department?: string | null;
}

export interface TaskRelationRef {
  id: string;
  name: string;
  company?: string;
  email?: string;
  title?: string;
  quoteNumber?: string;
  amount?: number;
}

export interface TaskTimelineEvent {
  id: string;
  action: string;
  description?: string;
  createdAt: string;
  user?: { name: string };
  metadata?: Record<string, unknown>;
}

export interface TaskHistoryLog {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
  assignedTo?: string;
  previousAssignee?: string;
  details?: Record<string, unknown>;
}

export interface TaskType {
  id: string;
  tenantId: string;
  title: string;
  description?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED" | "OVERDUE";
  priority: "HIGH" | "MEDIUM" | "LOW" | "URGENT";
  dueDate?: string | null;
  dueDateValue?: string | null;
  reminderDate?: string | null;
  assignedToId?: string | null;
  createdById?: string | null;
  relatedLeadId?: string | null;
  relatedCustomerId?: string | null;
  relatedMeetingId?: string | null;
  relatedQuotationId?: string | null;
  tags: string[];
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  completedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined relations
  assignedTo?: TaskUserRef | null;
  createdBy?: TaskUserRef | null;
  relatedLead?: TaskRelationRef | null;
  relatedCustomer?: TaskRelationRef | null;
  relatedMeeting?: TaskRelationRef | null;
  relatedQuotation?: TaskRelationRef | null;

  // Calculated CRM fields
  isOverdue?: boolean;
  progress?: number;
  subtaskCount?: { total: number; completed: number };

  // Legacy UI metadata fields
  category?: string;
  timeTracked?: string;
  estimatedTime?: string;
  lastActivity?: string;
  notesCount?: number;
  attachmentsCount?: number;
  isUrgent?: boolean;
  collaborators?: { id: string; name: string }[];
  aiPriorityScore?: number;
  aiSummary?: string;
  timelineEvents?: TaskTimelineEvent[];
}

export interface TaskDashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  blocked: number;
  dueToday: number;
  completionRate: number;
}

export interface TasksDataType {
  stats: MetricCardType[];
  dashboardStats?: TaskDashboardStats;
  tasks: TaskType[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}











