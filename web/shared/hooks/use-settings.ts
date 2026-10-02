"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAiSettings,
  fetchIntegrationSettings,
  fetchNotificationSettings,
  fetchSecuritySettings,
  fetchWorkspaceData,
  updateAiSettings,
  updateIntegrationSettings,
  updateNotificationSettings,
  updateSecuritySettings,
  updateWorkspaceData,
  uploadWorkspaceLogo,
} from "@/shared/lib/api/crm";

import { useAuth } from "@/features/auth/components/auth-provider";

export function useWorkspace() {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["workspace", token],
    queryFn: fetchWorkspaceData,
    enabled: isAuthenticated ,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: updateWorkspaceData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", token] });
    },
  });
}

export function useUploadWorkspaceLogo() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: uploadWorkspaceLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", token] });
    },
  });
}

export function useSecuritySettings() {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["settings", "security", token],
    queryFn: fetchSecuritySettings,
    enabled: isAuthenticated ,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "security", token] });
    },
  });
}

export function useIntegrationSettings() {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["settings", "integrations", token],
    queryFn: fetchIntegrationSettings,
    enabled: isAuthenticated ,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateIntegrationSettings() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: ({ id, connected }: { id: string; connected: boolean }) => updateIntegrationSettings(id, connected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "integrations", token] });
    },
  });
}

export function useAiSettings() {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["settings", "ai", token],
    queryFn: fetchAiSettings,
    enabled: isAuthenticated ,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: updateAiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "ai", token] });
    },
  });
}

export function useNotificationSettings() {
  const { isAuthenticated, token } = useAuth();
  return useQuery({
    queryKey: ["settings", "notifications", token],
    queryFn: fetchNotificationSettings,
    enabled: isAuthenticated ,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "notifications", token] });
    },
  });
}
