"use client";

import { LeadType } from "@/shared/types/lead";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchLeadsData,
  createLead,
  updateLead,
  deleteLead,
  fetchLeadNotes,
  createLeadNote,
  fetchLeadTimeline,
  fetchLeadAttachments,
  createLeadAttachment,
  uploadLeadAttachment,
  deleteLeadAttachment,
  fetchLeadMeetings,
  createLeadMeeting
} from "@/shared/lib/api/crm";

export function useLeads(
  params?: import("@/shared/lib/api/crm").LeadsQueryParams,
  options?: { enabled?: boolean }
) {
  const { isAuthenticated, isHydrated } = useAuth();
  const isEnabled = (options?.enabled !== undefined ? options.enabled : true) && isHydrated && isAuthenticated;
  return useQuery({
    queryKey: params && Object.keys(params).length > 0 ? ["leads", params] : ["leads"],
    queryFn: () => fetchLeadsData(params),
    enabled: isEnabled,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Lead created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create lead");
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Partial<LeadType>, "notes"> & { wonReason?: string; lostReason?: string; wonDate?: string; actualRevenue?: number; competitor?: string; notes?: string | unknown[] } }) => updateLead(id, data as Partial<LeadType>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Lead updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update lead");
    },
  });
}


export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeadsData = queryClient.getQueriesData({ queryKey: ["leads"] });

      queryClient.setQueriesData({ queryKey: ["leads"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('leads' in old)) return old;
        const cache = old as { leads: { id: string }[]; summary?: { total: number }; pagination?: { total: number } };
        return {
          ...cache,
          leads: cache.leads.filter((lead) => lead.id !== id),
          summary: { ...cache.summary, total: Math.max(0, (cache.summary?.total || 1) - 1) },
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - 1) }
        };
      });

      return { previousLeadsData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLeadsData) {
        context.previousLeadsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to delete lead");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
}

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => import("@/shared/lib/api/crm").then(m => m.bulkDeleteLeads(ids)),
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeadsData = queryClient.getQueriesData({ queryKey: ["leads"] });

      queryClient.setQueriesData({ queryKey: ["leads"] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('leads' in old)) return old;
        const cache = old as { leads: { id: string }[]; summary?: { total: number }; pagination?: { total: number } };
        return {
          ...cache,
          leads: cache.leads.filter((lead) => !ids.includes(lead.id)),
          summary: { ...cache.summary, total: Math.max(0, (cache.summary?.total || 1) - ids.length) },
          pagination: { ...cache.pagination, total: Math.max(0, (cache.pagination?.total || 1) - ids.length) }
        };
      });

      return { previousLeadsData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousLeadsData) {
        context.previousLeadsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to delete leads");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
}


export function useLeadNotes(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadNotes", leadId, token],
    queryFn: () => fetchLeadNotes(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useCreateLeadNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: ReturnType<typeof JSON.parse> }) => createLeadNote(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadNotes", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Note added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add note");
    },
  });
}

export function useLeadTimeline(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadTimeline", leadId, token],
    queryFn: () => fetchLeadTimeline(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useLeadAttachments(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadAttachments", leadId, token],
    queryFn: () => fetchLeadAttachments(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useCreateLeadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: ReturnType<typeof JSON.parse> }) => createLeadAttachment(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Attachment added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add attachment");
    },
  });
}

export function useUploadLeadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      file,
    }: {
      leadId: string;
      file: File | { fileData: string; fileName: string; fileType?: string };
    }) => uploadLeadAttachment(leadId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("File uploaded to storage successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload file to storage");
    },
  });
}

export function useDeleteLeadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, attachmentId }: { leadId: string; attachmentId: string }) =>
      deleteLeadAttachment(leadId, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Attachment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete attachment");
    },
  });
}

export function useLeadMeetings(leadId: string) {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["leadMeetings", leadId, token],
    queryFn: () => fetchLeadMeetings(leadId),
    enabled: isAuthenticated && !!leadId,
  });
}

export function useCreateLeadMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: ReturnType<typeof JSON.parse> }) => createLeadMeeting(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadMeetings", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadTimeline", variables.leadId] });
      toast.success("Meeting scheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to schedule meeting");
    },
  });
}

