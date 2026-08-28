"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SettingsHeader from "@/features/settings/components/SettingsHeader";
import SettingsSidebar from "@/features/settings/components/SettingsSidebar";
import ProfileSettings from "@/features/settings/components/ProfileSettings";
import NotificationsSettings from "@/features/settings/components/NotificationsSettings";
import WorkspaceSettings from "@/features/settings/components/WorkspaceSettings";
import SubscriptionSettings from "@/features/settings/components/SubscriptionSettings";
import IntegrationsSettings from "@/features/settings/components/IntegrationsSettings";
import SecuritySettings from "@/features/settings/components/SecuritySettings";
import SessionsSettings from "@/features/settings/components/SessionsSettings";
import AuditLogSettings from "@/features/settings/components/AuditLogSettings";
import HelpCenterSettings from "@/features/settings/components/HelpCenterSettings";
import ContactSupportSettings from "@/features/settings/components/ContactSupportSettings";

import { motion, AnimatePresence } from "framer-motion";
import { CRMPageContainer } from "@/shared/components/crm";
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
    (user as any)?.isSuperAdmin === true;

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
      router.replace("/pricing");
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
    }
  }, [rawSectionParam, router]);

  // Validate permission and fallback to first permitted section if unauthorized
  useEffect(() => {
    if (isInitializing) return;

    const authorized = isSectionAuthorized(
      activeSection,
      user?.role,
      access?.permissions || [],
      isSuperAdmin
    );

    if (!authorized) {
      const authorizedNav = getAuthorizedSettingsNav(
        user?.role,
        access?.permissions || [],
        isSuperAdmin
      );
      const fallbackSection = authorizedNav[0]?.items[0]?.id || "profile";
      setActiveSection(fallbackSection);
      const newUrl = fallbackSection === "profile" ? "/settings" : `/settings?section=${fallbackSection}`;
      router.replace(newUrl);
    }
  }, [activeSection, user?.role, access?.permissions, isSuperAdmin, isInitializing, router]);

  // Sync state if URL query changes externally
  useEffect(() => {
    if (rawSectionParam) {
      const canonical = resolveCanonicalSectionId(rawSectionParam);
      if (!canonical.endsWith("_redirect") && canonical !== activeSection) {
        setActiveSection(canonical);
      }
    } else if (activeSection !== "profile") {
      setActiveSection("profile");
    }
  }, [rawSectionParam, activeSection]);

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

  const handleSectionChange = useCallback((section: string) => {
    const canonical = resolveCanonicalSectionId(section);
    if (canonical.endsWith("_redirect")) return;
    setActiveSection(canonical);
    const newUrl = canonical === "profile" ? "/settings" : `/settings?section=${canonical}`;
    window.history.pushState({ section: canonical }, "", newUrl);
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

      // Support
      case "help-center":
        return <HelpCenterSettings />;
      case "contact-support":
        return <ContactSupportSettings />;

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

  return (
    <CRMPageContainer className="flex-1 min-h-0 h-full flex flex-col pb-20 md:pb-3 lg:pb-3.5 lg:overflow-hidden">
      {/* Dynamic Page Header */}
      <div className="shrink-0 pt-0.5 pb-1">
        <SettingsHeader activeSection={activeSection} />
      </div>

      {/* Body - Independent scrolling on desktop */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5.5 lg:overflow-hidden">
        {/* Secondary Sidebar Navigation (240px) */}
        <div className="w-full lg:w-[240px] shrink-0 lg:h-full lg:overflow-y-auto pr-1 custom-scrollbar">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </div>

        {/* Content Column */}
        <div
          ref={contentRef}
          className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto pr-1.5 pb-2 custom-scrollbar"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </CRMPageContainer>
  );
};

export default SettingsPage;
