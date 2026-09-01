"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRevenueTargets } from "@/shared/lib/api/crm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { toast } from "sonner";
import { Target, Plus, MoreVertical, Copy, Check, Trash2, Pencil, Calendar, Info } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import client from "@/shared/lib/api/client";
import { useCurrency } from "@/shared/hooks/use-currency";
import { useDirtyState } from "@/shared/hooks/use-dirty-form";
import { UnsavedWarning } from "@/shared/components/unsaved-warning";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { CRMActionMenu } from "@/shared/components/crm";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";

export default function RevenueTargetSettings() {
  const queryClient = useQueryClient();
  const { formatCurrency, currencyCode } = useCurrency();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const defaultFormState = {
    name: "",
    periodType: "MONTHLY",
    value: "",
    currency: currencyCode,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [originalFormData, setOriginalFormData] = useState(defaultFormState);

  React.useEffect(() => {
    (() => setFormData(prev => ({ ...prev, currency: currencyCode })))();
    (() => setOriginalFormData(prev => ({ ...prev, currency: currencyCode })))();
  }, [currencyCode]);

  const { isDirty } = useDirtyState(formData, originalFormData);

  const { data: targets, isLoading } = useQuery({
    queryKey: ["revenue-targets"],
    queryFn: fetchRevenueTargets,
  });

  const createTarget = useMutation({
    mutationFn: async (data: ReturnType<typeof JSON.parse>) => {
      const res = await client.post("/crm/settings/revenue-targets", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-targets"] });
      toast.success("Revenue target created successfully");
      closeForm();
      queryClient.invalidateQueries({ queryKey: ["revenue-target"] });
    },
    onError: () => toast.error("Failed to create revenue target"),
  });

  const updateTarget = useMutation({
    mutationFn: async (data: ReturnType<typeof JSON.parse>) => {
      const { id, ...rest } = data;
      const res = await client.put(`/crm/settings/revenue-targets/${id}`, rest);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-targets"] });
      toast.success("Revenue target updated successfully");
      closeForm();
      queryClient.invalidateQueries({ queryKey: ["revenue-target"] });
    },
    onError: () => toast.error("Failed to update revenue target"),
  });

  const deleteTarget = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.delete(`/crm/settings/revenue-targets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-targets"] });
      toast.success("Revenue target deleted successfully");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["revenue-target"] });
    },
    onError: () => toast.error("Failed to delete revenue target"),
  });

  const handleEdit = (target: ReturnType<typeof JSON.parse>) => {
    const editState = {
      name: target.name || `${target.periodType} TARGET`,
      periodType: target.periodType,
      value: target.value.toString(),
      currency: target.currency,
      startDate: new Date(target.startDate).toISOString().split("T")[0],
      endDate: new Date(target.endDate).toISOString().split("T")[0],
    };
    setFormData(editState);
    setOriginalFormData(editState);
    setEditingId(target.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTimeout(() => {
      setEditingId(null);
      setFormData({ ...defaultFormState, currency: currencyCode });
      setOriginalFormData({ ...defaultFormState, currency: currencyCode });
    }, 300); // Wait for drawer animation
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isDirty) {
      setShowWarning(true);
      return;
    }
    if (!open) {
      closeForm();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      value: Number(formData.value),
    };
    if (editingId) {
      updateTarget.mutate({ id: editingId, ...payload });
    } else {
      createTarget.mutate(payload);
    }
  };


  const getStatusBadge = (target: ReturnType<typeof JSON.parse>) => {
    const now = new Date();
    const startDate = new Date(target.startDate);
    const endDate = new Date(target.endDate);
    
    if (target.isActive === false) return <Badge variant="secondary">Draft</Badge>;
    if (now < startDate) return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20">Upcoming</Badge>;
    if (now > endDate) return <Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-900/20">Expired</Badge>;
    return <Badge variant="outline" className="text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Revenue Targets</CardTitle>
            <CardDescription className="text-sm mt-1">Configure organizational and team revenue goals.</CardDescription>
          </div>
          <Button 
            className="rounded-full px-6"
            onClick={() => {
              setEditingId(null);
              setFormData({ ...defaultFormState, currency: currencyCode });
              setOriginalFormData({ ...defaultFormState, currency: currencyCode });
              setIsFormOpen(true);
            }} 
          >
            <Plus className="w-4 h-4 mr-2" />
            New Target
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <div className="p-6 border shadow-sm rounded-2xl bg-card space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ) : targets?.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-xl bg-card">
            <Target className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium text-foreground">No revenue targets found</p>
            <p className="text-xs mt-1">{"Set up a goal to track your organization's performance."}</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>Create First Target</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Target */}
            {(() => {
              const activeTarget = targets?.find((t: ReturnType<typeof JSON.parse>) => t.isActive);
              if (!activeTarget) return null;
              
              const currentRev = activeTarget.currentRevenue || 0;
              const targetVal = activeTarget.value || 0;
              const progress = targetVal > 0 ? Math.min(100, Math.round((currentRev / targetVal) * 100)) : 0;
              
              return (
                <div key={activeTarget.id} className="group flex flex-col p-6 border shadow-sm rounded-2xl transition-all duration-300 bg-gradient-to-b from-card to-emerald-500/5 hover:border-emerald-500/40 hover:shadow-lg">
                  <div className="flex items-center justify-between w-full mb-5">
                    <div className="flex items-center gap-5">
                      <div className="p-3.5 rounded-2xl ring-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg text-foreground tracking-tight">
                            {activeTarget.name || `${activeTarget.periodType} TARGET`}
                          </h4>
                          {getStatusBadge(activeTarget)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5"/> 
                            {activeTarget.periodType === "MONTHLY" 
                              ? "Auto-renews every month" 
                              : `${new Date(activeTarget.startDate).toLocaleDateString()} - ${new Date(activeTarget.endDate).toLocaleDateString()}`}
                          </span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Target className="w-3.5 h-3.5"/> {activeTarget.goalType || "Revenue"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 ml-auto mr-8">
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Current Revenue</p>
                        <p className="text-xl font-black tracking-tight">{formatCurrency(currentRev)}</p>
                      </div>
                      <div className="h-10 w-px bg-border/60" />
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Target</p>
                        <p className="text-xl font-black tracking-tight text-muted-foreground/60">{formatCurrency(targetVal)}</p>
                      </div>
                    </div>

                    <CRMActionMenu
                      items={[
                        {
                          label: "Set as Inactive",
                          icon: Check,
                          onClick: () => updateTarget.mutate({ id: activeTarget.id, isActive: false }),
                        },
                        {
                          label: "Edit Target",
                          icon: Pencil,
                          onClick: () => handleEdit(activeTarget),
                        },
                        {
                          label: "Duplicate Target",
                          icon: Copy,
                          onClick: () => {
                            handleEdit(activeTarget);
                            setEditingId(null);
                          },
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          variant: "destructive" as const,
                          separatorBefore: true,
                          onClick: () => setDeleteId(activeTarget.id),
                        },
                      ]}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 bg-background/50 border border-muted/50 py-3 px-5 rounded-xl shadow-inner mt-2">
                    <Progress value={progress} className="h-2.5 flex-1 bg-muted" indicatorClassName="bg-emerald-500" />
                    <span className="text-sm font-black w-12 text-right tracking-tighter">{progress}%</span>
                  </div>
                </div>
              );
            })()}

            {/* Inactive Targets Grid */}
            {(() => {
              const inactiveTargets = targets?.filter((t: ReturnType<typeof JSON.parse>) => !t.isActive) || [];
              if (inactiveTargets.length === 0) return null;

              return (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest pl-1">Previous Targets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {inactiveTargets.map((target: ReturnType<typeof JSON.parse>) => (
                      <div key={target.id} className="group flex flex-col p-5 border shadow-sm rounded-2xl bg-card/40 opacity-80 hover:opacity-100 hover:bg-card/80 transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
                              <Target className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground tracking-tight line-clamp-1">
                                {target.name || `${target.periodType} TARGET`}
                              </h4>
                              <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3"/> 
                                {new Date(target.startDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <CRMActionMenu
                            items={[
                              {
                                label: "Set as Active",
                                icon: Check,
                                className: "text-emerald-600 dark:text-emerald-400 font-medium",
                                onClick: () => updateTarget.mutate({ id: target.id, isActive: true }),
                              },
                              {
                                label: "Edit Target",
                                icon: Pencil,
                                onClick: () => handleEdit(target),
                              },
                              {
                                label: "Duplicate Target",
                                icon: Copy,
                                onClick: () => {
                                  handleEdit(target);
                                  setEditingId(null);
                                },
                              },
                              {
                                label: "Delete",
                                icon: Trash2,
                                variant: "destructive" as const,
                                separatorBefore: true,
                                onClick: () => setDeleteId(target.id),
                              },
                            ]}
                          />
                        </div>
                        
                        <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Target</span>
                          <span className="text-sm font-black tracking-tight">{formatCurrency(target.value || 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="w-full sm:max-w-2xl p-0 flex flex-col bg-background max-h-[90vh] overflow-hidden gap-0">
          <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle className="text-xl">{editingId ? "Edit Revenue Target" : "Create New Target"}</DialogTitle>
            <DialogDescription>
              Configure specific revenue goals, assignment, and calculation rules.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            <form id="target-form" onSubmit={handleSubmit} className="space-y-8 pb-6">
              
              {/* General Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">General</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      placeholder="Enter sales target name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period Type</Label>
                    <Select value={formData.periodType} onValueChange={(val) => setFormData({ ...formData, periodType: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Target Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Target Value</h3>
                </div>
                <div className="space-y-2">
                  <Label>Revenue Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      {currencyCode}
                    </span>
                    <Input 
                      type="number" 
                      required 
                      className="pl-12"
                      value={formData.value} 
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })} 
                      placeholder="Enter target amount" 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Currency is inherited from global settings.</p>
                </div>
              </div>

              {/* Duration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Duration</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="date" 
                      required 
                      value={formData.startDate} 
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="date" 
                      required 
                      value={formData.endDate} 
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                    />
                  </div>
                </div>
              </div>









            </form>
          </ScrollArea>
          
          <DialogFooter className="m-0 p-6 bg-background border-t shrink-0">
            <div className="flex gap-3 w-full justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="cursor-pointer">
                <AppIcon name="close" size={14} className="mr-1.5" />
                Cancel
              </Button>
              <Button type="submit" form="target-form" disabled={!isDirty || createTarget.isPending || updateTarget.isPending} className="px-8">
                {createTarget.isPending || updateTarget.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UnsavedWarning 
        open={showWarning} 
        onOpenChange={setShowWarning} 
        onConfirm={() => { setShowWarning(false); closeForm(); }} 
        onCancel={() => setShowWarning(false)} 
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the revenue target and remove it from all dashboards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteId && deleteTarget.mutate(deleteId)}>
              Delete Target
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Card>
  );
}
