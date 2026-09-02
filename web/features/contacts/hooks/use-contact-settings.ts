"use client";

import { useState, useEffect, useCallback } from "react";

export interface ContactSettingsConfig {
  // 1. Contact Fields
  showJobTitle: boolean;
  showDepartment: boolean;
  showPhone: boolean;
  showSecondaryEmail: boolean;
  showSocialProfiles: boolean;

  // 2. Required Fields
  requireEmail: boolean;
  requirePhone: boolean;
  requireJobTitle: boolean;

  // 3. Duplicate Rules
  matchEmail: boolean;
  matchPhone: boolean;
  normalizeEmail: boolean;
  duplicateResolution: "warn" | "block" | "merge";

  // 4. Default Values
  defaultContactType: "Lead" | "Customer" | "Partner" | "Vendor";
  defaultLifecycleStage: "NEW" | "CONTACTED" | "ACTIVE" | "ONBOARDING" | "PROSPECT";
}

export const DEFAULT_CONTACT_SETTINGS: ContactSettingsConfig = {
  showJobTitle: true,
  showDepartment: true,
  showPhone: true,
  showSecondaryEmail: false,
  showSocialProfiles: true,

  requireEmail: true,
  requirePhone: false,
  requireJobTitle: false,

  matchEmail: true,
  matchPhone: true,
  normalizeEmail: true,
  duplicateResolution: "warn",

  defaultContactType: "Lead",
  defaultLifecycleStage: "NEW",
};

export const CONTACT_SETTINGS_STORAGE_KEY = "clixpro_contacts_settings_v1";

/**
 * Normalizes raw/legacy stored data into current ContactSettingsConfig
 */
export function parseContactSettings(raw: any): ContactSettingsConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CONTACT_SETTINGS };

  return {
    showJobTitle: typeof raw.showJobTitle === "boolean" ? raw.showJobTitle : DEFAULT_CONTACT_SETTINGS.showJobTitle,
    showDepartment: typeof raw.showDepartment === "boolean" ? raw.showDepartment : DEFAULT_CONTACT_SETTINGS.showDepartment,
    showPhone: typeof raw.showPhone === "boolean" ? raw.showPhone : (typeof raw.showPhoneDirectly === "boolean" ? raw.showPhoneDirectly : DEFAULT_CONTACT_SETTINGS.showPhone),
    showSecondaryEmail: typeof raw.showSecondaryEmail === "boolean" ? raw.showSecondaryEmail : DEFAULT_CONTACT_SETTINGS.showSecondaryEmail,
    showSocialProfiles: typeof raw.showSocialProfiles === "boolean" ? raw.showSocialProfiles : DEFAULT_CONTACT_SETTINGS.showSocialProfiles,

    requireEmail: true, // Always mandatory
    requirePhone: typeof raw.requirePhone === "boolean" ? raw.requirePhone : DEFAULT_CONTACT_SETTINGS.requirePhone,
    requireJobTitle: typeof raw.requireJobTitle === "boolean" ? raw.requireJobTitle : DEFAULT_CONTACT_SETTINGS.requireJobTitle,

    matchEmail: typeof raw.matchEmail === "boolean" ? raw.matchEmail : (typeof raw.preventEmailDupes === "boolean" ? raw.preventEmailDupes : DEFAULT_CONTACT_SETTINGS.matchEmail),
    matchPhone: typeof raw.matchPhone === "boolean" ? raw.matchPhone : (typeof raw.preventPhoneDupes === "boolean" ? raw.preventPhoneDupes : DEFAULT_CONTACT_SETTINGS.matchPhone),
    normalizeEmail: typeof raw.normalizeEmail === "boolean" ? raw.normalizeEmail : (typeof raw.caseInsensitiveEmail === "boolean" ? raw.caseInsensitiveEmail : DEFAULT_CONTACT_SETTINGS.normalizeEmail),
    duplicateResolution: ["warn", "block", "merge"].includes(raw.duplicateResolution || raw.duplicatePolicy)
      ? (raw.duplicateResolution || raw.duplicatePolicy)
      : DEFAULT_CONTACT_SETTINGS.duplicateResolution,

    defaultContactType: ["Lead", "Customer", "Partner", "Vendor"].includes(raw.defaultContactType)
      ? raw.defaultContactType
      : DEFAULT_CONTACT_SETTINGS.defaultContactType,
    defaultLifecycleStage: ["NEW", "CONTACTED", "ACTIVE", "ONBOARDING", "PROSPECT"].includes(raw.defaultLifecycleStage)
      ? raw.defaultLifecycleStage
      : DEFAULT_CONTACT_SETTINGS.defaultLifecycleStage,
  };
}

export function getStoredContactSettings(): ContactSettingsConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CONTACT_SETTINGS };
  try {
    const raw = localStorage.getItem(CONTACT_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONTACT_SETTINGS };
    return parseContactSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CONTACT_SETTINGS };
  }
}

export function saveStoredContactSettings(settings: ContactSettingsConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTACT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("clixpro:contact-settings-updated", { detail: settings }));
  } catch {}
}

export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettingsConfig>(DEFAULT_CONTACT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSettings(getStoredContactSettings());
    setIsLoaded(true);

    const handleUpdate = (e: CustomEvent<ContactSettingsConfig>) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };

    window.addEventListener("clixpro:contact-settings-updated" as any, handleUpdate);
    return () => {
      window.removeEventListener("clixpro:contact-settings-updated" as any, handleUpdate);
    };
  }, []);

  const updateSettings = useCallback((newSettings: ContactSettingsConfig) => {
    saveStoredContactSettings(newSettings);
    setSettings(newSettings);
  }, []);

  return { settings, isLoaded, updateSettings };
}

/**
 * Enterprise duplicate detection helper against active contacts list
 */
export function findDuplicateContact(
  existingContacts: Array<{ id: string; email?: string; phone?: string; name?: string }>,
  target: { email?: string; phone?: string; currentId?: string },
  settings: ContactSettingsConfig
): { matchType: "email" | "phone"; contact: { id: string; name?: string; email?: string; phone?: string } } | null {
  if (!existingContacts || existingContacts.length === 0) return null;

  const targetEmail = target.email?.trim();
  const targetPhone = target.phone?.replace(/[^0-9]/g, "");

  for (const contact of existingContacts) {
    if (target.currentId && contact.id === target.currentId) continue;

    // 1. Email check
    if (settings.matchEmail && targetEmail && contact.email) {
      const emailA = settings.normalizeEmail ? targetEmail.toLowerCase() : targetEmail;
      const emailB = settings.normalizeEmail ? contact.email.trim().toLowerCase() : contact.email.trim();
      if (emailA && emailA === emailB) {
        return { matchType: "email", contact };
      }
    }

    // 2. Phone check
    if (settings.matchPhone && targetPhone && contact.phone) {
      const phoneB = contact.phone.replace(/[^0-9]/g, "");
      if (phoneB && phoneB.length >= 7 && (phoneB.endsWith(targetPhone) || targetPhone.endsWith(phoneB))) {
        return { matchType: "phone", contact };
      }
    }
  }

  return null;
}
