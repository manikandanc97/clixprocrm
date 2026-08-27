import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Textarea({ className, onFocus, onBlur, onClick, ...props }: React.ComponentProps<"textarea">) {
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    onFocus?.(e);
    const container = e.currentTarget.closest(".relative, [data-slot='form-item'], .form-group, .space-y-1\\.5, form");
    if (container) {
      const iconEls = container.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("trigger-icon-animation"));
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    onBlur?.(e);
    const container = e.currentTarget.closest(".relative, [data-slot='form-item'], .form-group, .space-y-1\\.5, form");
    if (container) {
      const iconEls = container.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("stop-icon-animation"));
      });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
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
    <textarea
      data-slot="textarea"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
