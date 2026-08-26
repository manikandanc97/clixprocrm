"use client";

import React from "react";
import { AppIcon, type AppIconProps } from "@/shared/components/icons/icon-registry";

export interface NavAnimatedIconProps extends AppIconProps {
  isActive?: boolean;
}

/**
 * Unified NavAnimatedIcon delegating to the centralized @animateicons/react icon registry
 */
export function NavAnimatedIcon({
  isActive,
  active,
  ...rest
}: NavAnimatedIconProps) {
  return <AppIcon active={isActive ?? active} {...rest} />;
}

export { AppIcon, resolveIconName } from "@/shared/components/icons/icon-registry";
