"use client";

import { useRef, useEffect, useCallback } from "react";

/**
 * Enterprise-grade auto-fade scrollbar behavior hook.
 * 
 * Features:
 * - Hidden by default when idle & not hovered.
 * - Visible immediately on mouse enter / hover.
 * - Visible immediately upon scroll start and throughout continuous scrolling.
 * - Stays visible for exactly `hideDelayMs` (default: 1000ms) after scrolling stops.
 * - Smoothly fades away after 1000ms of inactivity.
 * - Zero React re-renders during scrolling via direct DOM mutation + requestAnimationFrame.
 * - Preserves native scroll accessibility (mouse wheel, trackpad, keyboard, drag).
 */
export function useAutoFadeScrollbar<T extends HTMLElement = HTMLDivElement>(
  hideDelayMs: number = 1000
) {
  const containerRef = useRef<T | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const isHoveredRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);

  const setVisibilityDOM = useCallback((visible: boolean) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) {
        if (visible) {
          el.setAttribute("data-scrolling", "true");
          el.classList.add("is-scrolling");
        } else {
          el.setAttribute("data-scrolling", "false");
          el.classList.remove("is-scrolling");
        }
      }
    });
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      setVisibilityDOM(false);
    }, hideDelayMs);
  }, [clearTimer, hideDelayMs, setVisibilityDOM]);

  const showAndScheduleHide = useCallback(() => {
    setVisibilityDOM(true);
    scheduleHide();
  }, [setVisibilityDOM, scheduleHide]);

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    showAndScheduleHide();
  }, [showAndScheduleHide]);

  const handleMouseMove = useCallback(() => {
    showAndScheduleHide();
  }, [showAndScheduleHide]);

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    setVisibilityDOM(true);
    scheduleHide();
  }, [setVisibilityDOM, scheduleHide]);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    // If currently actively scrolling, allow the 1000ms scroll hide debounce to finish naturally.
    // If not scrolling, hide immediately with smooth CSS transition.
    if (!isScrollingRef.current) {
      clearTimer();
      setVisibilityDOM(false);
    }
  }, [clearTimer, setVisibilityDOM]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [clearTimer]);

  return {
    containerRef,
    scrollbarProps: {
      ref: containerRef,
      onScroll: handleScroll,
      onMouseEnter: handleMouseEnter,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      "data-scrolling": "false",
    },
  };
}
