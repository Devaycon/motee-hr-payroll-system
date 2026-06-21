"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Settings } from "lucide-react";
import { routes } from "./routes";
import { cn } from "@/src/lib/utils";
import { useHasDirectReports } from "@/src/components/employee/team/hooks";

const Sidebar = () => {
  const pathname = usePathname();
  const hasReports = useHasDirectReports();

  // Manager-only items (e.g. My Team) are hidden unless the user has reports.
  const visibleRoutes = routes.filter((r) => !r.managerOnly || hasReports);

  const overviewRoutes = visibleRoutes.filter((r) => r.group === "Overview");
  const settingsRoute = visibleRoutes.find((r) => r.group === "Settings");
  const otherRoutes = visibleRoutes.filter(
    (r) => r.group !== "Overview" && r.group !== "Settings",
  );

  const grouped = otherRoutes.reduce<{ group: string; items: typeof routes }[]>(
    (acc, route) => {
      const existing = acc.find((g) => g.group === route.group);
      if (existing) existing.items.push(route);
      else acc.push({ group: route.group, items: [route] });
      return acc;
    },
    [],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(grouped.map((g) => [g.group, true])),
  );

  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  const isActive = (link: string) =>
    link === "/"
      ? pathname === "/"
      : pathname === link || pathname.startsWith(`${link}/`);

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[20%] flex-col bg-sidebar border-r border-border">
      <div className="flex h-24 items-center px-5 shrink-0">
        <Image
          src="/employee-logo.png"
          alt="Employee Portal"
          width={200}
          height={36}
          className="object-contain"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/60">
        <ul
          data-tutorial="sidebar-overview"
          className="flex flex-col gap-2 mb-4"
        >
          {overviewRoutes.map((route) => {
            const Icon = route.icon;
            const active = isActive(route.link);
            return (
              <li key={route.label}>
                <Link
                  href={route.link}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-4 text-sm transition-colors",
                    active
                      ? "bg-[#4ED251] text-white border-l-4 border-[#ff8b2d]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {Icon && (
                    <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  )}
                  <span className="flex-1 truncate">{route.label}</span>
                  {route.badge !== undefined && (
                    <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-1">
                      {route.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {grouped.map((section, idx) => (
          <div key={section.group} className="mb-2">
            <button
              {...(idx === 0 ? { "data-tutorial": "sidebar-nav" } : {})}
              onClick={() => toggleGroup(section.group)}
              className="w-full flex items-center justify-between px-3 py-4 hover:bg-accent/60 transition-colors cursor-pointer"
            >
              <span className="text-sm font-semibold uppercase text-muted-foreground">
                {section.group}
              </span>
              {openGroups[section.group] ? (
                <ChevronDown size={16} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </button>

            {openGroups[section.group] && (
              <ul className="flex flex-col gap-2 mt-2">
                {section.items.map((route) => {
                  const Icon = route.icon;
                  const active = isActive(route.link);
                  return (
                    <li key={route.label}>
                      <Link
                        href={route.link}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-4 text-sm transition-colors",
                          active
                            ? "bg-[#4ED251] text-white border-l-4 border-[#ff8b2d]"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {Icon && (
                          <Icon
                            size={15}
                            strokeWidth={1.75}
                            className="shrink-0"
                          />
                        )}
                        <span className="flex-1 truncate">{route.label}</span>
                        {route.badge !== undefined && (
                          <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-1">
                            {route.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
