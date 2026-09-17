"use client";

import React from "react";
import { Shield, Plus, RotateCcw, Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMToolbar,
  CRMPagination,
} from "@/shared/components/crm";
import { useRolesData } from "./_components/use-roles-data";
import { RolesDataTable } from "./_components/RolesDataTable";
import { RoleEditorModal } from "./_components/RoleEditorModal";
import { RoleDetailsDialog } from "./_components/RoleDetailsDialog";
import { RoleDeleteDialog } from "./_components/RoleDeleteDialog";
import { getRoleColor } from "./_components/role-utils";

export default function RoleManagementPage() {
  const {
    paginatedRoles,
    isInitialLoading,
    canManageRoles,
    canEditRole,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    hasActiveFilters,
    handleClearFilters,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    totalRoles,
    editorOpen,
    setEditorOpen,
    editingRole,
    formData,
    setFormData,
    isFormDirty,
    isSaving,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveEditor,
    viewDialogOpen,
    setViewDialogOpen,
    viewingRole,
    handleOpenView,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deletingRole,
    replacementRoleId,
    setReplacementRoleId,
    availableReplacementRoles,
    isDeleting,
    handleOpenDelete,
    handleDeleteConfirm,
    exportCSV,
  } = useRolesData();

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <CRMPageHeader
        title="Role Management"
        description="Configure access control, module permissions, and manage user roles across your organization."
        icon={Shield}
        primaryAction={
          canManageRoles
            ? {
                label: "Add Role",
                icon: Plus,
                onClick: handleOpenCreate,
              }
            : undefined
        }
      />

      {/* 2. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Canonical Toolbar */}
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search roles by name..."
          filters={
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  aria-label="Filter by role type"
                  className="h-9 w-[135px] text-xs font-semibold bg-background border-border/70 shadow-xs cursor-pointer"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="SYSTEM">System Roles</SelectItem>
                  <SelectItem value="CUSTOM">Custom Roles</SelectItem>
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
                  className="h-9 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Reset Filters</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-9 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Export</span>
              </Button>
            </div>
          }
        />

        {/* Canonical Table */}
        <RolesDataTable
          roles={paginatedRoles}
          isLoading={isInitialLoading}
          sortConfig={sortConfig}
          onSort={setSort}
          canManageRoles={canManageRoles}
          canEditRole={canEditRole}
          onViewRole={handleOpenView}
          onEditRole={handleOpenEdit}
          onDeleteRole={handleOpenDelete}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          onAddRole={handleOpenCreate}
        />

        {/* Canonical Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalRoles}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          itemName="Roles"
          pageSizeOptions={[10, 25, 50, 100]}
          alwaysShow={true}
        />
      </div>

      {/* ── Create / Edit Role Modal ── */}
      <RoleEditorModal
        isOpen={editorOpen}
        onOpenChange={setEditorOpen}
        editingRole={editingRole}
        formData={formData}
        setFormData={setFormData}
        isFormDirty={isFormDirty}
        isPending={isSaving}
        onSave={handleSaveEditor}
      />

      {/* ── View Role Details Modal ── */}
      <RoleDetailsDialog
        isOpen={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        role={viewingRole}
        roleColor={getRoleColor(viewingRole)}
      />

      {/* ── Safe Delete & Reassignment Modal ── */}
      <RoleDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deletingRole={deletingRole}
        replacementRoleId={replacementRoleId}
        setReplacementRoleId={setReplacementRoleId}
        availableReplacementRoles={availableReplacementRoles}
        isPending={isDeleting}
        onConfirmDelete={handleDeleteConfirm}
      />
    </CRMPageContainer>
  );
}
