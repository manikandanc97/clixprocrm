/**
 * @file shared/lib/api/leads.api.ts
 * Leads-related API endpoints.
 */
import client from "./client";
import { ApiResponseType } from "@/shared/types/api";
import {
  LeadsDataType,
  LeadType,
  NoteType,
  TimelineEventType,
  AttachmentType,
} from "@/shared/types/lead";
import { MeetingType } from "@/shared/types/meeting";

async function unwrapResponse<T>(request: Promise<{ data: ApiResponseType<T> }>) {
  try {
    const response = await request;
    if (!response.data?.success || response.data.data === undefined) {
      throw new Error(response.data?.message || "Invalid API response.");
    }
    return response.data.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: unknown } } };
    const msg = err?.response?.data?.message;
    if (msg) {
      if (typeof msg === 'string') throw new Error(msg);
      else if (typeof msg === 'object' && msg !== null) {
        throw new Error((msg as { message?: string }).message || JSON.stringify(msg));
      }
    }
    throw error;
  }
}

export interface LeadsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  status?: string;
}

export function fetchLeadsData(params?: LeadsQueryParams) {
  return unwrapResponse<LeadsDataType>(client.get("/crm/leads", { params }));
}

export function createLead(data: Partial<LeadType>) {
  return unwrapResponse<LeadType>(client.post("/crm/leads", data));
}

export function updateLead(id: string, data: Partial<LeadType>) {
  return unwrapResponse<LeadType>(client.patch(`/crm/leads/${id}`, data));
}

export function deleteLead(id: string) {
  return unwrapResponse<{ id: string }>(client.delete(`/crm/leads/${id}`));
}

export function bulkDeleteLeads(ids: string[]) {
  return unwrapResponse<{ count: number }>(client.post("/crm/leads/bulk", { ids }));
}

export function fetchLeadNotes(leadId: string) {
  return unwrapResponse<NoteType[]>(client.get(`/crm/leads/${leadId}/notes`));
}

export function createLeadNote(
  leadId: string,
  data: Partial<NoteType> | { message: string; title?: string }
) {
  return unwrapResponse<NoteType>(client.post(`/crm/leads/${leadId}/notes`, data));
}

export function fetchLeadTimeline(leadId: string) {
  return unwrapResponse<TimelineEventType[]>(client.get(`/crm/leads/${leadId}/timeline`));
}

export function createLeadTimelineEvent(
  leadId: string,
  data: Partial<TimelineEventType> | { action: string; description?: string }
) {
  return unwrapResponse<TimelineEventType>(client.post(`/crm/leads/${leadId}/timeline`, data));
}

export function fetchLeadAttachments(leadId: string) {
  return unwrapResponse<AttachmentType[]>(client.get(`/crm/leads/${leadId}/attachments`));
}

export function createLeadAttachment(leadId: string, data: Partial<AttachmentType>) {
  return unwrapResponse<AttachmentType>(client.post(`/crm/leads/${leadId}/attachments`, data));
}

export async function uploadLeadAttachment(
  leadId: string,
  fileOrData: File | { fileData: string; fileName: string; fileType?: string }
) {
  if (fileOrData instanceof File) {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrData);
    });

    return unwrapResponse<AttachmentType>(
      client.post(`/crm/leads/${leadId}/attachments`, {
        fileData: base64Data,
        fileName: fileOrData.name,
        fileType: fileOrData.type,
      })
    );
  }

  return unwrapResponse<AttachmentType>(
    client.post(`/crm/leads/${leadId}/attachments`, fileOrData)
  );
}

export function deleteLeadAttachment(leadId: string, attachmentId: string) {
  return unwrapResponse<{ success: boolean; id: string }>(
    client.delete(`/crm/leads/${leadId}/attachments/${attachmentId}`)
  );
}

export function fetchLeadMeetings(leadId: string) {
  return unwrapResponse<MeetingType[]>(client.get(`/crm/leads/${leadId}/meetings`));
}

export function createLeadMeeting(leadId: string, data: Partial<MeetingType>) {
  return unwrapResponse<MeetingType>(client.post(`/crm/leads/${leadId}/meetings`, data));
}

