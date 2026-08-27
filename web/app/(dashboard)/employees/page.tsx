"use client";

import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  TrendingUp,
  User,
  Edit2,
  Trash2,
  Power,
  Loader2
} from "lucide-react";
import { 
  CRMPageContainer, 
  CRMPageHeader, 
  CRMMetricsGrid, 
  MetricCard, 
  CRMCard,
  DataTable,
  CRMTableHeader,
  CRMTableBody,
  CRMTableRow,
  CRMTableCell,
  CRMTableHeaderCell,
  CRMToolbar,
  CRMStatusBadge,
  ActivityTimeline,
  CRMPageSection,
  CRMPagination,
} from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useEmployees, useToggleEmployeeStatus, useDeleteEmployee } from "@/shared/hooks/use-hrm";
// import { } from "@/shared/ui/progress";
import { toast } from "sonner";
import { FormModal } from "@/shared/components/form-modal";
import { EmployeesSkeleton } from "@/features/employees/components/EmployeesSkeleton";
import { EmployeeForm } from "@/features/forms/EmployeeForm";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useViewMode } from "@/shared/hooks/useViewMode";
import { EmployeesGrid } from "@/features/employees/components/EmployeesGrid";
import { AnimatePresence, motion } from "framer-motion";

const getSafeStr = (val: unknown) => (typeof val === 'string' ? val : typeof val === 'object' && val !== null ? (val as Record<string, unknown>).name as string || '' : String(val || ''));

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useViewMode("employees", "list");
  const { data: hrmData, isLoading: loading } = useEmployees();
  
  const employees = hrmData?.employees || [];
  const employeeStats = hrmData?.stats || [];
  const employeeActivities = hrmData?.recentActivities || [];
  
  const searchParams = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const toggleStatusMutation = useToggleEmployeeStatus();
  const deleteMutation = useDeleteEmployee();

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      // Avoid synchronous setState during render/effect cycle that might cause cascading renders
      const timer = setTimeout(() => {
        setIsAddModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredEmployees = employees.filter(emp => {
    const nameMatch = getSafeStr(emp.name).toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = getSafeStr(emp.email).toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = getSafeStr(emp.role).toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch || roleMatch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) {
    return <EmployeesSkeleton viewMode={viewMode} />;
  }

  const handleAddEmployee = () => {
    setIsAddModalOpen(true);
  };

  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Employee Directory"
        subtitle="Manage your workforce, monitor performance, and track department growth."
        badge="HR Management"
        icon={Users}
        actions={[
          {
            label: "Add Employee",
            icon: UserPlus,
            onClick: handleAddEmployee,
            variant: "default",
          },
        ]}
      />

      {/* Stats Grid */}
      <CRMMetricsGrid cols={3}>
        {employeeStats.map((stat, i) => {
          const colors = ["indigo", "emerald", "orange"] as const;
          return (
            <MetricCard
              key={i}
              {...stat}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              color={(stat as any).color || colors[i % colors.length]}
              delay={i * 0.1}
            />
          );
        })}
      </CRMMetricsGrid>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Table Area */}
        <div className="lg:col-span-3 space-y-6">
          <CRMToolbar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            placeholder="Search employees by name or department..."
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {viewMode === "list" || viewMode === "table" ? (
                <DataTable>
                  <CRMTableHeader>
                    <CRMTableRow>
                      <CRMTableHeaderCell>Employee</CRMTableHeaderCell>
                      <CRMTableHeaderCell>Role</CRMTableHeaderCell>
                      <CRMTableHeaderCell>Status</CRMTableHeaderCell>
                      <CRMTableHeaderCell>Joined Date</CRMTableHeaderCell>
                      <CRMTableHeaderCell className="text-right">Actions</CRMTableHeaderCell>
                    </CRMTableRow>
                  </CRMTableHeader>
                  <CRMTableBody>
                    {filteredEmployees.length > 0 ? (
                      paginatedEmployees.map((emp) => (
                        <CRMTableRow key={emp.id} className="cursor-default">
                          <CRMTableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={""} alt={emp.name} />
                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div
                                  onClick={() => { setSelectedEmployee(emp); setIsViewModalOpen(true); }}
                                  className="font-bold text-sm tracking-tight text-foreground hover:text-primary cursor-pointer transition-colors"
                                >
                                  {emp.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">{emp.email}</div>
                              </div>
                            </div>
                          </CRMTableCell>
                          <CRMTableCell>
                            <span className="text-sm font-semibold capitalize">{getSafeStr(emp.role).toLowerCase()}</span>
                          </CRMTableCell>
                          <CRMTableCell>
                            <CRMStatusBadge tone={emp.status === 'ACTIVE' ? 'success' : 'warning'}>
                              {emp.status}
                            </CRMStatusBadge>
                          </CRMTableCell>
                          <CRMTableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(emp.createdAt).toLocaleDateString()}
                            </span>
                          </CRMTableCell>
                          <CRMTableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-elevated border-border bg-popover/95 backdrop-blur-xl">
                                <DropdownMenuItem onClick={() => { setSelectedEmployee(emp); setIsViewModalOpen(true); }} className="cursor-pointer py-2.5 rounded-xl group">
                                  <User className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="font-semibold text-sm">View Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedEmployee(emp); setIsEditModalOpen(true); }} className="cursor-pointer py-2.5 rounded-xl group">
                                  <Edit2 className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="font-semibold text-sm">Edit Employee</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => {
                                    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                    toggleStatusMutation.mutate(
                                      { id: emp.id, status: newStatus },
                                      { onSuccess: () => toast.success(`Employee ${newStatus.toLowerCase()}d`) }
                                    );
                                  }}
                                  className="cursor-pointer py-2.5 rounded-xl group"
                                >
                                  <Power className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="font-semibold text-sm">{emp.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  variant="destructive"
                                  onClick={() => { setSelectedEmployee(emp); setIsDeleteModalOpen(true); }}
                                  className="cursor-pointer py-2.5 rounded-xl group"
                                >
                                  <Trash2 className="mr-3 h-4 w-4 transition-colors" />
                                  <span className="font-bold text-sm transition-colors">Delete Employee</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </CRMTableCell>
                        </CRMTableRow>
                      ))
                    ) : (
                      <CRMTableRow className="hover:bg-transparent border-0">
                        <CRMTableCell colSpan={5} className="p-4 border-0">
                          <EmptyState
                            icon={Users}
                            title="No employees found"
                            description="No employees match the current search or filters."
                          />
                        </CRMTableCell>
                      </CRMTableRow>
                    )}
                  </CRMTableBody>
                </DataTable>
              ) : filteredEmployees.length > 0 ? (
                <EmployeesGrid
                  employees={paginatedEmployees}
                  onViewDetails={(emp) => { setSelectedEmployee(emp); setIsViewModalOpen(true); }}
                  onEdit={(emp) => { setSelectedEmployee(emp); setIsEditModalOpen(true); }}
                  onDelete={(emp) => { setSelectedEmployee(emp); setIsDeleteModalOpen(true); }}
                  onToggleStatus={(emp) => {
                    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    toggleStatusMutation.mutate(
                      { id: emp.id, status: newStatus },
                      { onSuccess: () => toast.success(`Employee ${newStatus.toLowerCase()}d`) }
                    );
                  }}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No employees found"
                  description="No employees match the current search or filters."
                />
              )}

              <CRMPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredEmployees.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(size) => {
                  setRowsPerPage(size);
                  setCurrentPage(1);
                }}
                itemName="Employees"
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <CRMPageSection title="Recent Activity">
            <CRMCard className="p-6">
              <ActivityTimeline items={employeeActivities} />
              <Button variant="ghost" className="w-full mt-6 text-[10px] font-bold uppercase tracking-widest text-primary h-9">
                View All Activity
              </Button>
            </CRMCard>
          </CRMPageSection>

          <CRMPageSection title="Performance Overview">
            <CRMCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Dept</div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-lg font-bold tracking-tight">Sales Team</h4>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Average Performance: 96%</p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">+5 more</span>
                </div>
              </div>
              <Button className="w-full h-9 bg-primary/10 hover:bg-primary/20 text-primary border-none text-xs font-bold">
                Analytics Report
              </Button>
            </CRMCard>
          </CRMPageSection>
        </div>
      </div>

      <FormModal
        title="Onboard New Employee"
        description="Add a new team member to your organization."
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        size="lg"
      >
        <EmployeeForm 
          onSuccess={() => setIsAddModalOpen(false)} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      </FormModal>

      <FormModal
        title="Edit Employee"
        description="Update employee details and roles."
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        size="lg"
      >
        {selectedEmployee && (
          <EmployeeForm 
            initialData={selectedEmployee}
            onSuccess={() => setIsEditModalOpen(false)} 
            onCancel={() => setIsEditModalOpen(false)} 
          />
        )}
      </FormModal>

      <FormModal
        title="Employee Details"
        description="Read-only view of employee information."
        isOpen={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        size="md"
      >
        {selectedEmployee && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Name</label>
                <div className="font-medium">{selectedEmployee.name}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                <div className="font-medium">{selectedEmployee.email}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Role</label>
                <div className="font-medium capitalize">{getSafeStr(selectedEmployee.role).toLowerCase()}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                <div>
                  <CRMStatusBadge tone={selectedEmployee.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {selectedEmployee.status}
                  </CRMStatusBadge>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Joined Date</label>
                <div className="font-medium">{new Date(selectedEmployee.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-border mt-6">
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </FormModal>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedEmployee?.name}&apos;s account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate(selectedEmployee?.id, {
                  onSuccess: () => {
                    toast.success("Employee deleted permanently");
                    setIsDeleteModalOpen(false);
                  }
                });
              }}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Employee"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CRMPageContainer>
  );
}
