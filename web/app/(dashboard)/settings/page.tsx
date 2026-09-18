"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SettingsHeader from "@/features/settings/components/SettingsHeader";
import ProfileSettings from "@/features/settings/components/ProfileSettings";
import NotificationsSettings from "@/features/settings/components/NotificationsSettings";
import WorkspaceSettings from "@/features/settings/components/WorkspaceSettings";
import SubscriptionSettings from "@/features/settings/components/SubscriptionSettings";
import IntegrationsSettings from "@/features/settings/components/IntegrationsSettings";
import SecuritySettings from "@/features/settings/components/SecuritySettings";
import SessionsSettings from "@/features/settings/components/SessionsSettings";
import AuditLogSettings from "@/features/settings/components/AuditLogSettings";

import { motion, AnimatePresence } from "framer-motion";
import { CRMPageContainer } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  resolveCanonicalSectionId,
  isSectionAuthorized,
  getAuthorizedSettingsNav,
} from "@/features/settings/lib/settings-nav-config";

const SettingsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, access, isInitializing } = useAuth();

  const isSuperAdmin =
    user?.role?.toUpperCase() === "SUPER_ADMIN" ||
    user?.role?.toUpperCase() === "SUPERADMIN" ||
    user?.isSuperAdmin === true;

  const rawSectionParam = searchParams.get("section");
  const canonicalInitial = resolveCanonicalSectionId(rawSectionParam);

  const [activeSection, setActiveSection] = useState<string>(
    canonicalInitial.endsWith("_redirect") ? "profile" : canonicalInitial
  );

  // Handle backward-compatibility redirects for migrated contextual settings
  useEffect(() => {
    if (!rawSectionParam) return;
    const resolved = resolveCanonicalSectionId(rawSectionParam);
    if (resolved === "pricing_redirect") {
      router.replace("/upgrade");
    } else if (resolved === "roles_redirect") {
      router.replace("/role-management");
    } else if (resolved === "members_redirect") {
      router.replace("/employees");
    } else if (resolved === "invoicing_redirect") {
      router.replace("/invoices?customize=true");
    } else if (resolved === "ai_settings_redirect") {
      router.replace("/ai?customize=true");
    } else if (resolved === "preferences_redirect") {
      router.replace("/settings?section=profile");
    } else if (resolved === "pipelines_redirect") {
      router.replace("/deals?customize=pipelines");
    } else if (resolved === "lead_sources_redirect") {
      router.replace("/contacts?status=lead&customize=sources");
    } else if (resolved === "sales_preferences_redirect") {
      router.replace("/deals?customize=probability");
    } else if (resolved === "revenue_targets_redirect") {
      router.replace("/reports?customize=targets");
    } else if (resolved === "help_redirect") {
      router.replace("/support");
    }
  }, [rawSectionParam, router]);

  // Sync state if URL query changes externally
  const [prevRawSection, setPrevRawSection] = useState(rawSectionParam);
  if (rawSectionParam !== prevRawSection) {
    setPrevRawSection(rawSectionParam);
    if (rawSectionParam) {
      const canonical = resolveCanonicalSectionId(rawSectionParam);
      if (!canonical.endsWith("_redirect") && canonical !== activeSection) {
        setActiveSection(canonical);
      }
    } else if (activeSection !== "profile") {
      setActiveSection("profile");
    }
  }

  // Validate permission and fallback to first permitted section if unauthorized
  const authorized = isSectionAuthorized(
    activeSection,
    user?.role,
    access?.permissions || [],
    isSuperAdmin
  );

  useEffect(() => {
    if (isInitializing) return;

    if (!authorized) {
      const authorizedNav = getAuthorizedSettingsNav(
        user?.role,
        access?.permissions || [],
        isSuperAdmin
      );
      const fallbackSection = authorizedNav[0]?.items[0]?.id || "profile";
      const newUrl = fallbackSection === "profile" ? "/settings" : `/settings?section=${fallbackSection}`;
      router.replace(newUrl);
    }
  }, [authorized, user?.role, access?.permissions, isSuperAdmin, isInitializing, router]);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("section");
      const canonical = resolveCanonicalSectionId(s);
      if (!canonical.endsWith("_redirect")) {
        setActiveSection(canonical);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      // My Account
      case "profile":
        return <ProfileSettings />;
      case "notifications":
        return <NotificationsSettings />;

      // Workspace
      case "general":
        return <WorkspaceSettings />;

      // Business & Billing
      case "billing":
        return <SubscriptionSettings />;

      // Integrations & API
      case "integrations":
        return <IntegrationsSettings />;

      // Security & Governance
      case "security-privacy":
        return <SecuritySettings />;
      case "sessions":
        return <SessionsSettings />;
      case "audit-log":
        return <AuditLogSettings />;

      default:
        return <ProfileSettings />;
    }
  };

  const contentRef = React.useRef<HTMLDivElement>(null);

  // Scroll content to top when section changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activeSection]);

  const isTableSection = activeSection === "audit-log";

  return (
    <CRMPageContainer>
      {/* Dynamic Page Header */}
      <div className="shrink-0 pt-0.5 pb-1">
        <SettingsHeader activeSection={activeSection} />
      </div>

      {/* Content Area - Full width with independent smooth vertical scrolling or dedicated table layout */}
      <div
        ref={contentRef}
        className={cn(
          "w-full",
          isTableSection ? "flex flex-col flex-1 min-h-0" : "sidebar-scroll"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={cn("flex flex-col", isTableSection && "flex-1 min-h-0")}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>
    </CRMPageContainer>
  );
};

export default SettingsPage;
