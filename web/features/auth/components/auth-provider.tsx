"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import type React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCurrentUser, loginUser, logoutUser as clearSessionToken } from "@/shared/lib/api/auth";
import { createClient } from "@/lib/supabase/client";
import { 
  defaultRoleAccess, 
  normalizeRole, 
  type RoleAccess, 
  CRM_ROLES, 
  roleRouteConfig,
  getRolePermissions,
  hasModuleAccess,
  normalizeToModuleTitle,
  navLibrary,
} from "@/shared/lib/auth/rbac";
import { useCRMStore } from "@/shared/store/useCRMStore";

 
const _STORAGE_TOKEN_KEY = "orbit_token";
 
const _STORAGE_USER_KEY = "orbit_user";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleName?: string;
  displayName?: string;
  avatar?: string | null;
  status?: string;
  tenantId?: string | null;
  companyName?: string;
  companyLogo?: string | null;
  permissions?: string[];
  routes?: string[];
  dashboardWidgets?: string[];
  analyticsVisibility?: RoleAccess["analyticsVisibility"];
  description?: string;
};

export type AuthInitStage =
  | "connecting"
  | "restoring"
  | "loading_data"
  | "preparing"
  | "ready";

type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export type AuthContextState = {
  user: AuthUser | null;
  access: RoleAccess;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isHydrated: boolean;
  initStage: AuthInitStage;
  initError: string | null;
  login: (email: string, password: string, staySignedIn?: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  retryInit: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextState | null>(null);

const WIDGETS_BY_ROLE: Record<string, string[]> = {
  [CRM_ROLES.SUPER_ADMIN]: [
    // Org-wide KPI cards
    "revenue", "newLeads", "activeDeals", "winRate",
    // Widgets
    "salesChart", "upcomingMeetings", "hotLeads", "teamPerformance",
    "leadFunnel", "revenueTracker", "recentActivities", "pendingFollowups",
    "aiInsights", "calendarWidget", "revenueChart", "revenueTarget",
    "recentCustomers",
  ],
  [CRM_ROLES.ADMIN]: [
    // Org-wide KPI cards
    "revenue", "newLeads", "activeDeals", "winRate",
    // Widgets
    "salesChart", "upcomingMeetings", "hotLeads", "teamPerformance",
    "leadFunnel", "revenueTracker", "recentActivities", "pendingFollowups",
    "aiInsights", "calendarWidget", "revenueChart", "revenueTarget",
    "recentCustomers",
  ],
  [CRM_ROLES.MANAGER]: [
    // Team-scoped KPI cards (org-wide metrics visible to managers)
    "revenue", "newLeads", "activeDeals", "winRate",
    // Widgets
    "salesChart", "upcomingMeetings", "hotLeads", "teamPerformance",
    "leadFunnel", "recentActivities", "pendingFollowups", "calendarWidget",
    "revenueChart", "revenueTarget",
  ],
  [CRM_ROLES.SALES]: [
    // Own KPI cards
    "revenue", "activeDeals", "winRate",
    // Widgets
    "salesChart", "upcomingMeetings", "hotLeads", "leadFunnel",
    "recentActivities", "pendingFollowups", "calendarWidget",
  ],
  [CRM_ROLES.SUPPORT]: [
    "upcomingMeetings", "recentActivities", "pendingFollowups", "calendarWidget",
  ],
  // Employee: personal widgets only — no org-wide KPI cards
  [CRM_ROLES.EMPLOYEE]: [
    "myTasks", "myMeetings", "myLeads", "myDeals", "myActivities",
    "upcomingMeetings", "pendingFollowups", "calendarWidget",
  ],
};

function buildAccess(user: AuthUser | null): RoleAccess {
  if (!user) {
    return defaultRoleAccess;
  }

  const roleKey = normalizeRole(user.role);
  const isSuperAdmin = roleKey === CRM_ROLES.SUPER_ADMIN || (user as any).isSuperAdmin === true;

  const allowedRoutes = isSuperAdmin
    ? ["*", ...(roleRouteConfig[CRM_ROLES.SUPER_ADMIN] || [])]
    : roleRouteConfig[roleKey]
    ? [...roleRouteConfig[roleKey]]
    : ["/dashboard"];

  const resolvedPermissions = isSuperAdmin
    ? ["*"]
    : user.permissions && user.permissions.length > 0 
    ? user.permissions 
    : getRolePermissions(roleKey);
    
  if (!allowedRoutes.includes("/ai")) {
    allowedRoutes.push("/ai");
  }

  if (resolvedPermissions.includes("Help Center") || roleKey === CRM_ROLES.ADMIN || isSuperAdmin) {
    if (!allowedRoutes.includes("/help")) {
      allowedRoutes.push("/help");
    }
  }

  // Ensure all permitted module routes are dynamically authorized
  for (const perm of resolvedPermissions) {
    const title = normalizeToModuleTitle(perm);
    if (title) {
      const navItem = Object.values(navLibrary).find((n) => n.title === title);
      if (navItem?.href && !allowedRoutes.includes(navItem.href)) {
        allowedRoutes.push(navItem.href);
      }
    }
  }

  return {
    roleName:
      user.roleName ||
      roleKey
        .split("_")
        .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
        .join(" "),
    description: user.description || defaultRoleAccess.description,
    permissions: resolvedPermissions,
    routes: allowedRoutes,
    dashboardWidgets: WIDGETS_BY_ROLE[roleKey] || WIDGETS_BY_ROLE[CRM_ROLES.EMPLOYEE],
    analyticsVisibility: user.analyticsVisibility || "self",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [initStage, setInitStage] = useState<AuthInitStage>("connecting");
  const [initError, setInitError] = useState<string | null>(null);
  // Guard: prevents refreshUser() from running during/after an explicit logout.
  // Without this, a stale getSession() result during signOut can restore auth state.
  const isLoggingOut = useRef(false);
  const hasFetched = useRef(false);

  /**
   * cleanupAuthState — clears all React auth state without calling signOut().
   * Used by the SIGNED_OUT event handler to avoid a feedback loop:
   *   logout() → clearSessionToken() → signOut() → SIGNED_OUT → logout() → ...
   */
  const cleanupAuthState = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("has_session");

      // Defense-in-depth: remove any body-level styles that Radix dialogs may have
      // leaked if they were unmounted during the auth state transition without
      // proper cleanup (e.g., AlertDialog was open when ProtectedRoute unmounted
      // the dashboard tree). These inline styles block interactions on /login.
      document.body.style.removeProperty("pointer-events");
      document.body.style.removeProperty("overflow");
    }
    setUser(null);
    setStatus("unauthenticated");
    setInitStage("connecting");
    setInitError(null);
    setLoading(false);           // Prevent stuck loading state after logout
    setIsHydrated(true);         // Keep hydrated so login page renders immediately (not initializing)
    hasFetched.current = false;  // Allow SIGNED_IN event to re-run refreshUser on next login
    queryClient.clear();
    useCRMStore.getState().reset();
  }, [queryClient]);

  const logout = useCallback(async () => {
    if (isLoggingOut.current) return; // prevent re-entrant calls
    isLoggingOut.current = true;

    // 1. Clean up React state immediately
    cleanupAuthState();

    // 2. Call API to sign out (this fires the SIGNED_OUT event,
    //    which is handled by cleanupAuthState — not logout() — to break the loop)
    try {
      await clearSessionToken(); // hits /api/auth/logout
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      isLoggingOut.current = false;
    }
  }, [cleanupAuthState]);

  const refreshUser = useCallback(async () => {
    // Do not run if a logout is in progress.
    // Without this guard, getSession() can return a stale Supabase session
    // (not yet invalidated in client cache) and restore has_session / auth state
    // in the middle of a signOut flow.
    if (isLoggingOut.current) return;

    try {
      setInitError(null);
      setInitStage("connecting");

      let hasSessionLocal = typeof window !== "undefined" ? localStorage.getItem("has_session") : null;
      
      // Fix for OAuth login: Check if Supabase has a session even if localStorage doesn't.
      // Only do this when NOT in a logged-out state to prevent re-hydration after signOut.
      const { data: { session } } = await createClient().auth.getSession();
      if (session && !hasSessionLocal && !isLoggingOut.current) {
        if (typeof window !== "undefined") localStorage.setItem("has_session", "1");
        hasSessionLocal = "1";
      }

      if (typeof window !== "undefined" && !hasSessionLocal) {
        setStatus("unauthenticated");
        return;
      }

      // Double-check logout guard after the async getSession() call
      if (isLoggingOut.current) return;

      setLoading(true);
      setInitStage("restoring");

      setInitStage("loading_data");
      const currentUser = await fetchCurrentUser();

      // Final guard: if logout happened while fetchCurrentUser was in flight, discard result
      if (isLoggingOut.current) return;

      if (!currentUser) {
        if (typeof window !== "undefined") localStorage.removeItem("has_session");
        setStatus("unauthenticated");
        return;
      }
      setInitStage("preparing");
      setUser(currentUser);
      setStatus("authenticated");
      setInitStage("ready");
     
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.message === "NEEDS_ONBOARDING") {
        if (typeof window !== "undefined" && window.location.pathname !== "/onboarding") {
          window.location.href = "/onboarding";
          return;
        }
        setStatus("unauthenticated");
        return;
      }
      console.warn("Auth initialization issue:", error);
      if (typeof window !== "undefined") localStorage.removeItem("has_session");
      setInitError(error?.message || "Failed to restore session");
      setStatus("unauthenticated");
    } finally {
      setLoading(false);
    }
  }, []);

  const retryInit = useCallback(async () => {
    hasFetched.current = false;
    setInitError(null);
    setStatus("initializing");
    setInitStage("connecting");
    await refreshUser().finally(() => setIsHydrated(true));
  }, [refreshUser]);



  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
     
    refreshUser().finally(() => setIsHydrated(true));
  }, [refreshUser]);

  useEffect(() => {
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Use cleanupAuthState (not logout) to avoid the feedback loop:
        //   logout() → clearSessionToken() → signOut() → SIGNED_OUT → logout() → ...
        // Supabase has already signed out at this point; we only need to clean React state.
        cleanupAuthState();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Only run refreshUser if:
        // 1. We haven't fetched yet (e.g. OAuth redirect, page reload with existing session)
        // 2. We're not currently logging out
        // The login() function sets hasFetched.current = true before calling signInWithPassword,
        // so this branch is skipped during the normal email/password login flow — preventing
        // a duplicate fetchCurrentUser race with login()'s own setUser() call.
        if (!hasFetched.current && !isLoggingOut.current && session) {
          hasFetched.current = true;
          refreshUser().finally(() => setIsHydrated(true));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [cleanupAuthState, refreshUser]);

  const login = useCallback(async (email: string, password: string, staySignedIn?: boolean) => {
    try {
      setLoading(true);
      // Mark as fetched BEFORE calling signInWithPassword.
      // This prevents the onAuthStateChange(SIGNED_IN) handler from running a competing
      // refreshUser() at the same time as login()'s own fetchCurrentUser call.
      hasFetched.current = true;
      const response = await loginUser({ email, password, staySignedIn });

      if (typeof window !== "undefined") {
        localStorage.setItem("has_session", "1");
      }
      setUser(response.data.user);
      setStatus("authenticated");
      
      // Clear cache to ensure fresh data for the new user
      await queryClient.clear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // If login fails, reset hasFetched so a retry can proceed cleanly
      hasFetched.current = false;
      if (error.message === "NEEDS_ONBOARDING") {
        if (typeof window !== "undefined" && window.location.pathname !== "/onboarding") {
          window.location.href = "/onboarding";
          return;
        }
        setStatus("unauthenticated");
        return;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const value = useMemo<AuthContextState>(() => {
    const access = buildAccess(user);
    return {
      user,
      access,
      token: null, // Token is no longer exposed to frontend
      loading: loading || status === "initializing",
      isAuthenticated: status === "authenticated",
      isInitializing: status === "initializing",
      isHydrated,
      initStage,
      initError,
      login,
      logout,
      refreshUser,
      retryInit,
      hasPermission: (permission: string) => {
        if (!user) return false;
        const roleKey = normalizeRole(user.role);
        if (roleKey === CRM_ROLES.SUPER_ADMIN || roleKey === CRM_ROLES.ADMIN) return true;
        if (access.permissions.includes(permission)) return true;
        return hasModuleAccess(permission, access.permissions, user.role);
      },
    };
  }, [status, user, login, logout, refreshUser, retryInit, loading, isHydrated, initStage, initError, cleanupAuthState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
