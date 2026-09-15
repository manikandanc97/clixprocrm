"use client";

import React from "react";
import { Crown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

interface EnterpriseInquiryData {
  teamSize: string;
  phone: string;
  message: string;
}

interface EnterpriseContactModalProps {
  enterpriseModalOpen: boolean;
  setEnterpriseModalOpen: (open: boolean) => void;
  inquiryData: EnterpriseInquiryData;
  setInquiryData: React.Dispatch<React.SetStateAction<EnterpriseInquiryData>>;
  isSubmittingInquiry: boolean;
  handleEnterpriseInquirySubmit: (e: React.FormEvent) => Promise<void>;
}

export function EnterpriseContactModal({
  enterpriseModalOpen,
  setEnterpriseModalOpen,
  inquiryData,
  setInquiryData,
  isSubmittingInquiry,
  handleEnterpriseInquirySubmit,
}: EnterpriseContactModalProps) {
  return (
    <Dialog open={enterpriseModalOpen} onOpenChange={setEnterpriseModalOpen}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <form onSubmit={handleEnterpriseInquirySubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Contact Enterprise Sales
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Custom seat allocations, SAML 2.0 SSO, compliance vaults, and dedicated solution architects.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Estimated Team Size</Label>
              <select
                value={inquiryData.teamSize}
                onChange={(e) => setInquiryData({ ...inquiryData, teamSize: e.target.value })}
                className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="25-50">25 - 50 team members</option>
                <option value="50-150">50 - 150 team members</option>
                <option value="150-500">150 - 500 team members</option>
                <option value="500+">500+ team members (Large Enterprise)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone / WhatsApp Number</Label>
              <Input
                placeholder="+91 98765 43210"
                value={inquiryData.phone}
                onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Custom Security / Organization Needs</Label>
              <Textarea
                placeholder="Tell us about your organization requirements, custom integrations, compliance retention, or setup timeline..."
                value={inquiryData.message}
                onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                className="text-xs min-h-[80px] rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEnterpriseModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingInquiry}
              className="bg-primary text-primary-foreground text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
            >
              {isSubmittingInquiry ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
