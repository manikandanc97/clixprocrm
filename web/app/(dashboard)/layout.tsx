"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/features/auth/components/protected-route";
import { SidebarProvider } from "@/features/dashboard/components/SidebarContext";
import DashboardShell from "@/features/dashboard/components/DashboardShell";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { GlobalModalManager } from "@/shared/components/GlobalModalManager";
import { DashboardCelebration } from "@/components/celebration";
import { MfaChallengeModal } from "@/features/auth/components/MfaChallengeModal";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showMfaModal, setShowMfaModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Listen for global AAL2_REQUIRED events triggered by API calls
    const handleAal2Required = () => {
      setShowMfaModal(true);
    };

    window.addEventListener("clixpro:aal2-required", handleAal2Required);

    // 2. Proactive check: Check if active session is only AAL1 while next level is AAL2
    const checkAal = async () => {
      try {
        const supabase = createClient();
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (
          aalData &&
          aalData.currentLevel === "aal1" &&
          aalData.nextLevel === "aal2"
        ) {
          setShowMfaModal(true);
        }
      } catch {
        // Ignore check errors
      }
    };

    checkAal();

    return () => {
      window.removeEventListener("clixpro:aal2-required", handleAal2Required);
    };
  }, []);

  return (
    <ProtectedRoute>
      <TooltipProvider>
        <SidebarProvider>
          <DashboardShell>
            {children}
          </DashboardShell>
          <DashboardCelebration />
          <GlobalModalManager />
          <MfaChallengeModal
            open={showMfaModal}
            onOpenChange={setShowMfaModal}
            onSuccess={() => {
              queryClient.invalidateQueries();
            }}
          />
        </SidebarProvider>
      </TooltipProvider>
    </ProtectedRoute>
  );
}











