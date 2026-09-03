"use client";

import React, { createContext, useContext } from "react";
import { useCRMStore } from "@/shared/store/useCRMStore";

type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useCRMStore(state => state.sidebarCollapsed);
  const setSidebarCollapsed = useCRMStore(state => state.setSidebarCollapsed);
  
  const toggleSidebar = React.useCallback(
    () => setSidebarCollapsed(!sidebarCollapsed),
    [sidebarCollapsed, setSidebarCollapsed]
  );

  const contextValue = React.useMemo(
    () => ({ isCollapsed: sidebarCollapsed, toggleSidebar }),
    [sidebarCollapsed, toggleSidebar]
  );
  
  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}













