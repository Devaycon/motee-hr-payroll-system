"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { NotLive } from "@/src/components/shared/not-live";
import { PLATFORM_PATH, useLogout } from "@/src/lib/auth/session";

/** Platform routes backed by the API; the rest of the console is held back. */
const LIVE_PLATFORM_PATHS = [PLATFORM_PATH];

/**
 * A plain frame for the platform console. The full console sidebar lists
 * billing, flags and support screens that have no endpoints yet, so it is not
 * used here.
 */
export function PlatformShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const live = LIVE_PLATFORM_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-sidebar px-6">
        <Link
          href={PLATFORM_PATH}
          className="text-sm font-semibold text-foreground"
        >
          Motee Platform
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">
        {live ? children : <NotLive />}
      </main>
    </div>
  );
}
