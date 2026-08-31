import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Card({
  className,
  size = "default",
  hover = true,
  glass = false,
  elevated = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
  hover?: boolean;
  glass?: boolean;
  elevated?: boolean;
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-card transition-all duration-200",
        hover && "hover:border-primary/30 hover:shadow-card-hover",
        glass && "glass dark:glass-dark backdrop-blur-premium",
        elevated && "shadow-elevated hover:shadow-glow",
        size === "sm" ? "p-0 gap-2" : "p-0 gap-3",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col space-y-1.5 px-6 py-5",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base font-bold leading-tight tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm font-medium leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 pb-6 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center border-t border-border/60 bg-muted/20 p-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};











