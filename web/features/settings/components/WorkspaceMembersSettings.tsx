"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  Search,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "invited" | "inactive";
  joinedDate: string;
}

const SAMPLE_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Manii",
    email: "manibct1817@gmail.com",
    role: "Admin",
    department: "Executive",
    status: "active",
    joinedDate: "Jan 15, 2024",
  },
  {
    id: "2",
    name: "Sarah Connor",
    email: "sarah.c@clixprocrm.com",
    role: "Manager",
    department: "Sales Operations",
    status: "active",
    joinedDate: "Feb 02, 2024",
  },
  {
    id: "3",
    name: "Alex Rivera",
    email: "alex.r@clixprocrm.com",
    role: "Sales Executive",
    department: "Direct Sales",
    status: "active",
    joinedDate: "Mar 10, 2024",
  },
  {
    id: "4",
    name: "Elena Rostova",
    email: "elena.r@clixprocrm.com",
    role: "Support Specialist",
    department: "Customer Success",
    status: "invited",
    joinedDate: "Pending Invite",
  },
];

export default function WorkspaceMembersSettings() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<Member[]>(SAMPLE_MEMBERS);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SALES");
  const [inviteDept, setInviteDept] = useState("Sales");

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    const newMember: Member = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole === "ADMIN" ? "Admin" : inviteRole === "MANAGER" ? "Manager" : "Sales Executive",
      department: inviteDept,
      status: "invited",
      joinedDate: "Pending Invite",
    };
    setMembers([newMember, ...members]);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Member Overview Card */}
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Workspace Members & Access
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Manage member seats, invitations, department assignments, and permission roles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-semibold gap-1.5 h-9"
            >
              <Link href="/employees">
                <ExternalLink className="w-3.5 h-3.5" />
                Employee Directory
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              className="text-xs font-semibold gap-1.5 h-9"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-4 pb-2">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="mt-3 border rounded-xl overflow-hidden divide-y divide-border/50">
          <div className="grid grid-cols-12 bg-card border-b border-border/60 px-4 py-2.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] leading-tight h-10 sm:h-11 items-center">
            <span className="col-span-5">Member</span>
            <span className="col-span-3">Role &amp; Dept</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2 text-right">Joined</span>
          </div>

          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-12 items-center px-4 py-3.5 hover:bg-muted/20 transition-colors text-xs"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{member.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>

              <div className="col-span-3">
                <p className="font-medium text-foreground">{member.role}</p>
                <p className="text-[11px] text-muted-foreground">{member.department}</p>
              </div>

              <div className="col-span-2">
                {member.status === "active" ? (
                  <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border-amber-500/20 gap-1">
                    <Clock className="w-3 h-3" /> Invited
                  </Badge>
                )}
              </div>

              <div className="col-span-2 text-right text-muted-foreground text-[11px] font-medium">
                {member.joinedDate}
              </div>
            </div>
          ))}
        </div>
      </CRMCard>

      {/* Invite Member Dialog */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Invite New Workspace Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send an invitation email with access to your ClixProCRM workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assigned Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="SALES">Sales Executive</SelectItem>
                    <SelectItem value="SUPPORT">Support</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department</Label>
                <Select value={inviteDept} onValueChange={setInviteDept}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
