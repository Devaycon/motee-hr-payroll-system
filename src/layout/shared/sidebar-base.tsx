"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "warning";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface SidebarUser {
  name: string;
  roleLabel: string;
  initials: string;
  avatarColor?: string;
}

export interface SidebarBaseProps {
  role: "motee" | "hr" | "employee";
  accentColor?: string;
  sections: NavSection[];
  user: SidebarUser;
  logoTitle: string;
  logoSubtitle: string;
}

const roleConfig = {
  motee: {
    activeBg: "#FAECE7",
    activeText: "#712B13",
    activeBorder: "#712B13",
    logoBg: "#993C1D",
    pillBg: "#FAECE7",
    pillText: "#712B13",
    pillLabel: "Motee Admin",
  },
  hr: {
    activeBg: "#EEEDFE",
    activeText: "#3C3489",
    activeBorder: "#3C3489",
    logoBg: "#534AB7",
    pillBg: "#EEEDFE",
    pillText: "#3C3489",
    pillLabel: "HR Admin",
  },
  employee: {
    activeBg: "#E1F5EE",
    activeText: "#085041",
    activeBorder: "#085041",
    logoBg: "#0F6E56",
    pillBg: "#E1F5EE",
    pillText: "#085041",
    pillLabel: "Employee",
  },
};

export function SidebarBase({
  role,
  accentColor,
  sections,
  user,
  logoTitle,
  logoSubtitle,
}: SidebarBaseProps) {
  const pathname = usePathname();
  const config = roleConfig[role];

  const activeBg = accentColor ?? config.activeBg;

  const exactMatchRoutes = ["/employee", "/hr", "/motee"];

  const isActive = (href: string) =>
    href === "/" || exactMatchRoutes.includes(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      style={{ width: 240 }}
      className="fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 border-r border-border"
    >
      <div className="flex flex-col gap-2 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm select-none"
            style={{ backgroundColor: config.logoBg }}
          >
            {logoTitle.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-bold text-sm leading-none">
              {logoTitle}
            </span>
            <span className="text-muted-foreground text-[10px] leading-none mt-0.5">
              {logoSubtitle}
            </span>
          </div>
        </div>

        <span
          className="self-start rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none"
          style={{ backgroundColor: config.pillBg, color: config.pillText }}
        >
          {config.pillLabel}
        </span>
      </div>

      <nav className="flex-1 px-3 py-3">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <p className="px-3 mb-1.5 mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>

            <ul className="flex flex-col gap-0.5 mb-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        !active &&
                          "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: activeBg,
                              color: config.activeText,
                              borderLeft: `2px solid ${config.activeBorder}`,
                            }
                          : undefined
                      }
                    >
                      <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                      <span className="flex-1 truncate text-sm">
                        {item.label}
                      </span>

                      {item.badge !== undefined && (
                        <Badge
                          variant={
                            item.badgeVariant === "destructive"
                              ? "destructive"
                              : "secondary"
                          }
                          className={cn(
                            "h-4 min-w-4 rounded-full px-1 text-[10px] font-semibold",
                            item.badgeVariant === "warning" &&
                              "bg-amber-100 text-amber-700 border-transparent",
                            item.badgeVariant === "destructive" &&
                              "h-4 px-1 text-[10px]",
                            (!item.badgeVariant ||
                              item.badgeVariant === "default") &&
                              !active &&
                              "bg-primary/10 text-primary border-transparent",
                          )}
                          style={
                            (!item.badgeVariant ||
                              item.badgeVariant === "default") &&
                            active
                              ? {
                                  backgroundColor: config.activeText,
                                  color: "white",
                                }
                              : undefined
                          }
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {sectionIdx < sections.length - 1 && (
              <div className="my-2 border-t border-border" />
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-accent cursor-pointer transition-colors hover:bg-accent/80">
          <PersonAvatar
            name={user.name}
            initials={user.initials}
            className="size-8 shrink-0"
            fallbackClassName="text-[10px] font-semibold text-white"
          />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-medium text-foreground truncate">
              {user.name}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {user.roleLabel}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
