"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import {
  LogIn,
  UserPlus,
  Rocket,
  ShieldCheck,
  KeyRound,
  X,
  Link as LinkIcon,
  IdCard,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { loadLocale, setCountry } from "@/src/lib/stores/locale-slice";
import { loginAsRoleThunk } from "@/src/lib/stores/auth-slice";
import { landingPathForUser } from "@/src/lib/auth/landing";
import type { CountryKey } from "@/src/lib/types/locale";

const NAV_ITEMS = [
  {
    key: "login",
    label: "Login",
    icon: LogIn,
    accent: "#6B7280",
    href: "/auth/login",
    prefixes: ["/auth/login"],
  },
  {
    key: "register",
    label: "Register",
    icon: UserPlus,
    accent: "#6B7280",
    href: "/auth/register",
    prefixes: ["/auth/register"],
  },
  {
    key: "verify-otp",
    label: "Verify OTP",
    icon: ShieldCheck,
    accent: "#ff8b2d",
    href: "/auth/verify-otp",
    prefixes: ["/auth/verify-otp"],
  },
  {
    key: "forgot-password",
    label: "Forgot Password",
    icon: KeyRound,
    accent: "#6B7280",
    href: "/auth/forgot-password",
    prefixes: ["/auth/forgot-password"],
  },
  {
    key: "onboarding",
    label: "Onboarding",
    icon: Rocket,
    accent: "#0EA5E9",
    href: "/onboarding",
    prefixes: ["/onboarding"],
  },
] as const;

/**
 * Roles offered as one-click demo logins (in display order). All other roles
 * still exist in the system (Access Levels, permissions, etc.) — they're just
 * not exposed as quick-login credentials here.
 */
const DEMO_LOGIN_ROLE_IDS = ["ROLE-HRADMIN", "ROLE-MGR", "ROLE-EMP"];

export function DemoSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const localeStatus = useAppSelector((s) => s.locale.status);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  // Only HR Admin, Line Manager and Employee are offered as demo logins.
  const demoRoles = DEMO_LOGIN_ROLE_IDS.map((id) =>
    roles.find((r) => r.id === id),
  ).filter((r): r is (typeof roles)[number] => Boolean(r));

  const [open, setOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  // Bounds the draggable widget to the viewport.
  const dragBoundsRef = useRef<HTMLDivElement>(null);
  // Tracks whether the last pointer interaction was a drag, so a drag-release
  // doesn't also fire the toggle button's click.
  const draggedRef = useRef(false);

  useEffect(() => {
    if (open && credentialsOpen && localeStatus === "idle") {
      dispatch(loadLocale(country));
    }
  }, [open, credentialsOpen, localeStatus, country, dispatch]);

  const activeKey =
    NAV_ITEMS.find((r) =>
      r.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
    )?.key ?? null;

  const handleRoleLogin = async (roleId: string) => {
    const result = await dispatch(loginAsRoleThunk(roleId));
    if (loginAsRoleThunk.fulfilled.match(result)) {
      router.push(landingPathForUser(result.payload));
      setOpen(false);
      setCredentialsOpen(false);
    }
  };

  const handleCountrySwitch = (next: CountryKey) => {
    dispatch(setCountry(next));
    dispatch(loadLocale(next));
  };

  return (
    <div
      ref={dragBoundsRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
    <motion.div
      drag
      dragConstraints={dragBoundsRef}
      dragMomentum={false}
      dragElastic={0.15}
      onDragStart={() => {
        draggedRef.current = true;
      }}
      whileDrag={{ cursor: "grabbing" }}
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        cursor: "grab",
        touchAction: "none",
      }}
    >
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 6,
            backgroundColor: "#1A1A18",
            borderRadius: 16,
            padding: "10px 10px",
            minWidth: 220,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#EF9F27",
              letterSpacing: "0.08em",
              paddingLeft: 4,
              userSelect: "none",
              alignSelf: "flex-start",
            }}
          >
            DEMO
          </span>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 transition-all duration-150 cursor-pointer w-full",
                )}
                style={{
                  height: 32,
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: isActive
                    ? item.accent
                    : "rgba(255,255,255,0.07)",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                  border: isActive
                    ? "none"
                    : "1px solid rgba(255,255,255,0.12)",
                  justifyContent: "flex-start",
                }}
              >
                <Icon size={13} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}

          {/* Employee Credentials group */}
          <button
            onClick={() => setCredentialsOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 transition-all duration-150 cursor-pointer w-full"
            style={{
              height: 32,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: credentialsOpen
                ? "#7F77DD"
                : "rgba(255,255,255,0.07)",
              color: credentialsOpen ? "#ffffff" : "rgba(255,255,255,0.55)",
              border: credentialsOpen
                ? "none"
                : "1px solid rgba(255,255,255,0.12)",
              justifyContent: "flex-start",
            }}
          >
            <IdCard size={13} strokeWidth={2} />
            <span style={{ flex: 1, textAlign: "left" }}>
              Employee Credentials
            </span>
            {credentialsOpen ? (
              <ChevronDown size={12} strokeWidth={2.5} />
            ) : (
              <ChevronRight size={12} strokeWidth={2.5} />
            )}
          </button>

          {credentialsOpen && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "6px 4px 4px 14px",
                borderLeft: "1px solid rgba(255,255,255,0.12)",
                marginLeft: 12,
              }}
            >
              {/* <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                {(["ng", "uk"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleCountrySwitch(key)}
                    title={key === "ng" ? "Nigeria" : "United Kingdom"}
                    style={{
                      fontSize: 12,
                      height: 22,
                      width: 26,
                      borderRadius: 999,
                      border:
                        country === key
                          ? "1px solid rgba(255,255,255,0.3)"
                          : "1px solid transparent",
                      backgroundColor:
                        country === key
                          ? "rgba(255,255,255,0.1)"
                          : "transparent",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: country === key ? 1 : 0.5,
                    }}
                  >
                    {key === "ng" ? "🇳🇬" : "🇬🇧"}
                  </button>
                ))}
              </div> */}

              {localeStatus === "loading" && (
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    padding: "4px 8px",
                  }}
                >
                  Loading…
                </span>
              )}

              {localeStatus === "ready" &&
                demoRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleLogin(role.id)}
                    className="flex items-center gap-1.5 rounded-full px-3 transition-all duration-150 cursor-pointer w-full"
                    style={{
                      height: 28,
                      fontSize: 11.5,
                      fontWeight: 500,
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      justifyContent: "flex-start",
                    }}
                  >
                    {role.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          // Swallow the click that ends a drag so dragging doesn't toggle.
          if (draggedRef.current) {
            draggedRef.current = false;
            return;
          }
          setOpen((v) => !v);
        }}
        style={{
          height: 36,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 9999,
          backgroundColor: "#1A1A18",
          color: open ? "rgba(255,255,255,0.7)" : "#EF9F27",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {open ? (
          <>
            <X size={13} strokeWidth={2.5} />
            Close
          </>
        ) : (
          <>
            <LinkIcon size={13} strokeWidth={2.5} />
            Demo Links
          </>
        )}
      </button>
    </motion.div>
    </div>
  );
}
