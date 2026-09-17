import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "group group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95",
        navy:
          "bg-foreground text-background shadow-xs hover:bg-foreground/90 active:bg-foreground/95",
        secondary:
          "border border-border/60 bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/90",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:bg-muted hover:text-foreground active:bg-muted/80",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
        link: 
          "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:bg-destructive/95",
      },
      size: {
        default: "h-9 px-3.5 text-xs font-semibold",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-4 text-sm",
        xs: "h-7 px-2 text-xs font-medium",
        icon: "size-9 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-xs": "size-7 rounded-md",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }), "rounded-md")}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
