"use client";

import { usePathname, useRouter } from "next/navigation";
import { Building2, Users, User, LogIn, UserPlus, Rocket } from "lucide-react";
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
    key: "motee",
    label: "CMS",
    icon: Building2,
    accent: "#D85A30",
    href: "/motee",
    prefixes: [
      "/motee",
      "/tenants",
      "/billing",
      "/platform",
      "/support",
      "/settings",
    ],
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
    href: "/employee",
    prefixes: ["/employee", "/profile", "/time-off", "/growth", "/company"],
  },
] as const;

export function DemoSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const activeKey =
    ROLES.find((r) =>
      r.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
    )?.key ?? null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#1A1A18",
        borderRadius: 9999,
        padding: 6,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#EF9F27",
          letterSpacing: "0.08em",
          paddingLeft: 6,
          paddingRight: 4,
          userSelect: "none",
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
            onClick={() => router.push(role.href)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 transition-all duration-150 cursor-pointer",
            )}
            style={{
              height: 32,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: isActive ? role.accent : "transparent",
              color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
              border: isActive ? "none" : "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Icon size={13} strokeWidth={2} />
            {role.label}
          </button>
        );
      })}
    </div>
  );
}
