"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NotIntegrated } from "@/src/components/shared/not-integrated";
import { isSelfServiceLivePath } from "@/src/lib/permissions/live-modules";

/**
 * Self-service pages are lifted out of the "not integrated" blur one at a
 * time, as each is wired to the API (see SELF_SERVICE_LIVE_LINKS).
 */
export function SelfServiceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isSelfServiceLivePath(pathname)) return <>{children}</>;
  return (
    <NotIntegrated page label="Self-service">
      {children}
    </NotIntegrated>
  );
}
