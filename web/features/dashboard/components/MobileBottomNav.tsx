"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { usePlatformNavigation } from "@/shared/hooks/use-platform-navigation";
import { isNavRouteActive } from "@/shared/lib/auth/rbac";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { groups } = usePlatformNavigation();
  const navItems = groups
    .flatMap((group) => group.items)
    .slice(0, 4)
    .map((item) => ({
      icon: item.icon,
      href: item.href,
      label: item.title,
      exact: item.exact || item.match === "exact",
    }));

  const allHrefs = navItems.map((item) => item.href).filter(Boolean);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 dark:bg-card/80 backdrop-blur-xl border-t border-border dark:border-border/60 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavRouteActive(item.href, pathname, allHrefs, item.exact);

          return (
            <Link 
              key={item.label} 
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-col items-center justify-center p-2 min-w-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -inset-2 bg-primary/10 rounded-xl -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-semibold transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}












