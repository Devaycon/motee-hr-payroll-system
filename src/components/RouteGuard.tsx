"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  LOGIN_PATH,
  SETUP_PATH,
  landingPathForSession,
} from "@/src/lib/auth/session";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth: boolean;
  /**
   * Also require the company setup wizard to be finished — the portals are
   * meaningless before it. Off for the wizard's own route.
   */
  requireSetup?: boolean;
}

const RouteGuard = ({
  children,
  requireAuth,
  requireSetup = false,
}: RouteGuardProps) => {
  const router = useRouter();
  const session = useAppSelector((s) => s.session);
  const isLoggedIn = session.is_loggedIn;
  const needsSetup =
    requireSetup && isLoggedIn && session.onboarding_completed === false;

  const redirectTo =
    requireAuth && !isLoggedIn
      ? LOGIN_PATH
      : !requireAuth && isLoggedIn
        ? landingPathForSession(session)
        : needsSetup
          ? SETUP_PATH
          : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (redirectTo) return null;

  return <>{children}</>;
};

export default RouteGuard;
