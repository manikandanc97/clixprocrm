import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  fetchInvoices,
  fetchInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
  fetchPayments,
  recordInvoicePayment,
  deletePayment,
  fetchInvoiceSettings,
  updateInvoiceSettings,
  CreateInvoicePayload,
  RecordPaymentPayload,
  SendInvoicePayload,
  InvoiceSettingsData,
} from "@/shared/lib/api/invoices.api";
import { toast } from "sonner";

export function useInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
  companyId?: string;
  dealId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["crm-invoices", params],
    queryFn: () => fetchInvoices(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useInvoiceDetails(id: string | null | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["crm-invoice-detail", id],
    queryFn: () => fetchInvoiceById(id!),
    enabled: isAuthenticated && Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useInvoiceSettings() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["crm-invoice-settings"],
    queryFn: fetchInvoiceSettings,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvoicePayments(params?: {
  page?: number;
  limit?: number;
  invoiceId?: string;
  status?: string;
}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["crm-payments", params],
    queryFn: () => fetchPayments(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to create invoice");
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateInvoicePayload> }) =>
      updateInvoice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["crm-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["crm-invoice-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update invoice");
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete invoice");
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: RecordPaymentPayload }) =>
      recordInvoicePayment(invoiceId, payload),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ["crm-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["crm-invoice-detail", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["crm-payments"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      toast.success("Payment recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to record payment");
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["crm-invoice-detail"] });
      queryClient.invalidateQueries({ queryKey: ["crm-payments"] });
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      toast.success("Payment deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete payment");
    },
  });
}

export function useSendInvoiceEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: SendInvoicePayload }) =>
      sendInvoiceEmail(id, payload),
    onSuccess: (data: any, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["crm-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["crm-invoice-detail", id] });
      toast.success(data?.message || "Invoice email sent successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to send invoice email");
    },
  });
}

export function useUpdateInvoiceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<InvoiceSettingsData>) => updateInvoiceSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-invoice-settings"] });
      toast.success("Invoice settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update settings");
    },
  });
}
