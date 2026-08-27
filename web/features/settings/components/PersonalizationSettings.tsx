"use client";

import React, { useState } from "react";
import { 
  Palette, 
  Moon, 
  Sun, 
  Monitor, 
  Type, 
  Check,
  X,
} from "lucide-react";
import { Label } from "@/shared/ui/label";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/utils";
import { CRMCard } from "@/shared/components/crm";
import { 
  useSettings, 
  ACCENT_PRESETS, 
  ALL_GOOGLE_FONTS, 
  isFontSelected 
} from "@/features/dashboard/components/SettingsContext";
import { toValidHex7 } from "@/shared/lib/utils/color-utils";
import { ClixProLogo } from "@/shared/ui/logo";
import { AppIcon } from "@/shared/components/icons/icon-registry";

const PersonalizationSettings = () => {
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor, fontFamily, setFontFamily } = useSettings();
  
  const [fontSearch, setFontSearch] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredFonts = ALL_GOOGLE_FONTS.filter(f => 
    f.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
        {/* Appearance Section */}
        <CRMCard className="p-3.5 sm:p-4.5 flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <AppIcon name="palette" icon={Palette} size={15} className="text-primary" />
                Interface Theme
              </h3>
              <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">Choose how ClixProCRM looks on your screen.</p>
            </div>
            
            {/* Theme Modes */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "light", icon: Sun, label: "Light" },
                { id: "dark", icon: Moon, label: "Dark" },
                { id: "system", icon: Monitor, label: "System" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border transition-all group cursor-pointer",
                    theme === t.id 
                      ? "border-primary bg-primary/5 shadow-xs" 
                      : "border-border/60 hover:border-border bg-card/60"
                  )}
                >
                  <AppIcon
                    icon={t.icon}
                    size={16}
                    className={cn(
                      "transition-colors",
                      theme === t.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className={cn(
                    "text-[9.5px] font-bold uppercase tracking-widest",
                    theme === t.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Accent Color Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Color Presets
                </Label>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {ACCENT_PRESETS.find(p => p.value === accentColor)?.label || "Custom Accent"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {ACCENT_PRESETS.map((item) => {
                  const isSelected = accentColor === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setAccentColor(item.value)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-card/70 border-border/60 hover:border-primary/40 hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("w-3.5 h-3.5 rounded-full shrink-0 shadow-xs", item.color)} />
                        <span className="truncate text-[11px]">{item.label}</span>
                      </div>
                      {isSelected && <AppIcon name="check" icon={Check} size={12} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Wheel */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground block">
                Custom Color Wheel
              </Label>
              <label className="flex items-center justify-between cursor-pointer rounded-xl p-2.5 bg-muted/25 hover:bg-primary/5 hover:border-primary/40 border border-border/60 group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full border border-white/20 shadow-sm flex items-center justify-center bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Color Wheel Picker
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {accentColor.startsWith("#") ? accentColor.toUpperCase() : "Pick Any Hex Color"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded-md border border-border/60 shadow-xs"
                    style={{ backgroundColor: toValidHex7(accentColor) }}
                  />
                  <input 
                    type="color" 
                    value={toValidHex7(accentColor)} 
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer bg-transparent outline-none"
                    title="Select Custom Hex Color"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Live Logo Theme Preview */}
          <div className="pt-3 mt-4 border-t border-border/50">
            <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground block mb-1.5">
              Live Brand Logo Preview
            </Label>
            <div className="p-3 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between">
              <ClixProLogo size="md" animated />
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                Dynamic Reactive
              </span>
            </div>
          </div>
        </CRMCard>

        {/* Google Fonts & Typography Section */}
        <CRMCard className="p-3.5 sm:p-4.5 flex flex-col justify-between h-full">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  <AppIcon name="type" icon={Type} size={15} className="text-primary" />
                  Google Fonts Typography
                </h3>
                <p className="text-[11.5px] text-muted-foreground font-medium mt-0.5">
                  Select from 40+ curated Google Fonts or search any font.
                </p>
              </div>
              <span className="text-[10.5px] font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 shrink-0">
                {fontFamily || "Inter"}
              </span>
            </div>

            {/* Interactive Search Bar with Animated AppIcon */}
            <div className="relative flex items-center group">
              <div className="absolute left-3 z-10 flex items-center justify-center pointer-events-none">
                <AppIcon 
                  name="search" 
                  size={14} 
                  className={cn(
                    "transition-colors duration-200", 
                    isSearchFocused ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  triggerAnimation={searchTrigger}
                  isHovered={isSearchFocused}
                />
              </div>
              <input
                type="text"
                placeholder="Search Google Fonts..."
                value={fontSearch}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setSearchTrigger((prev) => prev + 1);
                }}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => {
                  setFontSearch(e.target.value);
                  setSearchTrigger((prev) => prev + 1);
                }}
                className="w-full bg-background hover:bg-muted/40 focus:bg-background text-xs pl-9 pr-7 py-2.5 rounded-xl border border-border/70 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
              />
              {fontSearch && (
                <button
                  onClick={() => {
                    setFontSearch("");
                    setSearchTrigger((prev) => prev + 1);
                  }}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scrollable Google Fonts List */}
            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-1.5">
                {filteredFonts.map((f) => {
                  const isSelected = isFontSelected(fontFamily, f.name);
                  return (
                    <button
                      key={f.name}
                      onClick={() => setFontFamily(f.name)}
                      className={cn(
                        "p-2.5 rounded-xl text-left transition-all border flex items-center justify-between cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-card border-border/60 hover:border-primary/40 hover:bg-primary/5 text-foreground"
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-semibold truncate">{f.name}</span>
                        <span className="text-[9.5px] text-muted-foreground truncate">{f.category}</span>
                      </div>
                      {isSelected && <AppIcon name="check" icon={Check} size={13} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {filteredFonts.length === 0 && fontSearch.trim() && (
                <button
                  onClick={() => {
                    setFontFamily(fontSearch.trim());
                  }}
                  className="w-full rounded-xl flex items-center justify-between p-3 cursor-pointer bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-primary">Load &quot;{fontSearch.trim()}&quot;</span>
                    <span className="text-[10px] text-muted-foreground">Search & Load Google Font dynamically</span>
                  </div>
                  <AppIcon name="check" icon={Check} size={14} className="text-primary shrink-0" />
                </button>
              )}
            </div>
          </div>
        </CRMCard>
      </div>
    </div>
  );
};

export default PersonalizationSettings;
