"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Sparkles, UserPlus, Upload, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { FormModal } from "@/shared/components/form-modal";
import { BulkImportModal } from "@/features/leads/components/BulkImportModal";
import { EmptyState } from "@/shared/components/EmptyState";

import { FormSkeleton } from "@/shared/components/skeletons";

const LeadForm = dynamic(
  () => import("@/features/forms/LeadForm").then((mod) => ({ default: mod.LeadForm })),
  { loading: () => <FormSkeleton /> }
);

export default function DashboardOnboardingHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
  };

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 w-full flex-1 min-h-0">
      {/* 1. Welcome Hero Banner with User Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 md:p-6 border border-white/10 shadow-xl"
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ backgroundColor: "var(--primary)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: "var(--primary)" }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-5">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              <Sparkles className="w-3 h-3" />
              Workspace Setup
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Welcome to ClixProCRM,{" "}
              <span className="text-primary">{user?.displayName || user?.name || "there"}</span>!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Your CRM workspace is ready. Start by adding your first lead or importing your contact list to populate your sales pipeline and activate live reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => setIsLeadModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 sm:px-6 h-10 sm:h-10.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create First Lead
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold px-4 sm:px-5 h-10 sm:h-10.5 rounded-xl transition-all"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 2. Clean Centered Empty State Card — dynamically aligns with bottom of sidebar */}
      <EmptyState
        module="leads"
        className="flex-1 w-full min-h-[220px] flex flex-col items-center justify-center"
        title="No leads added yet"
        description="Add your first prospective customer or import your contact list to activate your sales pipeline and live analytics."
        primaryAction={{
          label: "Create Lead",
          icon: Plus,
          onClick: () => setIsLeadModalOpen(true),
        }}
        secondaryAction={{
          label: "Import Data",
          icon: Upload,
          onClick: () => setIsImportModalOpen(true),
        }}
      />

      {/* Lead Modal */}
      <FormModal
        title="Create New Lead"
        description="Capture prospect details to begin tracking engagement and activate your dashboard."
        isOpen={isLeadModalOpen}
        onOpenChange={setIsLeadModalOpen}
        size="lg"
      >
        <LeadForm
          onSuccess={() => {
            setIsLeadModalOpen(false);
            invalidateAll();
          }}
          onCancel={() => setIsLeadModalOpen(false)}
        />
      </FormModal>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={() => {
          setIsImportModalOpen(false);
          invalidateAll();
        }}
      />
    </div>
  );
}
