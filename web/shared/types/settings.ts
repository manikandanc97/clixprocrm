export interface WorkspaceDataType {
  name: string | null;
  plan: string | null;
  logo: string | null;
  brandPrimaryColor?: string | null;
  taxId: string | null;
  currency: string | null;
  timezone: string | null;
  address: string | null;
}

export interface SecuritySessionType {
  id: string;
  device: string | null;
  location: string | null;
  ip: string | null;
  current: boolean;
}

export interface SecurityAuditEventType {
  id: string;
  event: string;
  date: string;
  status: string;
}

export interface SecuritySettingsDataType {
  activeSessions: SecuritySessionType[];
  loginHistory: SecurityAuditEventType[];
  twoFactorEnabled: boolean;
}

export interface BillingModuleType {
  id: string;
  label: string;
  enabled: boolean;
}

export interface LicenseDetailType {
  id: string;
  label: string;
  value: string | null;
}

export interface BillingSettingsDataType {
  plan: string | null;
  status: string | null;
  modules: BillingModuleType[];
  licenseDetails: LicenseDetailType[];
}

export interface IntegrationSettingType {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  connected: boolean;
}

export interface IntegrationSettingsDataType {
  integrations: IntegrationSettingType[];
}

export interface AiFeatureSettingType {
  id: string;
  label: string;
  description: string | null;
  enabled: boolean;
}

export interface AiControlSettingType {
  id: string;
  label: string;
  value: number;
  badge: string | null;
}

export interface AiSettingsDataType {
  features: AiFeatureSettingType[];
  modules: AiFeatureSettingType[];
  controls: AiControlSettingType[];
}

export interface NotificationChannelType {
  id: string;
  name: string;
  enabled: boolean;
}

export interface NotificationPreferenceType {
  id: string;
  title: string;
  description: string | null;
  critical: boolean;
  enabled: boolean;
}

export interface NotificationCategoryType {
  id: string;
  title: string;
  notifications: NotificationPreferenceType[];
}

export interface NotificationSettingsDataType {
  channels?: NotificationChannelType[];
  categories?: NotificationCategoryType[];
  realtimePulseEnabled?: boolean;
  emailAlerts?: boolean;
  inAppAlerts?: boolean;
  soundEnabled?: boolean;
  browserPush?: boolean;
  leadAssignment?: boolean;
  dealUpdates?: boolean;
  taskReminders?: boolean;
  invoiceAlerts?: boolean;
  meetingAlerts?: boolean;
  aiBriefing?: boolean;
  weeklyDigest?: boolean;
  securityAlerts?: boolean;
}
