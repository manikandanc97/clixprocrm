import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "group group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-[cubic-bezier(0.16,1,0.3,1)]",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110 active:brightness-95",
        emerald:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110",
        navy:
          "border border-transparent bg-foreground text-background shadow-sm hover:bg-foreground/90",
        secondary:
          "border border-border bg-secondary bg-gradient-to-b from-secondary/80 to-secondary text-secondary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:brightness-105",
        outline:
          "border border-border bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_-1px_0_rgba(0,0,0,0.05)] hover:bg-muted dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_-1px_0_rgba(255,255,255,0.05)]",
        ghost:
          "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        link: 
          "text-primary underline-offset-4 hover:underline",
        destructive:
          "border border-destructive/20 bg-destructive/10 text-destructive shadow-sm hover:bg-destructive/20",
        premium:
          "border border-primary/20 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-5 text-sm",
        xs: "h-8 px-3 text-[10px] font-bold uppercase tracking-wider",
        icon: "size-10 rounded-md",
        "icon-sm": "size-9 rounded-md",
        "icon-xs": "size-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onMouseEnter, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseEnter?.(e);
      const iconEls = e.currentTarget.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("trigger-icon-animation"));
      });
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      props.onMouseLeave?.(e);
      const iconEls = e.currentTarget.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("stop-icon-animation"));
      });
    };

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }), "rounded-md")}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };











