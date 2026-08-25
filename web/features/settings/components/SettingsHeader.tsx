import React, { memo } from "react";
import { CRMPageHeader } from "@/shared/components/crm";
import { getSettingsItemMetadata } from "../lib/settings-nav-config";

interface SettingsHeaderProps {
  activeSection: string;
}

const SettingsHeader = memo(({ activeSection }: SettingsHeaderProps) => {
  const { item, category } = getSettingsItemMetadata(activeSection);
  const Icon = item.icon;

  return (
    <CRMPageHeader
      title={item.label}
      subtitle={item.description}
      icon={Icon}
      badge={category.title}
    />
  );
});

SettingsHeader.displayName = "SettingsHeader";

export default SettingsHeader;
