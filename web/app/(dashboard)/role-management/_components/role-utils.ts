import { Role } from "@/shared/types/role";

export const ROLE_SYSTEM_COLORS: Record<string, string> = {
  "SUPER ADMIN": "#6366f1", // Indigo
  ADMIN: "#3b82f6",         // Royal Blue
  MANAGER: "#8b5cf6",       // Violet / Purple
  SALES: "#f59e0b",         // Amber / Orange
  EMPLOYEE: "#10b981",      // Emerald Green
  SUPPORT: "#ec4899",       // Pink
  FINANCE: "#06b6d4",       // Cyan
  MARKETING: "#f43f5e",     // Rose
};

export const getRoleColor = (role?: Role | null): string => {
  if (!role) return "#10b981";
  const upper = (role.name || "").trim().toUpperCase();
  if (role.isSystem && ROLE_SYSTEM_COLORS[upper]) {
    return ROLE_SYSTEM_COLORS[upper];
  }
  if (role.color && role.color !== "#10b981") {
    return role.color;
  }
  if (ROLE_SYSTEM_COLORS[upper]) {
    return ROLE_SYSTEM_COLORS[upper];
  }
  const customPalette = [
    "#8b5cf6",
    "#3b82f6",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#06b6d4",
    "#f43f5e",
    "#6366f1",
  ];
  let hash = 0;
  for (let i = 0; i < role.name.length; i++) {
    hash = role.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return customPalette[Math.abs(hash) % customPalette.length];
};
