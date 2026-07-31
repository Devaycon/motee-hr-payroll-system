"use client";

import { createContext, useContext } from "react";

/**
 * Lets a module hand the viewer off to another module in the same workspace —
 * the Timeline needs it so every entry can open the record it summarises.
 * `null` outside a workspace, so a module rendered standalone just hides the
 * link rather than crashing.
 */
const ModuleNavigationContext = createContext<((key: string) => void) | null>(
  null,
);

export const ModuleNavigationProvider = ModuleNavigationContext.Provider;

export function useGoToModule(): ((key: string) => void) | null {
  return useContext(ModuleNavigationContext);
}
