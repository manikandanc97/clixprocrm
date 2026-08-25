"use client";

import { useState } from "react";
import { 
  Settings, 
  LogOut, 
  Palette,
  Check,
  Type,
  Search
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
import { useSettings, AccentColor, FontFamily } from "./SettingsContext";
import { toValidHex7 } from "@/shared/lib/utils/color-utils";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { getRoleBadge } from "@/shared/lib/auth/rbac";
import { Shield, ArrowLeftRight, CreditCard } from "lucide-react";

type ProfileMenuProps = {
  user: { name?: string; email?: string; role?: string; roleName?: string; displayName?: string; avatar?: string | null; } | null;
  initials: string;
};

const ACCENTS: { label: string; value: AccentColor; color: string }[] = [
  { label: "Emerald", value: "emerald", color: "bg-emerald-500" },
  { label: "Blue", value: "blue", color: "bg-blue-500" },
  { label: "Indigo", value: "indigo", color: "bg-indigo-500" },
  { label: "Violet", value: "violet", color: "bg-violet-500" },
  { label: "Purple", value: "purple", color: "bg-purple-500" },
  { label: "Red", value: "red", color: "bg-red-500" },
  { label: "Teal", value: "teal", color: "bg-teal-500" },
  { label: "Cyan", value: "cyan", color: "bg-cyan-500" },
  { label: "Amber", value: "amber", color: "bg-amber-500" },
  { label: "Rose", value: "rose", color: "bg-rose-500" },
];

const ALL_GOOGLE_FONTS: { name: string; category: string }[] = [
  // Popular Sans-Serif
  { name: "Inter", category: "Sans-Serif" },
  { name: "Roboto", category: "Sans-Serif" },
  { name: "Poppins", category: "Sans-Serif" },
  { name: "Open Sans", category: "Sans-Serif" },
  { name: "Montserrat", category: "Sans-Serif" },
  { name: "Lato", category: "Sans-Serif" },
  { name: "Nunito", category: "Sans-Serif" },
  { name: "Raleway", category: "Sans-Serif" },
  { name: "Plus Jakarta Sans", category: "SaaS UI" },
  { name: "Outfit", category: "Geometric" },
  { name: "DM Sans", category: "Clean" },
  { name: "Rubik", category: "Rounded" },
  { name: "Ubuntu", category: "Modern" },
  { name: "Work Sans", category: "Grotesque" },
  { name: "Quicksand", category: "Soft" },
  { name: "Barlow", category: "Grotesk" },
  { name: "Fira Sans", category: "Tech" },
  { name: "Kanit", category: "Modern" },
  { name: "Manrope", category: "SaaS" },
  { name: "Urbanist", category: "Geometric" },
  { name: "Geist", category: "Developer" },

  // Display & Futuristic
  { name: "Space Grotesk", category: "Display" },
  { name: "Oswald", category: "Condensed" },
  { name: "Syne", category: "Experimental" },
  { name: "Bebas Neue", category: "Display" },
  { name: "Anton", category: "Impact" },
  { name: "Righteous", category: "Futuristic" },
  { name: "Lexend", category: "Readable" },

  // Serif & Luxury
  { name: "Playfair Display", category: "Luxury Serif" },
  { name: "Lora", category: "Serif" },
  { name: "Merriweather", category: "Editorial" },
  { name: "Cinzel", category: "Classic Serif" },
  { name: "Cormorant Garamond", category: "Elegant Serif" },
  { name: "Bitter", category: "Slab Serif" },

  // Handwriting & Creative
  { name: "Dancing Script", category: "Cursive" },
  { name: "Caveat", category: "Handwriting" },
  { name: "Pacifico", category: "Fun" },
  { name: "Shadows Into Light", category: "Handwriting" },
  { name: "Great Vibes", category: "Script" },
  { name: "Permanent Marker", category: "Marker" },

  // Monospace & Tech
  { name: "Fira Code", category: "Monospace" },
  { name: "JetBrains Mono", category: "Monospace" },
  { name: "Inconsolata", category: "Monospace" },
  { name: "Roboto Mono", category: "Monospace" },
  { name: "Space Mono", category: "Monospace" },
  { name: "Source Code Pro", category: "Monospace" },
];

export default function ProfileMenu({ user, initials }: ProfileMenuProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
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
            className="relative flex items-center gap-2.5 p-1 sm:py-1 sm:pl-1 sm:pr-2.5 rounded-xl hover:bg-sidebar-accent/50 transition-all duration-200 group outline-none cursor-pointer text-left"
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
            <div className="hidden sm:flex flex-col min-w-0 pr-0.5 items-start">
              <span className="text-xs font-semibold text-sidebar-foreground truncate max-w-[120px] leading-tight">
                {displayName}
              </span>
              <div className="mt-0.5">
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border leading-none ${badgeStyle.badge}`}>
                  <RoleIcon className="w-2.5 h-2.5 shrink-0" />
                  {roleDisplay}
                </span>
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-68 rounded-xl p-2 shadow-elevated border-border bg-popover/95 backdrop-blur-xl" align="end" sideOffset={8}>
          <DropdownMenuLabel className="px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="rounded-xl w-10 h-10 object-cover shadow-sm border border-border"
                  />
                ) : (
                  <div 
                    className="flex justify-center items-center rounded-xl w-10 h-10 font-bold text-xs text-primary-foreground shadow-sm border border-white/20"
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
                  <p className="text-sm font-bold leading-none truncate">{displayName}</p>
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
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              {isSuperAdminPath ? (
                <>
                  <DropdownMenuItem onClick={() => router.push("/super-admin/settings")} className="cursor-pointer py-2.5 rounded-xl">
                    <Settings className="mr-3 h-4 w-4 text-emerald-600 transition-colors" />
                    <span className="font-semibold text-sm">Platform Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer py-2.5 rounded-xl">
                    <ArrowLeftRight className="mr-3 h-4 w-4 text-primary transition-colors" />
                    <span className="font-semibold text-sm">Switch to Tenant CRM</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer py-2.5 rounded-xl">
                    <Settings className="mr-3 h-4 w-4 text-muted-foreground transition-colors" />
                    <span className="font-semibold text-sm">Workspace Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings?section=subscription")} className="cursor-pointer py-2.5 rounded-xl">
                    <CreditCard className="mr-3 h-4 w-4 text-primary transition-colors" />
                    <span className="font-semibold text-sm">Subscription & Billing</span>
                  </DropdownMenuItem>
                  {(user?.role?.toUpperCase() === "SUPER_ADMIN" || user?.role?.toUpperCase() === "SUPERADMIN") && (
                    <DropdownMenuItem onClick={() => router.push("/super-admin")} className="cursor-pointer py-2.5 rounded-xl">
                      <Shield className="mr-3 h-4 w-4 text-emerald-600 transition-colors" />
                      <span className="font-semibold text-sm">Super Admin Portal</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />

        
        <DropdownMenuGroup>
          {/* Accent Color Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="py-2.5 rounded-xl">
              <Palette className="mr-3 h-4 w-4 text-muted-foreground transition-colors" />
              <span className="font-semibold text-sm">Accent Color</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-56 rounded-xl p-2 shadow-elevated border-border bg-popover/95 backdrop-blur-xl max-h-80 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 mb-1">
                  Color Presets
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {ACCENTS.map((item) => (
                    <DropdownMenuItem 
                      key={item.value} 
                      onClick={() => setAccentColor(item.value)}
                      className="rounded-lg flex items-center justify-between px-2 py-1.5 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${item.color} mr-2 shadow-sm`} />
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                      {accentColor === item.value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  ))}
                </div>

                <DropdownMenuSeparator className="my-2" />

                {/* Color Wheel Custom Picker */}
                <div className="p-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">
                    Custom Color Wheel
                  </div>
                  <label className="flex items-center justify-between cursor-pointer rounded-lg p-2 hover:bg-primary/10 hover:text-primary border border-border/50 group transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full border border-white/20 shadow-sm flex items-center justify-center bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]" />
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
            <DropdownMenuSubTrigger className="py-2.5 rounded-xl">
              <Type className="mr-3 h-4 w-4 text-muted-foreground transition-colors" />
              <span className="font-semibold text-sm">Typography</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-64 rounded-xl p-2 shadow-elevated border-border bg-popover/95 backdrop-blur-xl">
                {/* Search Input Bar */}
                <div className="p-1 mb-1.5 border-b border-border/50">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search Google Fonts..."
                      value={fontSearch}
                      onChange={(e) => setFontSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full bg-muted/50 hover:bg-muted/70 focus:bg-background text-xs pl-8 pr-2 py-1.5 rounded-lg border border-border/60 outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
                  {filteredFonts.map((item) => {
                    const currentLower = (fontFamily || "").toLowerCase();
                    const itemLower = item.name.toLowerCase();
                    const isSelected = currentLower === itemLower || 
                      (currentLower === "sans" && itemLower === "inter") ||
                      (currentLower === "jakarta" && itemLower === "plus jakarta sans");

                    return (
                      <DropdownMenuItem 
                        key={item.name} 
                        onClick={() => setFontFamily(item.name)}
                        className="rounded-lg flex items-center justify-between py-2 px-2.5 cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
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
        
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} variant="destructive" className="cursor-pointer py-2.5 rounded-xl group">
          <LogOut className="mr-3 h-4 w-4 transition-colors" />
          <span className="font-bold text-sm transition-colors">Sign out</span>
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












