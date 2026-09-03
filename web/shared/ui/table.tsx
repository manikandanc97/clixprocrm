"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Table({ className, wrapperClassName, ...props }: React.ComponentProps<"table"> & { wrapperClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      className={cn("bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0", wrapperClassName)}
    >
      {/* Inner scroll owner: handles both horizontal table scroll and vertical row scroll */}
      <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
        <table
          data-slot="table"
          className={cn("w-full text-xs caption-bottom border-collapse text-left", className)}
          {...props}
        />
      </div>
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("sticky top-0 z-20 bg-muted/60 dark:bg-muted/40 border-b border-border shadow-xs backdrop-blur-xs [&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("divide-y divide-border/40 text-xs [&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/40 border-t border-border font-medium text-xs text-muted-foreground [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group/row h-14 sm:h-16 border-b border-border/40 hover:bg-muted/40 transition-colors data-[state=selected]:bg-muted/60 has-aria-expanded:bg-muted/40 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "group h-11 whitespace-nowrap px-4 py-3 text-left align-middle text-xs font-semibold text-muted-foreground border-r border-border/40 select-none last:border-r-0 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-14 sm:h-16 whitespace-nowrap px-4 py-3 align-middle text-xs text-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};











