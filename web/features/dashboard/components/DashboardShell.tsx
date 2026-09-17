"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/features/dashboard/components/sidebar";
import Topbar from "@/features/dashboard/components/topbar";
import { useSidebar } from "@/features/dashboard/components/SidebarContext";
import { MobileBottomNav } from "@/features/dashboard/components/MobileBottomNav";
import { useMediaQuery } from "@/shared/hooks/use-media-query";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen h-dvh bg-background overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

      {/* Desktop Sidebar — fixed, sits outside flow */}
      <Sidebar />

      {/* Main Content Column — offset by sidebar width, fills remaining height */}
      <div
        style={{
          paddingLeft: mounted && isDesktop ? (isCollapsed ? "86px" : "270px") : "0px",
        }}
        className="flex flex-col flex-1 min-w-0 h-full w-full transition-[padding-left] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div className="shrink-0">
          <Topbar />
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col kanban-board-scroll">
          <div
            className="w-full flex-1 min-h-0 flex flex-col pb-20 md:pb-0 animate-in fade-in-0 duration-200 ease-out motion-reduce:animate-none"
          >
            {children}
          </div>
        </main>
      </div>

      {/* Global Components */}
      <MobileBottomNav />
    </div>
  );
}












