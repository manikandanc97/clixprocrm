"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  TrendingUp,
  User,
  Edit2,
  Trash2,
  Power,
  Loader2,
  UserCheck,
  Building2,
  CalendarOff
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
  CRMRoleBadge,
  ActivityTimeline,
  CRMPageSection,
  CRMPagination,
} from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
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

import { useViewMode } from "@/shared/hooks/useViewMode";
import { EmployeesGrid } from "@/features/employees/components/EmployeesGrid";
import { AnimatePresence, motion } from "framer-motion";

const STAT_ICONS: Record<string, typeof Users> = {
  "Total Employees": Users,
  "Active Now": UserCheck,
  "Departments": Building2,
  "On Leave": CalendarOff,
};

const STAT_COLORS: Record<string, "indigo" | "emerald" | "orange" | "violet"> = {
  "Total Employees": "indigo",
  "Active Now": "emerald",
  "Departments": "orange",
  "On Leave": "violet",
};

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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null,
  });

  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  const filteredEmployees = employees.filter(emp => {
    const nameMatch = getSafeStr(emp.name).toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = getSafeStr(emp.email).toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = getSafeStr(emp.role).toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch || roleMatch;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    if (sortConfig.key === "name") {
      return getSafeStr(a.name).localeCompare(getSafeStr(b.name)) * dir;
    }
    if (sortConfig.key === "role") {
      return getSafeStr(a.role).localeCompare(getSafeStr(b.role)) * dir;
    }
    if (sortConfig.key === "status") {
      return getSafeStr(a.status).localeCompare(getSafeStr(b.status)) * dir;
    }
    if (sortConfig.key === "createdAt") {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedEmployees.length / rowsPerPage) || 1;
  const paginatedEmployees = sortedEmployees.slice(
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
      <div className="shrink-0">
        <CRMMetricsGrid cols={4}>
          {employeeStats.map((stat, i) => {
            const defaultColors = ["indigo", "emerald", "orange", "violet"] as const;
            const icon = STAT_ICONS[stat.title] || Users;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const color = (stat as any).color || STAT_COLORS[stat.title] || defaultColors[i % defaultColors.length];
            return (
              <MetricCard
                key={i}
                {...stat}
                icon={icon}
                color={color}
                delay={i * 0.1}
              />
            );
          })}
        </CRMMetricsGrid>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 flex-1 min-h-0">
        {/* Main Table Area */}
        <div className="lg:col-span-3 flex flex-col gap-3.5 sm:gap-4 min-h-0 flex-1">
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
              className="flex-1 flex flex-col min-h-0 gap-3.5 sm:gap-4"
            >
              {viewMode === "list" || viewMode === "table" ? (
                <DataTable hasPagination={sortedEmployees.length > rowsPerPage}>
                  <CRMTableHeader>
                    <CRMTableRow>
                      <CRMTableHeaderCell>
                        <DataTableColumnHeader
                          title="Employee"
                          sortable
                          sortDirection={sortConfig.key === "name" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("name", dir)}
                        />
                      </CRMTableHeaderCell>
                      <CRMTableHeaderCell>
                        <DataTableColumnHeader
                          title="Role"
                          sortable
                          sortDirection={sortConfig.key === "role" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("role", dir)}
                        />
                      </CRMTableHeaderCell>
                      <CRMTableHeaderCell>
                        <DataTableColumnHeader
                          title="Status"
                          sortable
                          sortDirection={sortConfig.key === "status" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("status", dir)}
                        />
                      </CRMTableHeaderCell>
                      <CRMTableHeaderCell>
                        <DataTableColumnHeader
                          title="Joined Date"
                          sortable
                          sortDirection={sortConfig.key === "createdAt" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("createdAt", dir)}
                        />
                      </CRMTableHeaderCell>
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
                            <CRMRoleBadge role={emp.role} />
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
              ) : sortedEmployees.length > 0 ? (
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
                totalItems={sortedEmployees.length}
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
        <div className="flex flex-col gap-3.5 sm:gap-4 min-h-0">
          <CRMPageSection title="Recent Activity" className="flex-1 min-h-0 flex flex-col">
            <CRMCard className="p-4 flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              <div className="overflow-y-auto flex-1 sidebar-scroll pr-1">
                <ActivityTimeline items={employeeActivities.slice(0, 4)} />
              </div>
              <Button variant="ghost" className="w-full mt-3 text-[10px] font-bold uppercase tracking-widest text-primary h-8 shrink-0">
                View All Activity
              </Button>
            </CRMCard>
          </CRMPageSection>

          <CRMPageSection title="Performance Overview" className="shrink-0">
            <CRMCard className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Top Dept</div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-base font-bold tracking-tight">Sales Team</h4>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Average Performance: 96%</p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-2.5">
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
              <Button className="w-full h-8 bg-primary/10 hover:bg-primary/20 text-primary border-none text-xs font-bold">
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
                <div className="mt-1">
                  <CRMRoleBadge role={selectedEmployee.role} size="md" />
                </div>
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
