"use client";

import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, UserCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { canAccessAdminPortal, PORTAL_PATHS } from "@/src/lib/auth/landing";

/** Route prefixes that belong to the employee self-service portal. */
const SELF_SERVICE_PREFIXES = [
  "/employee",
  "/profile",
  "/time-off",
  "/growth",
  "/company",
];

/**
 * Admin Service / Self-Service switch (client feedback §4.2).
 *
 * A single button showing the mode you can move *to* — in Admin Service it
 * reads "Self-Service", and vice versa. The route is the mode (`(hr)` routes
 * are admin, `(employee)` routes are self-service), so there is no extra state
 * to keep in sync and the choice survives a refresh.
 *
 * Hidden for users who cannot reach the admin portal at all.
 */
export function PortalModeToggle({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);

  if (!canAccessAdminPortal(user)) return null;

  const inSelfService = SELF_SERVICE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // The button always offers the *other* mode.
  const target = inSelfService ? "admin" : "self";
  const label = inSelfService ? "Switch to Admin Service" : "Switch to Self-Service";
  const Icon = inSelfService ? ShieldCheck : UserCircle;

  return (
    <Button
      type="button"
      variant="default"
      onClick={() => router.push(PORTAL_PATHS[target])}
      title={`Switch to ${label}`}
      className={cn("h-11 gap-1.5 px-3 text-xs font-medium bg-amber-600!", className)}
    >
      <Icon size={14} />
      <span className="hidden lg:inline">{label}</span>
    </Button>
  );
}
