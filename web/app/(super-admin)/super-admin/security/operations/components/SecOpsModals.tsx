"use client";

import React from "react";
import {
  Flame,
  ShieldAlert,
  Lock,
  X,
} from "lucide-react";
import {
  SecurityAlertItem,
  SecurityIncidentItem,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import { EmergencyModalState, getStatusBadge } from "./types";

interface AlertDetailsModalProps {
  selectedAlert: SecurityAlertItem;
  setSelectedAlert: (val: SecurityAlertItem | null) => void;
  alertResolveNotes: string;
  setAlertResolveNotes: (val: string) => void;
  resolvingAlert: boolean;
  handleAcknowledgeAlert: (id: string) => Promise<void>;
  handleEscalateAlert: (id: string) => Promise<void>;
  handleResolveAlert: () => Promise<void>;
}

export function AlertDetailsModal({
  selectedAlert,
  setSelectedAlert,
  alertResolveNotes,
  setAlertResolveNotes,
  resolvingAlert,
  handleAcknowledgeAlert,
  handleEscalateAlert,
  handleResolveAlert,
}: AlertDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Security Alert Detail</span>
          </h3>
          <button
            onClick={() => setSelectedAlert(null)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase", getStatusBadge(selectedAlert.severity))}>
              {selectedAlert.severity}
            </span>
            <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase", getStatusBadge(selectedAlert.status))}>
              {selectedAlert.status}
            </span>
            <span className="font-mono text-muted-foreground">{selectedAlert.alertType}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-1.5">
            <p className="font-bold text-foreground text-sm">{selectedAlert.title}</p>
            <p className="text-muted-foreground leading-relaxed">{selectedAlert.description}</p>
            {selectedAlert.userId && (
              <p className="font-mono text-[11px] text-muted-foreground pt-1">Target User: {selectedAlert.userId}</p>
            )}
            {selectedAlert.organizationId && (
              <p className="font-mono text-[11px] text-muted-foreground">Target Organization: {selectedAlert.organizationId}</p>
            )}
          </div>

          {selectedAlert.status !== "RESOLVED" && (
            <div className="space-y-2 pt-2">
              <label className="text-muted-foreground font-bold text-[11px] block">
                Resolution Justification Notes:
              </label>
              <textarea
                rows={2}
                value={alertResolveNotes}
                onChange={(e) => setAlertResolveNotes(e.target.value)}
                placeholder="Enter audit resolution notes..."
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                {selectedAlert.status === "OPEN" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                    className="flex-1 text-xs"
                  >
                    Acknowledge
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEscalateAlert(selectedAlert.id)}
                  className="flex-1 text-xs text-rose-600 dark:text-rose-400"
                >
                  Escalate to Incident
                </Button>
                <Button
                  size="sm"
                  onClick={handleResolveAlert}
                  disabled={resolvingAlert}
                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {resolvingAlert ? "Resolving..." : "Mark Resolved"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IncidentWorkflowModalProps {
  selectedIncident: SecurityIncidentItem;
  setSelectedIncident: (val: SecurityIncidentItem | null) => void;
  incidentResolveNotes: string;
  setIncidentResolveNotes: (val: string) => void;
  updatingIncident: boolean;
  handleUpdateIncidentStatus: (status: string) => Promise<void>;
}

export function IncidentWorkflowModal({
  selectedIncident,
  setSelectedIncident,
  incidentResolveNotes,
  setIncidentResolveNotes,
  updatingIncident,
  handleUpdateIncidentStatus,
}: IncidentWorkflowModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>Incident #{selectedIncident.incidentNumber}</span>
          </h3>
          <button
            onClick={() => setSelectedIncident(null)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase", getStatusBadge(selectedIncident.severity))}>
              {selectedIncident.severity}
            </span>
            <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase", getStatusBadge(selectedIncident.status))}>
              {selectedIncident.status}
            </span>
            <span className="font-mono text-muted-foreground">{selectedIncident.incidentType}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-1.5">
            <p className="font-bold text-foreground text-sm">{selectedIncident.title}</p>
            <p className="text-muted-foreground leading-relaxed">{selectedIncident.description}</p>
            {selectedIncident.resolutionNotes && (
              <div className="pt-2 border-t border-border/40 mt-2">
                <span className="font-semibold text-foreground">Resolution Notes:</span>
                <p className="text-muted-foreground mt-0.5">{selectedIncident.resolutionNotes}</p>
              </div>
            )}
          </div>

          {selectedIncident.status !== "RESOLVED" && (
            <div className="space-y-2 pt-2">
              <label className="text-muted-foreground font-bold text-[11px] block">
                Action / Resolution Notes:
              </label>
              <textarea
                rows={2}
                value={incidentResolveNotes}
                onChange={(e) => setIncidentResolveNotes(e.target.value)}
                placeholder="Document investigation progress, containment measures, or root cause resolution..."
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs outline-none focus:ring-1 focus:ring-primary"
              />

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={selectedIncident.status === "INVESTIGATING" ? "default" : "outline"}
                  disabled={updatingIncident || selectedIncident.status === "INVESTIGATING"}
                  onClick={() => handleUpdateIncidentStatus("INVESTIGATING")}
                  className="text-xs"
                >
                  Investigating
                </Button>
                <Button
                  size="sm"
                  variant={selectedIncident.status === "CONTAINED" ? "default" : "outline"}
                  disabled={updatingIncident || selectedIncident.status === "CONTAINED"}
                  onClick={() => handleUpdateIncidentStatus("CONTAINED")}
                  className="text-xs"
                >
                  Mark Contained
                </Button>
                <Button
                  size="sm"
                  disabled={updatingIncident}
                  onClick={() => handleUpdateIncidentStatus("RESOLVED")}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Resolve
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmergencyControlsModalProps {
  emergencyModal: EmergencyModalState;
  setEmergencyModal: React.Dispatch<React.SetStateAction<EmergencyModalState>>;
  executingEmergency: boolean;
  handleExecuteEmergency: () => Promise<void>;
}

export function EmergencyControlsModal({
  emergencyModal,
  setEmergencyModal,
  executingEmergency,
  handleExecuteEmergency,
}: EmergencyControlsModalProps) {
  if (!emergencyModal.action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-rose-500/30 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <span>Emergency Security Control</span>
          </h3>
          <button
            onClick={() => setEmergencyModal({ action: null, targetId: "", reason: "", confirmText: "" })}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Action Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setEmergencyModal((prev) => ({ ...prev, action: "FORCE_RESET", confirmText: "" }))}
              className={cn(
                "py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                emergencyModal.action === "FORCE_RESET" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Force Reset
            </button>
            <button
              type="button"
              onClick={() => setEmergencyModal((prev) => ({ ...prev, action: "LOCK_USER", confirmText: "" }))}
              className={cn(
                "py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                emergencyModal.action === "LOCK_USER" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lock User
            </button>
            <button
              type="button"
              onClick={() => setEmergencyModal((prev) => ({ ...prev, action: "REVOKE_SESSIONS", confirmText: "" }))}
              className={cn(
                "py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                emergencyModal.action === "REVOKE_SESSIONS" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Revoke Sessions
            </button>
          </div>

          <div>
            <label className="text-muted-foreground font-semibold block mb-1">
              Target Identifier (UUID / Email):
            </label>
            <Input
              value={emergencyModal.targetId}
              onChange={(e) => setEmergencyModal((prev) => ({ ...prev, targetId: e.target.value }))}
              placeholder="Enter target UUID or user email..."
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-semibold block mb-1">
              Justification Reason (min 5 characters):
            </label>
            <textarea
              rows={2}
              value={emergencyModal.reason}
              onChange={(e) => setEmergencyModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Audit reason for executing emergency security action..."
              className="w-full p-2.5 rounded-xl bg-background border border-border text-xs outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {emergencyModal.action === "LOCK_USER" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <p className="font-bold text-[11px] mb-1">
                Type <span className="font-mono underline">LOCK USER</span> to confirm:
              </p>
              <Input
                value={emergencyModal.confirmText}
                onChange={(e) => setEmergencyModal((prev) => ({ ...prev, confirmText: e.target.value }))}
                placeholder="LOCK USER"
                className="font-mono font-bold text-xs"
              />
            </div>
          )}

          {emergencyModal.action === "LOCK_TENANT" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
              <p className="font-bold text-[11px] mb-1">
                Type <span className="font-mono underline">LOCK TENANT</span> to confirm:
              </p>
              <Input
                value={emergencyModal.confirmText}
                onChange={(e) => setEmergencyModal((prev) => ({ ...prev, confirmText: e.target.value }))}
                placeholder="LOCK TENANT"
                className="font-mono font-bold text-xs"
              />
            </div>
          )}

          <Button
            size="sm"
            variant="destructive"
            onClick={handleExecuteEmergency}
            disabled={executingEmergency}
            className="w-full gap-2 text-xs font-bold"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>
              {executingEmergency
                ? "Executing Action..."
                : emergencyModal.action === "FORCE_RESET"
                ? "Enforce Password Reset"
                : emergencyModal.action === "LOCK_USER"
                ? "Execute User Lockdown"
                : emergencyModal.action === "LOCK_TENANT"
                ? "Execute Tenant Lockdown"
                : "Revoke All Sessions"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
