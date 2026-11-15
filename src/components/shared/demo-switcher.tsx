"use client";

import { useRef, useState } from "react";
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
  LayoutDashboard,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { switchCountry } from "@/src/lib/locale/country-storage";
import { COUNTRY_OPTIONS } from "@/src/components/auth/country-switcher";

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
    accent: "#FE8F44",
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
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    accent: "#50D34C",
    href: "/hr",
    prefixes: ["/hr"],
  },
] as const;

/**
 * Shortcuts to the auth and onboarding screens.
 *
 * The per-role quick logins that used to live here are gone: the demo runs as
 * one person across both portals, and the Admin/Self-Service switch in the
 * navbar moves between them — a second identity picker here only made it look
 * like the two portals belonged to different people.
 */
export function DemoSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const country = useAppSelector((s) => s.locale.country);

  const [open, setOpen] = useState(false);
  // Bounds the draggable widget to the viewport.
  const dragBoundsRef = useRef<HTMLDivElement>(null);
  // Tracks whether the last pointer interaction was a drag, so a drag-release
  // doesn't also fire the toggle button's click.
  const draggedRef = useRef(false);

  const activeKey =
    NAV_ITEMS.find((r) =>
      r.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
    )?.key ?? null;

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

          {/* UK ⇄ Nigeria context. Switching persists the choice and reloads
              the whole site so every module rebuilds from that country's
              data — people, currency, branches, statutory features. */}
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.08em",
              paddingLeft: 4,
              userSelect: "none",
              alignSelf: "flex-start",
            }}
          >
            COUNTRY
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {COUNTRY_OPTIONS.map((option) => {
              const isActive = country === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    if (isActive) return;
                    setOpen(false);
                    switchCountry(option.key);
                  }}
                  className="flex flex-1 items-center gap-1.5 rounded-full px-3 transition-all duration-150 cursor-pointer"
                  style={{
                    height: 32,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: isActive
                      ? "#EF9F27"
                      : "rgba(255,255,255,0.07)",
                    color: isActive ? "#1A1A18" : "rgba(255,255,255,0.55)",
                    border: isActive
                      ? "none"
                      : "1px solid rgba(255,255,255,0.12)",
                    justifyContent: "flex-start",
                  }}
                >
                  <Image
                    src={option.flag}
                    alt=""
                    width={16}
                    height={11}
                    className="rounded-[2px] object-cover"
                  />
                  {option.key === "uk" ? "UK" : "Nigeria"}
                </button>
              );
            })}
          </div>

          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.08em",
              paddingLeft: 4,
              paddingTop: 4,
              userSelect: "none",
              alignSelf: "flex-start",
            }}
          >
            PAGES
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
