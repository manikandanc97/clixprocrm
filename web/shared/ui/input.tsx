import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Input({ className, type, onFocus, onBlur, onClick, ...props }: React.ComponentProps<"input">) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
    const container = e.currentTarget.closest(".relative, [data-slot='form-item'], .form-group, .space-y-1\\.5, form");
    if (container) {
      const iconEls = container.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("trigger-icon-animation"));
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
    const container = e.currentTarget.closest(".relative, [data-slot='form-item'], .form-group, .space-y-1\\.5, form");
    if (container) {
      const iconEls = container.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("stop-icon-animation"));
      });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(e);
    const container = e.currentTarget.closest(".relative, [data-slot='form-item'], .form-group, .space-y-1\\.5, form");
    if (container) {
      const iconEls = container.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("trigger-icon-animation"));
      });
    }
  };

  return (
    <input
      type={type}
      data-slot="input"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] duration-150 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 motion-reduce:transition-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
