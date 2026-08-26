"use client";

import { useState, useEffect } from "react";
import SuperAdminRoute from "@/features/auth/components/super-admin-route";
import { SuperAdminSidebar } from "./components/super-admin-sidebar";
import { SuperAdminHeader } from "./components/super-admin-header";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { SuperAdminMfaModal } from "@/features/auth/components/SuperAdminMfaModal";
import { createClient } from "@/lib/supabase/client";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showMfaModal, setShowMfaModal] = useState(false);

  useEffect(() => {
    // 1. Listen for global AAL2_REQUIRED events triggered by API calls
    const handleAal2Required = () => {
      setShowMfaModal(true);
    };

    window.addEventListener("clixpro:aal2-required", handleAal2Required);

    // 2. Proactive check: Check if active session is only AAL1
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
    <SuperAdminRoute>
      <TooltipProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
          {/* Subtle Surface Background */}
          <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#050505] -z-10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          {/* Super Admin Sidebar */}
          <SuperAdminSidebar />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0 h-full w-full">
            <SuperAdminHeader />
            <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col kanban-board-scroll">
              <div className="w-full flex-1 min-h-0 flex flex-col h-full">{children}</div>
            </main>
          </div>

          {/* Super Admin AAL2 Elevation Modal */}
          <SuperAdminMfaModal
            open={showMfaModal}
            onOpenChange={setShowMfaModal}
            onVerified={() => {
              window.dispatchEvent(new CustomEvent("clixpro:aal2-verified"));
            }}
          />
        </div>
      </TooltipProvider>
    </SuperAdminRoute>
  );
}

