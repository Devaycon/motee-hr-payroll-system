"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useEffectiveAccess } from "@/src/lib/permissions/use-can";
import { ALL_MODULES } from "@/src/lib/permissions/modules";
import { isLivePath } from "@/src/lib/permissions/live-modules";
import { NotLive } from "@/src/components/shared/not-live";

/**
 * Always-allowed admin paths. The `/my-*` self-service prefixes were removed
 * along with their routes when self-service moved out of the admin shell (§4.3).
 */
const PERSONAL_PREFIXES = ["/welcome", "/hr", "/hr-action-center"];

function resolveModuleId(pathname: string): string | null {
  // Sort by descending link length so deeper prefixes win
  const sorted = [...ALL_MODULES].sort((a, b) => b.link.length - a.link.length);
  for (const m of sorted) {
    if (pathname === m.link || pathname.startsWith(`${m.link}/`)) {
      return m.id;
    }
  }
  return null;
}

function isPersonalPath(pathname: string): boolean {
  return PERSONAL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

interface Props {
  children: ReactNode;
}

export function HrAccessGuard({ children }: Props) {
  const pathname = usePathname();
  const access = useEffectiveAccess();

  // Not integrated yet — blocked by URL as well as hidden from the menu.
  if (!isLivePath(pathname)) return <NotLive />;
  // No resolvable role (the owner, or roles still loading) → allow; the
  // server enforces either way.
  if (access.unresolved) return <>{children}</>;
  // Personal pages are always allowed
  if (isPersonalPath(pathname)) return <>{children}</>;

  const moduleId = resolveModuleId(pathname);
  // Unmapped path → allow (don't accidentally lock people out of new routes)
  if (!moduleId) return <>{children}</>;

  const perm = access.permissions.find((p) => p.module === moduleId);
  if (perm?.access) return <>{children}</>;

  const roleName = access.sourceLevels.map((l) => l.name).join(", ") || "role";
  return <Forbidden moduleId={moduleId} roleName={roleName} />;
}

function Forbidden({
  moduleId,
  roleName,
}: {
  moduleId: string;
  roleName: string;
}) {
  const moduleEntry = ALL_MODULES.find((m) => m.id === moduleId);
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="max-w-md flex flex-col items-center text-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <ShieldOff className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          Your role{" "}
          <span className="font-semibold text-foreground">{roleName}</span>{" "}
          doesn&apos;t have access to{" "}
          <span className="font-semibold text-foreground">
            {moduleEntry?.label ?? "this module"}
          </span>
          . Contact an administrator if you believe this is a mistake.
        </p>
        <Link
          href="/welcome"
          className="mt-2 inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
