"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  User,
  LogIn,
  UserPlus,
  Rocket,
  X,
  Link,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const ROLES = [
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
    key: "onboarding",
    label: "Onboarding",
    icon: Rocket,
    accent: "#0EA5E9",
    href: "/onboarding",
    prefixes: ["/onboarding"],
  },
  {
    key: "hr",
    label: "HR Admin",
    icon: Users,
    accent: "#7F77DD",
    href: "/hr",
    prefixes: [
      "/hr",
      "/organization",
      "/talent",
      "/time-payroll",
      "/operations",
      "/workspace",
      "/admin",
    ],
  },
  {
    key: "employee",
    label: "Employee",
    icon: User,
    accent: "#1D9E75",
    href: "/employee/dashboard",
    prefixes: ["/employee", "/profile", "/time-off", "/growth", "/company"],
  },
  // {
  //   key: "motee",
  //   label: "CMS",
  //   icon: Building2,
  //   accent: "#D85A30",
  //   href: "/motee",
  //   prefixes: [
  //     "/motee",
  //     "/tenants",
  //     "/billing",
  //     "/platform",
  //     "/support",
  //     "/settings",
  //   ],
  // },
] as const;

export function DemoSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const activeKey =
    ROLES.find((r) =>
      r.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
    )?.key ?? null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            backgroundColor: "#1A1A18",
            borderRadius: 16,
            padding: "10px 10px",
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

          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = activeKey === role.key;

            return (
              <button
                key={role.key}
                onClick={() => {
                  router.push(role.href);
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
                    ? role.accent
                    : "rgba(255,255,255,0.07)",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                  border: isActive
                    ? "none"
                    : "1px solid rgba(255,255,255,0.12)",
                  justifyContent: "flex-start",
                }}
              >
                <Icon size={13} strokeWidth={2} />
                {role.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
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
            <Link size={13} strokeWidth={2.5} />
            Demo Links
          </>
        )}
      </button>
    </div>
  );
}
