"use client";

import { useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Download,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
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
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMToolbar,
  CRMPagination,
  PageErrorState,
  FormModal,
} from "@/shared/components/crm";
import { toast } from "sonner";
import { useDeleteEmployee } from "@/shared/hooks/use-hrm";
import { EmployeeForm } from "@/features/forms/EmployeeForm";
import { EmployeeType } from "@/shared/types/employee";
import {
  useEmployeesData,
  getSafeEmployeeStr,
} from "@/features/employees/hooks/use-employees-data";
import { useEmployeesUrlState } from "@/features/employees/hooks/use-employees-url-state";
import { EmployeesDataTable } from "@/features/employees/components/EmployeesDataTable";
import { EmployeeDetailsDialog } from "@/features/employees/components/EmployeeDetailsDialog";

export default function EmployeesPage() {
  // Modals & Dialogs State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeType | null>(null);

  // Deletion State
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const deleteMutation = useDeleteEmployee();

  // URL state (?new=true auto open handler)
  useEmployeesUrlState({
    onOpenAddModal: () => {
      setSelectedEmployee(null);
      setIsAddModalOpen(true);
    },
  });

  // Data & List Orchestration Hook
  const {
    paginatedEmployees,
    isLoading,
    isError,
    error,
    refetch,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    uniqueRoles,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    handleClearFilters,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    totalEmployees,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    toggleSelectAllCurrentPage,
    toggleSelectEmployee,
    exportCSV,
    handleToggleStatus,
  } = useEmployeesData();

  // Handlers for Row Actions
  const handleViewEmployee = useCallback((emp: EmployeeType) => {
    setSelectedEmployee(emp);
    setIsViewModalOpen(true);
  }, []);

  const handleEditEmployee = useCallback((emp: EmployeeType) => {
    setSelectedEmployee(emp);
    setIsEditModalOpen(true);
  }, []);

  const handleDeletePrompt = useCallback((emp: EmployeeType) => {
    setEmployeeToDelete(emp);
  }, []);

  // Single Delete Confirmation
  const handleDeleteSingle = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleting(true);
      await deleteMutation.mutateAsync(employeeToDelete.id);
      toast.success("Employee deleted successfully");
      setSelectedEmployeeIds((prev) => prev.filter((id) => id !== employeeToDelete.id));
      setEmployeeToDelete(null);
      refetch();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete employee";
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Delete Confirmation
  const handleBulkDelete = async () => {
    if (selectedEmployeeIds.length === 0) return;
    try {
      setBulkDeleting(true);
      for (const id of selectedEmployeeIds) {
        await deleteMutation.mutateAsync(id);
      }
      toast.success(`${selectedEmployeeIds.length} employee(s) deleted successfully`);
      setSelectedEmployeeIds([]);
      setBulkDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error("An error occurred during bulk deletion");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Standard Page Header */}
      <CRMPageHeader
        title="Employees"
        description="Manage your workforce, assign roles, monitor activity, and track staff performance."
        icon={Users}
        primaryAction={{
          label: "Add Employee",
          icon: UserPlus,
          onClick: () => {
            setSelectedEmployee(null);
            setIsAddModalOpen(true);
          },
        }}
      />

      {/* 2. Main Data Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Canonical Toolbar */}
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search employees by name, email..."
          selectedCount={selectedEmployeeIds.length}
          bulkActions={
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="h-7 text-xs font-semibold px-2.5 gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete Selected</span>
            </Button>
          }
          filters={
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-9 w-[130px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger
                  aria-label="Filter by role"
                  className="h-9 w-[140px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Reset Filters</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Export</span>
              </Button>
            </div>
          }
        />

        {/* 3. Table / Feedback States */}
        {isError ? (
          <PageErrorState
            title="Failed to load employees"
            message={
              error instanceof Error
                ? error.message
                : "Unable to retrieve employee records. Please check your connection and retry."
            }
            onRetry={refetch}
            className="flex-1"
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto flex flex-col">
            <EmployeesDataTable
              employees={paginatedEmployees}
              selectedEmployeeIds={selectedEmployeeIds}
              onToggleSelectAll={toggleSelectAllCurrentPage}
              onToggleSelect={toggleSelectEmployee}
              sortConfig={sortConfig}
              onSort={setSort}
              isLoading={isLoading}
              onViewEmployee={handleViewEmployee}
              onEditEmployee={handleEditEmployee}
              onToggleStatus={handleToggleStatus}
              onDeleteEmployee={handleDeletePrompt}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              onAddEmployee={() => {
                setSelectedEmployee(null);
                setIsAddModalOpen(true);
              }}
            />
          </div>
        )}

        {/* 4. Canonical Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalEmployees}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          itemName="Employees"
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* 5. Add Employee Modal */}
      <FormModal
        title="Add New Employee"
        description="Fill in employee details to create their CRM staff profile."
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setSelectedEmployee(null);
        }}
        size="md"
      >
        <EmployeeForm
          onSuccess={() => {
            setIsAddModalOpen(false);
            setSelectedEmployee(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddModalOpen(false);
            setSelectedEmployee(null);
          }}
        />
      </FormModal>

      {/* 6. Edit Employee Modal */}
      <FormModal
        title="Edit Employee"
        description="Update role, email, status, and permissions for this staff member."
        isOpen={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedEmployee(null);
        }}
        size="md"
      >
        <EmployeeForm
          initialData={
            selectedEmployee
              ? {
                  id: selectedEmployee.id,
                  name: selectedEmployee.name,
                  email: selectedEmployee.email,
                  role: selectedEmployee.role,
                  status: (["ACTIVE", "INACTIVE", "SUSPENDED"].includes(selectedEmployee.status)
                    ? selectedEmployee.status
                    : "ACTIVE") as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                }
              : undefined
          }
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
            refetch();
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
          }}
        />
      </FormModal>

      {/* 7. View Employee Details Dialog */}
      <EmployeeDetailsDialog
        employee={selectedEmployee}
        isOpen={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open && !isEditModalOpen) setSelectedEmployee(null);
        }}
      />

      {/* 8. Single Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(employeeToDelete)}
        onOpenChange={(open) => !open && setEmployeeToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Employee?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-foreground">
                {employeeToDelete ? getSafeEmployeeStr(employeeToDelete.name) : ""}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {deleting ? "Deleting..." : "Delete Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 9. Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete {selectedEmployeeIds.length} Selected Employees?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all selected staff profiles. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CRMPageContainer>
  );
}
