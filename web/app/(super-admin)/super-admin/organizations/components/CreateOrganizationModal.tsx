"use client";

import React from "react";
import { Building2, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface CreateOrganizationModalProps {
  createModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
  newOrgName: string;
  setNewOrgName: (val: string) => void;
  newOrgSlug: string;
  setNewOrgSlug: (val: string) => void;
  newOrgPlan: string;
  setNewOrgPlan: (val: string) => void;
  newOrgCurrency: string;
  setNewOrgCurrency: (val: string) => void;
  creating: boolean;
  handleCreateOrg: (e: React.FormEvent) => void;
}

export function CreateOrganizationModal({
  createModalOpen,
  setCreateModalOpen,
  newOrgName,
  setNewOrgName,
  newOrgSlug,
  setNewOrgSlug,
  newOrgPlan,
  setNewOrgPlan,
  newOrgCurrency,
  setNewOrgCurrency,
  creating,
  handleCreateOrg,
}: CreateOrganizationModalProps) {
  if (!createModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Create Organization
              </h3>
              <p className="text-xs text-muted-foreground">
                Provision a new multi-tenant workspace
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="orgName" className="text-xs font-semibold">
              Organization Name *
            </Label>
            <Input
              id="orgName"
              placeholder="Enter organization name"
              value={newOrgName}
              onChange={(e) => {
                setNewOrgName(e.target.value);
                if (!newOrgSlug) {
                  setNewOrgSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")
                  );
                }
              }}
              required
              className="rounded-xl h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orgSlug" className="text-xs font-semibold">
              URL Workspace Slug
            </Label>
            <Input
              id="orgSlug"
              placeholder="Enter workspace slug"
              value={newOrgSlug}
              onChange={(e) => setNewOrgSlug(e.target.value)}
              className="rounded-xl h-10 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="orgPlan" className="text-xs font-semibold">
                Subscription Tier
              </Label>
              <Select 
                value={newOrgPlan} 
                onValueChange={(val) => setNewOrgPlan(val)}
              >
                <SelectTrigger id="orgPlan" className="w-full h-10 px-3 bg-background border-border text-sm font-medium">
                  <SelectValue placeholder="Select Subscription Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Tier</SelectItem>
                  <SelectItem value="starter">Starter Plan (₹1,999/mo)</SelectItem>
                  <SelectItem value="pro">Pro Plan (₹4,999/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (₹14,999/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orgCurrency" className="text-xs font-semibold">
                Primary Currency
              </Label>
              <Select 
                value={newOrgCurrency} 
                onValueChange={(val) => setNewOrgCurrency(val)}
              >
                <SelectTrigger id="orgCurrency" className="w-full h-10 px-3 bg-background border-border text-sm font-medium">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
            >
              {creating ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
