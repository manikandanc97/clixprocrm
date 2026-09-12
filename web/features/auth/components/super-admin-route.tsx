"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import AuthLoadingScreen from "./auth-loading-screen";

type SuperAdminRouteProps = {
  children: React.ReactNode;
};

export default function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, user } = useAuth();

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const isSuperAdmin =
      user?.role?.toUpperCase() === "SUPER_ADMIN" ||
      user?.role?.toUpperCase() === "SUPER ADMIN" ||
      user?.isSuperAdmin === true;

    if (!isSuperAdmin) {
      // Non-super-admin user attempting to access /super-admin
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isInitializing, router, user]);

  if (isInitializing || (isAuthenticated && !user) || !isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  const isSuperAdmin =
    user?.role?.toUpperCase() === "SUPER_ADMIN" ||
    user?.role?.toUpperCase() === "SUPER ADMIN" ||
    user?.isSuperAdmin === true;

  if (!isSuperAdmin) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

