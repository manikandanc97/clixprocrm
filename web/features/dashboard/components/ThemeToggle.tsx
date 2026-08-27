"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center w-9 h-9 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all cursor-pointer group outline-none"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200 transition-all duration-300 group-hover:-rotate-20 group-hover:scale-110" />
      )}
    </button>
  );
}
