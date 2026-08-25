"use client";

import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { DashboardWidgetSkeleton, ChartSkeleton } from "@/shared/components/skeletons";
import { CRMCard } from "@/shared/components/crm";
import { CardHeader, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAuth } from "@/features/auth/components/auth-provider";
import { CRM_ROLES } from "@/shared/lib/auth/rbac/roles";

interface DashboardWidgetWrapperProps {
  id: string;
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  children: ReactNode;
  skeletonRows?: number;
  skeletonType?: "list" | "chart" | "donut" | "calendar";
  customSkeleton?: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * A standardized wrapper for dashboard widgets that handles:
 * 1. Independent loading states (skeletons)
 * 2. Independent error states with retry
 * 3. RBAC (Access Control)
 * 4. Mount animations
 */
export function DashboardWidgetWrapper({
  id,
  title,
  isLoading,
  isError,
  onRetry,
  children,
  skeletonRows = 3,
  skeletonType = "list",
  customSkeleton,
  className = "w-full h-full",
  delay = 0,
}: DashboardWidgetWrapperProps) {
  const { access, user } = useAuth();
  
  // RBAC Check: Admin bypasses all checks. If not admin, verify widget access.
  const hasAccess = user?.role === CRM_ROLES.ADMIN || access.dashboardWidgets.includes(id);
  
  if (!hasAccess) {
    console.warn(`[Dashboard] Access denied for widget: ${id}`);
    return null;
  }

  const renderSkeleton = () => {
    if (customSkeleton) return customSkeleton;

    if (skeletonType === "chart") {
      return (
        <CRMCard noPadding className="h-full flex flex-col min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-end">
            <ChartSkeleton height={260} type="area" />
          </CardContent>
        </CRMCard>
      );
    }

    if (skeletonType === "donut") {
      return (
        <CRMCard noPadding className="h-full flex flex-col min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="h-7 w-14 rounded-lg" />
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col items-center justify-center">
            <ChartSkeleton height={180} type="donut" />
          </CardContent>
        </CRMCard>
      );
    }

    if (skeletonType === "calendar") {
      return (
        <CRMCard noPadding className="h-full flex flex-col min-h-[260px]">
          <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            </div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </CRMCard>
      );
    }

    return <DashboardWidgetSkeleton rows={skeletonRows} />;
  };

  const skeletonFallback = renderSkeleton();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn("min-h-[200px]", className)}
    >
      <AnimatePresence>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            {skeletonFallback}
          </motion.div>
        ) : isError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/5 text-center h-full min-h-[200px]"
          >
            <AlertCircle className="w-8 h-8 text-destructive mb-3 opacity-50" />
            <h4 className="text-sm font-bold text-foreground mb-1">{title} Failed</h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">We couldn&apos;t load this widget&apos;s data.</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="h-8 text-xs font-bold gap-2 rounded-xl border-destructive/20 hover:bg-destructive/10 transition-all active:scale-95"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <React.Suspense fallback={skeletonFallback}>
              {children}
            </React.Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
