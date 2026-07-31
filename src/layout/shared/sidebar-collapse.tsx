"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Sidebar collapse state, shared between the sidebar and the layout that has to
 * leave room for it.
 *
 * Backed by localStorage through `useSyncExternalStore` rather than an effect:
 * reading storage during render would break hydration (the server can't know
 * the user's preference), and syncing it in an effect would cascade a second
 * render on every page. This way the server and first client render agree on
 * "expanded", then React swaps in the stored value.
 */

const STORAGE_KEY = "motee:sidebar:collapsed";

/** Wide enough for a comfortable icon button plus breathing room. */
export const SIDEBAR_COLLAPSED_WIDTH = "5rem";
export const SIDEBAR_EXPANDED_WIDTH = "20%";

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep other tabs in step.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** The server has no preference to read, so it always renders expanded. */
function getServerSnapshot(): boolean {
  return false;
}

function write(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // Private browsing — the toggle still works for this session.
  }
  emit();
}

export function useSidebarCollapse() {
  const collapsed = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const toggle = React.useCallback(() => write(!getSnapshot()), []);
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;
  return { collapsed, toggle, width };
}

/** The collapse control itself — same affordance in every sidebar. */
export function SidebarToggle({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer",
        className,
      )}
    >
      <Icon size={18} strokeWidth={1.75} />
    </button>
  );
}

/**
 * Wraps the page content beside the sidebar, so the two can never disagree
 * about how much room the sidebar is taking.
 */
export function SidebarInset({ children }: { children: React.ReactNode }) {
  const { width } = useSidebarCollapse();
  return (
    <div
      style={{ marginLeft: width }}
      className="flex flex-1 flex-col min-w-0 transition-[margin] duration-200"
    >
      {children}
    </div>
  );
}
