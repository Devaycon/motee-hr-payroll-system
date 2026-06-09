"use client";

import { ReactNode } from "react";
import { useCan } from "@/src/lib/permissions/use-can";
import type { PermissionAction } from "@/src/lib/types/access-levels";

interface PermissionGateProps {
  module: string;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders `children` only if the active user's access level grants `action`
 * on `module`. Otherwise renders `fallback` (defaults to nothing).
 *
 * Used to hide buttons/menu-items the user can't perform.
 */
export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const allowed = useCan(module, action);
  return <>{allowed ? children : fallback}</>;
}
