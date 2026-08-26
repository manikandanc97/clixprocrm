"use client";

import React, { useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { NavAnimatedIcon } from "@/shared/components/sidebar/NavAnimatedIcon";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  getAuthorizedSettingsNav,
  resolveCanonicalSectionId,
} from "../lib/settings-nav-config";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function SettingsNavItem({
  item,
  isActive,
  onSelect,
}: {
  item: { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [clickKey, setClickKey] = React.useState(0);
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setClickKey((c) => c + 1);
        onSelect(item.id);
      }}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "w-full group relative flex items-center gap-3 px-3 py-2 text-[14px] rounded-lg transition-colors duration-150 text-left outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        isActive
          ? "text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium"
      )}
    >
      {isActive && (
        <>
          <motion.div
            layoutId="settings-active-bg"
            className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/15"
            transition={{ type: "spring", stiffness: 450, damping: 36, mass: 0.8 }}
          />
          <motion.div
            layoutId="settings-active-indicator"
            className="absolute left-0 w-1 h-5 bg-primary rounded-r-full z-10"
            transition={{ type: "spring", stiffness: 450, damping: 36, mass: 0.8 }}
          />
        </>
      )}
      <NavAnimatedIcon
        icon={Icon}
        name={item.label}
        isActive={isActive}
        isHovered={isHovered}
        triggerAnimation={clickKey}
        size={18}
        className={cn(
          "w-[18px] h-[18px] shrink-0 transition-colors z-10",
          isActive
            ? "text-primary"
            : "text-muted-foreground/80 group-hover:text-foreground"
        )}
      />
      <span className="flex-1 truncate text-left z-10">{item.label}</span>
      {isActive && (
        <ChevronRight className="w-3.5 h-3.5 text-primary/70 shrink-0 z-10" />
      )}
    </motion.button>
  );
}

const SettingsSidebar = React.memo(({ activeSection, onSectionChange }: SettingsSidebarProps) => {
  const { user, access } = useAuth();

  const isSuperAdmin =
    user?.role?.toUpperCase() === "SUPER_ADMIN" ||
    user?.role?.toUpperCase() === "SUPERADMIN" ||
    (user as any)?.isSuperAdmin === true;

  const categories = useMemo(() => {
    return getAuthorizedSettingsNav(user?.role, access?.permissions || [], isSuperAdmin);
  }, [user?.role, access?.permissions, isSuperAdmin]);

  const canonicalActive = resolveCanonicalSectionId(activeSection);

  return (
    <div className="w-full">
      {/* Mobile / Tablet Dropdown Navigation (< lg) */}
      <div className="lg:hidden mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Select Settings Category
        </label>
        <Select value={canonicalActive} onValueChange={onSectionChange}>
          <SelectTrigger className="w-full h-11 bg-card border-border text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {categories.map((cat) => (
              <SelectGroup key={cat.id}>
                <SelectLabel className="text-[10px] font-black tracking-wider uppercase text-muted-foreground px-2 py-1.5">
                  {cat.title}
                </SelectLabel>
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SelectItem key={item.id} value={item.id} className="text-xs font-medium py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Sticky Secondary Sidebar (>= lg) */}
      <div className="hidden lg:flex flex-col gap-6 pb-2 pr-1">
        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            <p className="px-3 text-[10.5px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-2 select-none">
              {category.title}
            </p>
            <div className="space-y-0.5">
              {category.items.map((item) => (
                <SettingsNavItem
                  key={item.id}
                  item={item}
                  isActive={canonicalActive === item.id}
                  onSelect={onSectionChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

SettingsSidebar.displayName = "SettingsSidebar";

export default SettingsSidebar;
