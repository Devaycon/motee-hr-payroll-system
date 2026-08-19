"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { routes } from "./routes";
import type { Route } from "./routes";
import { cn } from "@/src/lib/utils";
import { useNavFavourites } from "@/src/lib/hooks/use-nav-favourites";
import { useHasDirectReports } from "@/src/components/employee/team/hooks";
import {
  useSidebarCollapse,
  SidebarToggle,
} from "@/src/layout/shared/sidebar-collapse";
import { SidebarNavLink } from "@/src/layout/shared/sidebar-nav-link";
import { SidebarBrand } from "@/src/layout/shared/sidebar-brand";

/** The employee portal's own accent, passed through to the shared link. */
const ACTIVE = "bg-[#4ED251] text-white border-l-4 border-[#ff8b2d]";
const ACTIVE_COLLAPSED = "bg-[#4ED251] text-white";
const BADGE = "bg-primary/10 text-primary";

const Sidebar = () => {
  const pathname = usePathname();
  const hasReports = useHasDirectReports();
  const { collapsed, toggle, width } = useSidebarCollapse();
  const { favourites, toggle: toggleFavourite, isFavourite } =
    useNavFavourites("employee");

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

  const renderRouteLink = (route: Route, keyPrefix = "") => (
    <SidebarNavLink
      key={`${keyPrefix}${route.label}`}
      href={route.link}
      label={route.label}
      icon={route.icon}
      badge={route.badge}
      active={isActive(route.link)}
      collapsed={collapsed}
      activeClassName={ACTIVE}
      activeCollapsedClassName={ACTIVE_COLLAPSED}
      badgeClassName={BADGE}
      favourite={isFavourite(route.link)}
      onToggleFavourite={() => toggleFavourite(route.link)}
    />
  );

  // Resolved against the visible routes, so a pinned manager-only page drops
  // out for someone who no longer has reports.
  const favouriteRoutes = favourites
    .map((link) => visibleRoutes.find((r) => r.link === link))
    .filter((r): r is Route => Boolean(r));

  return (
    <aside
      style={{ width }}
      className="fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar border-r border-border transition-[width] duration-200"
    >
      {/* Collapsed, the wordmark won't fit — the tile mark stands in. */}
      <div
        className={cn(
          "flex h-24 shrink-0 items-center",
          collapsed ? "flex-col justify-center gap-2" : "gap-2 px-5",
        )}
      >
        <SidebarBrand
          href="/employee/dashboard"
          label="Employee Portal"
          wordmark="/employee-logo.png"
          collapsed={collapsed}
        />
        {!collapsed && <div className="flex-1" />}
        <SidebarToggle collapsed={collapsed} onToggle={toggle} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/60">
        {favouriteRoutes.length > 0 && (
          <div className="mb-4">
            {collapsed ? (
              <div className="mx-3 mb-2 border-t border-border" />
            ) : (
              <p className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-muted-foreground">
                <Star size={13} className="fill-amber-500 text-amber-500" />
                Favourites
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {favouriteRoutes.map((route) => renderRouteLink(route, "fav-"))}
            </ul>
            <div className="mx-3 mt-3 border-t border-border" />
          </div>
        )}

        <ul
          data-tutorial="sidebar-overview"
          className="flex flex-col gap-2 mb-4"
        >
          {overviewRoutes.map((route) => renderRouteLink(route))}
        </ul>

        {grouped.map((section, idx) => (
          <div key={section.group} className="mb-2">
            {/* Collapsed, a group header labels nothing — a rule keeps the
                grouping legible without the words. */}
            {collapsed ? (
              idx > 0 && <div className="mx-3 my-2 border-t border-border" />
            ) : (
              <button
                {...(idx === 0 ? { "data-tutorial": "sidebar-nav" } : {})}
                onClick={() => toggleGroup(section.group)}
                className="w-full flex items-center justify-between px-3 py-4 hover:bg-accent/60 transition-colors cursor-pointer"
              >
                <span className="text-sm font-semibold text-muted-foreground">
                  {section.group}
                </span>
                {openGroups[section.group] ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </button>
            )}

            {/* Collapsing a group in the rail would strand the user with no way
                back to those items, so the rail always shows every one. */}
            {(collapsed || openGroups[section.group]) && (
              <ul className="flex flex-col gap-2 mt-2">
                {section.items.map((route) => renderRouteLink(route))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
