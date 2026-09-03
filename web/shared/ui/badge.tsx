import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 motion-reduce:transition-none [&>svg]:pointer-events-none [&>svg]:size-3! [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs [a]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/25 focus-visible:ring-destructive/20 [a]:hover:bg-destructive/25",
        outline:
          "border border-border text-foreground bg-transparent [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success/15 text-success border border-success/25 [a]:hover:bg-success/25",
        warning: "bg-warning/15 text-warning border border-warning/25 [a]:hover:bg-warning/25",
        info: "bg-info/15 text-info border border-info/25 [a]:hover:bg-info/25",
        neutral: "bg-muted text-muted-foreground border border-border/50 [a]:hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };






