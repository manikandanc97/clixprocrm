"use client";

import { useState } from "react";
import { 
  Check, 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { 
  useSettings, 
  AccentColor, 
  FontFamily, 
  ACCENT_PRESETS, 
  ALL_GOOGLE_FONTS, 
  isFontSelected 
} from "./SettingsContext";
import { toValidHex7 } from "@/shared/lib/utils/color-utils";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { getRoleBadge } from "@/shared/lib/auth/rbac";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { cn } from "@/shared/lib/utils";

type ProfileMenuProps = {
  user: { name?: string; email?: string; role?: string; roleName?: string; displayName?: string; avatar?: string | null; } | null;
  initials: string;
};

export default function ProfileMenu({ user, initials }: ProfileMenuProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
  const [fontSearchTrigger, setFontSearchTrigger] = useState(0);
  const [isFontSearchFocused, setIsFontSearchFocused] = useState(false);
  const { accentColor, setAccentColor, fontFamily, setFontFamily } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const isSuperAdminPath = pathname?.startsWith("/super-admin");
  const { logout, access } = useAuth();

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await logout();
    router.push("/login");
  };

  const filteredFonts = ALL_GOOGLE_FONTS.filter(f => 
    f.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(fontSearch.toLowerCase())
  );

  const displayName = user?.displayName || user?.name || "User";
  const roleDisplay = access?.roleName || user?.roleName || user?.role || "Admin";
  const { style: badgeStyle, Icon: RoleIcon } = getRoleBadge(user?.role);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="relative flex items-center p-1 rounded-xl hover:bg-sidebar-accent/50 transition-all duration-200 group outline-none cursor-pointer"
            aria-label="User Profile Menu"
          >
            <div className="relative shrink-0">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="rounded-xl w-[36px] h-[36px] object-cover shadow-sm border border-white/20"
                />
              ) : (
                <div 
                  className="flex justify-center items-center rounded-xl w-[36px] h-[36px] font-bold text-xs text-primary-foreground shadow-sm border border-white/20 transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 65%, black))"
                  }}
                >
                  {initials}
                </div>
              )}
              {/* Online Indicator */}
              <div 
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300"
                style={{ backgroundColor: "var(--primary)" }}
              />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-68 rounded-2xl p-1.5 border border-border/75 dark:border-border/60 bg-popover bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_5.5%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_3.5%,transparent)_0%,transparent_45%)] dark:bg-card dark:bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_8%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_5.5%,transparent)_0%,transparent_45%)] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5),0_6px_16px_-2px_rgba(0,0,0,0.35)]" align="end" sideOffset={8}>
          <DropdownMenuLabel className="px-2.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="rounded-xl w-9 h-9 object-cover shadow-xs border border-border"
                  />
                ) : (
                  <div 
                    className="flex justify-center items-center rounded-xl w-9 h-9 font-bold text-xs text-primary-foreground shadow-xs border border-white/20"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 65%, black))"
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-[13px] font-semibold leading-none truncate">{displayName}</p>
                  <span className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border shrink-0 leading-none ${badgeStyle.badge}`}>
                    <RoleIcon className="w-2.5 h-2.5 shrink-0" />
                    {roleDisplay}
                  </span>
                </div>
                <p className="text-[11px] font-medium leading-none text-muted-foreground truncate">
                  {user?.email || "user@clixprocrm.com"}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 -mx-1 border-t border-dashed border-border/80 h-0 bg-transparent" />
          
          {/* MY ACCOUNT */}
          <div className="px-2.5 pt-1.5 pb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              My Account
            </span>
          </div>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/settings?section=profile")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
              <AppIcon name="user" size={16} className="text-muted-foreground transition-colors" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings?section=notifications")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
              <AppIcon name="notifications" size={16} className="text-muted-foreground transition-colors" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings?section=sessions")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
              <AppIcon name="sessions" size={16} className="text-muted-foreground transition-colors" />
              <span>Login & Sessions</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="my-1 -mx-1 border-t border-dashed border-border/80 h-0 bg-transparent" />

          {/* WORKSPACE */}
          <div className="px-2.5 pt-1.5 pb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </span>
          </div>
          <DropdownMenuGroup>
            {isSuperAdminPath ? (
              <>
                <DropdownMenuItem onClick={() => router.push("/super-admin/settings")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
                  <AppIcon name="settings" size={16} className="text-emerald-600 transition-colors" />
                  <span>Platform Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
                  <AppIcon name="arrowLeftRight" size={16} className="text-primary transition-colors" />
                  <span>Switch to Tenant CRM</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => router.push("/settings?section=general")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
                  <AppIcon name="companies" size={16} className="text-muted-foreground transition-colors" />
                  <span>Workspace Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/upgrade")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
                  <AppIcon name="plans" size={16} className="text-primary transition-colors" />
                  <span>Subscription & Billing</span>
                </DropdownMenuItem>
                {(user?.role?.toUpperCase() === "SUPER_ADMIN" || user?.role?.toUpperCase() === "SUPERADMIN") && (
                  <DropdownMenuItem onClick={() => router.push("/super-admin")} className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
                    <AppIcon name="security" size={16} className="text-emerald-600 transition-colors" />
                    <span>Super Admin Portal</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="my-1 -mx-1 border-t border-dashed border-border/80 h-0 bg-transparent" />

          {/* APPEARANCE */}
          <div className="px-2.5 pt-1.5 pb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Appearance
            </span>
          </div>
          <DropdownMenuGroup>
            {/* Accent Color Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
                <AppIcon name="palette" size={16} className="text-muted-foreground transition-colors" />
                <span>Accent Color</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56 rounded-2xl p-1.5 border border-border/75 dark:border-border/60 bg-popover bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_5.5%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_3.5%,transparent)_0%,transparent_45%)] dark:bg-card dark:bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_8%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_5.5%,transparent)_0%,transparent_45%)] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04)] max-h-80 overflow-y-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 mb-1">
                    Color Presets
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {ACCENT_PRESETS.map((item) => (
                      <DropdownMenuItem 
                        key={item.value} 
                        onClick={() => setAccentColor(item.value)}
                        className="rounded-lg flex items-center justify-between px-2 py-1.5 cursor-pointer text-xs"
                      >
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${item.color} mr-2 shadow-xs`} />
                          <span className="text-xs font-medium">{item.label}</span>
                        </div>
                        {accentColor === item.value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    ))}
                  </div>

                  <DropdownMenuSeparator className="my-1 -mx-1 border-t border-dashed border-border/80 h-0 bg-transparent" />

                  {/* Color Wheel Custom Picker */}
                  <div className="p-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">
                      Custom Color Wheel
                    </div>
                    <label className="flex items-center justify-between cursor-pointer rounded-lg p-2 hover:bg-primary/10 hover:text-primary border border-border/50 group transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full border border-white/20 shadow-xs flex items-center justify-center bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]" />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">Color Wheel</span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {accentColor.startsWith("#") ? accentColor : "Pick Any Hex"}
                          </span>
                        </div>
                      </div>
                      <input 
                        type="color" 
                        value={toValidHex7(accentColor)} 
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer bg-transparent outline-none"
                      />
                    </label>
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {/* Typography Submenu (Google Fonts with Search) */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5">
                <AppIcon name="typography" size={16} className="text-muted-foreground transition-colors" />
                <span>Typography</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-64 rounded-2xl p-1.5 border border-border/75 dark:border-border/60 bg-popover bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_5.5%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_3.5%,transparent)_0%,transparent_45%)] dark:bg-card dark:bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_8%,transparent)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,#ef4444_5.5%,transparent)_0%,transparent_45%)] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04)]">
                  {/* Search Input Bar */}
                  <div className="p-1 mb-1.5 border-b border-border/50">
                    <div className="relative flex items-center group">
                      <div className="absolute left-2.5 z-10 flex items-center justify-center pointer-events-none">
                        <AppIcon 
                          name="search" 
                          size={13} 
                          className={cn(
                            "transition-colors duration-200", 
                            isFontSearchFocused ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                          triggerAnimation={fontSearchTrigger}
                          isHovered={isFontSearchFocused}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Search Google Fonts..."
                        value={fontSearch}
                        onFocus={() => {
                          setIsFontSearchFocused(true);
                          setFontSearchTrigger((prev) => prev + 1);
                        }}
                        onBlur={() => setIsFontSearchFocused(false)}
                        onChange={(e) => {
                          setFontSearch(e.target.value);
                          setFontSearchTrigger((prev) => prev + 1);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-full bg-muted/50 hover:bg-muted/70 focus:bg-background text-xs pl-8 pr-2 py-1.5 rounded-lg border border-border/60 outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
                    {filteredFonts.map((item) => {
                      const isSelected = isFontSelected(fontFamily, item.name);

                      return (
                        <DropdownMenuItem 
                          key={item.name} 
                          onClick={() => setFontFamily(item.name)}
                          className="rounded-lg flex items-center justify-between py-2 px-2.5 cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">{item.name}</span>
                            <span className="text-[9px] text-muted-foreground">{item.category}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </DropdownMenuItem>
                      );
                    })}

                    {filteredFonts.length === 0 && fontSearch.trim() && (
                      <DropdownMenuItem
                        onClick={() => {
                          setFontFamily(fontSearch.trim());
                        }}
                        className="rounded-lg flex items-center justify-between py-2.5 px-2.5 cursor-pointer bg-primary/10 hover:bg-primary/20"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary">Load &quot;{fontSearch.trim()}&quot;</span>
                          <span className="text-[9px] text-muted-foreground">Search & Load Google Font</span>
                        </div>
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      </DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="my-1 -mx-1 border-t border-dashed border-border/80 h-0 bg-transparent" />

          <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} variant="destructive" className="cursor-pointer py-1.5 px-2.5 rounded-xl text-[13px] font-medium leading-none gap-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive group">
            <AppIcon name="logout" size={16} className="text-destructive transition-colors" />
            <span className="font-medium text-[13px] transition-colors">Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleLogout}>
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}












