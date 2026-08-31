"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";

export interface TruncatedTextProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The text string to display and truncate.
   * If not provided, children will be used.
   */
  text?: string | null;
  /**
   * Optional children content.
   */
  children?: React.ReactNode;
  /**
   * Number of lines before truncation (1 = single line ellipsis, 2 = 2-line clamp).
   * @default 1
   */
  lines?: 1 | 2;
  /**
   * Optional custom maximum width (e.g. "240px", 280, "100%").
   */
  maxWidth?: string | number;
  /**
   * Additional CSS classes for the text container.
   */
  className?: string;
  /**
   * Additional CSS classes for the tooltip popover.
   */
  tooltipClassName?: string;
  /**
   * Tooltip placement side.
   * @default "top"
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Tooltip alignment.
   * @default "center"
   */
  align?: "start" | "center" | "end";
  /**
   * Side offset in pixels for tooltip.
   * @default 4
   */
  sideOffset?: number;
  /**
   * Tooltip open delay in ms.
   * @default 150
   */
  delayDuration?: number;
  /**
   * Custom full text to show in the tooltip (useful if children has complex formatting).
   */
  fullText?: string;
  /**
   * HTML element type to render.
   * @default "div"
   */
  as?: "div" | "span" | "p";
  /**
   * Whether to enable the tooltip on truncation.
   * @default true
   */
  showTooltip?: boolean;
}

export const TruncatedText = React.forwardRef<HTMLElement, TruncatedTextProps>(
  (
    {
      text,
      children,
      lines = 1,
      maxWidth,
      className,
      tooltipClassName,
      side = "top",
      align = "center",
      sideOffset = 4,
      delayDuration = 150,
      fullText,
      as: Tag = "div",
      showTooltip = true,
      onClick,
      style,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLElement | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    // Derive raw text content
    const displayText = text ?? (typeof children === "string" ? children : "");
    const tooltipContentText =
      fullText ??
      (typeof text === "string"
        ? text
        : typeof children === "string"
        ? children
        : undefined);

    const checkTruncation = useCallback(() => {
      const el = internalRef.current;
      if (!el) return;

      let truncated = false;
      if (lines === 1) {
        // Horizontal overflow check with subpixel tolerance
        truncated = el.scrollWidth > el.clientWidth + 1;
      } else {
        // Vertical overflow check for multi-line clamp with subpixel tolerance
        truncated = el.scrollHeight > el.clientHeight + 1;
      }

      setIsTruncated(truncated);
    }, [lines]);

    useEffect(() => {
      checkTruncation();

      const el = internalRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;

      const observer = new ResizeObserver(() => {
        checkTruncation();
      });

      observer.observe(el);
      if (el.parentElement) {
        observer.observe(el.parentElement);
      }

      return () => {
        observer.disconnect();
      };
    }, [checkTruncation, displayText, children]);

    // Construct style object
    const customStyle: React.CSSProperties = {
      ...style,
      ...(maxWidth !== undefined
        ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }
        : {}),
    };

    // Styling for 1 line vs 2 lines
    const lineClampClasses =
      lines === 1
        ? "truncate"
        : "line-clamp-2 break-words text-ellipsis overflow-hidden";

    const content = children ?? displayText ?? "";

    // Set up ref combining
    const handleRef = (node: HTMLElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    const renderedElement = React.createElement(
      Tag,
      {
        ref: handleRef,
        style: customStyle,
        className: cn(
          lineClampClasses,
          isTruncated &&
            showTooltip &&
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xs",
          className
        ),
        onMouseEnter: () => checkTruncation(),
        onFocus: () => checkTruncation(),
        tabIndex: isTruncated && showTooltip ? 0 : undefined,
        onClick,
        ...props,
      },
      content
    );

    // If text is not truncated or tooltips disabled or no tooltip content, render plain element
    if (!isTruncated || !showTooltip || !tooltipContentText) {
      return renderedElement;
    }

    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>{renderedElement}</TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            sideOffset={sideOffset}
            className={cn(
              "z-50 max-w-xs sm:max-w-md rounded-lg bg-foreground px-3 py-2 text-xs font-normal text-background shadow-premium whitespace-pre-wrap break-words leading-relaxed text-left pointer-events-none",
              tooltipClassName
            )}
          >
            {tooltipContentText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TruncatedText.displayName = "TruncatedText";
