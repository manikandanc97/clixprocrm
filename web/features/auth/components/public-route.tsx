"use client";

/**
 * PublicRoute
 *
 * Wraps login/register pages. If user is already authenticated,
 * redirect them to /dashboard.
 *
 * During "initializing" phase we show nothing (blank) to avoid
 * flashing the login form to users who are already logged in.
 * The auth loading screen is shown by ProtectedRoute on the dashboard
 * side; public routes just render null during init to stay invisible.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import AuthLoadingScreen from "./auth-loading-screen";

type PublicRouteProps = {
  children: React.ReactNode;
};

export default function PublicRoute({ children }: PublicRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, user } = useAuth();

  useEffect(() => {
    if (!isInitializing && isAuthenticated && user) {
      const isSuperAdmin =
        user.role?.toUpperCase() === "SUPER_ADMIN" ||
        user.role?.toUpperCase() === "SUPER ADMIN" ||
        (user as any)?.isSuperAdmin === true;

      if (isSuperAdmin) {
        router.replace("/super-admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isInitializing, router, user]);

  // During init or when redirecting authenticated user, show loading screen instead of blank null
  if (isInitializing || isAuthenticated) {
    return <AuthLoadingScreen error={null} stage={isAuthenticated ? "ready" : undefined} />;
  }

  return <>{children}</>;
}
