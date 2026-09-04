import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "group group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.01] active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:transition-transform [&_svg]:duration-150 [&_svg]:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:[&_svg]:scale-105 group-hover:[&_svg]:-translate-y-[0.5px] active:[&_svg]:scale-95 motion-reduce:[&_svg]:transition-none motion-reduce:group-hover:[&_svg]:scale-100 motion-reduce:group-hover:[&_svg]:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-[0.98]",
        navy:
          "bg-foreground text-background shadow-xs hover:bg-foreground/90 active:scale-[0.98]",
        secondary:
          "border border-border/60 bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:scale-[0.98]",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:bg-muted hover:text-foreground active:scale-[0.98]",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-5 text-sm",
        xs: "h-8 px-2.5 text-xs font-medium",
        icon: "size-9 rounded-md",
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
  ({ className, variant, size, asChild = false, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseEnter?.(e);
      const iconEls = e.currentTarget.querySelectorAll<HTMLElement>("[data-animate-icon]");
      iconEls.forEach((el) => {
        el.dispatchEvent(new CustomEvent("trigger-icon-animation"));
      });
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseLeave?.(e);
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











