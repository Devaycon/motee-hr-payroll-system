"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Search, X } from "lucide-react";
import { routes } from "./routes";
import type { Route } from "./routes";
import { useVisibleRoutes } from "./permissions";
import { cn } from "@/src/lib/utils";
import {
  useSidebarCollapse,
  SidebarToggle,
} from "@/src/layout/shared/sidebar-collapse";
import { SidebarNavLink } from "@/src/layout/shared/sidebar-nav-link";
import { SidebarBrand } from "@/src/layout/shared/sidebar-brand";

const Sidebar = () => {
  const pathname = usePathname();
  const visibleRoutes = useVisibleRoutes(routes);
  const [query, setQuery] = useState("");
  const { collapsed, toggle, width } = useSidebarCollapse();

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const matches = searching
    ? visibleRoutes.filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.group.toLowerCase().includes(q),
      )
    : [];

  const overviewRoutes = visibleRoutes.filter((r) => r.group === "Overview");
  const otherRoutes = visibleRoutes.filter((r) => r.group !== "Overview");

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

  const isActive = (link: string, exact?: boolean) => {
    if (link === "/") return pathname === "/";
    if (exact) return pathname === link;
    return pathname === link || pathname.startsWith(`${link}/`);
  };

  const renderRouteLink = (route: Route) => (
    <SidebarNavLink
      key={`${route.group}-${route.label}`}
      href={route.link}
      label={route.label}
      icon={route.icon}
      badge={route.badge}
      active={isActive(route.link, route.exact)}
      collapsed={collapsed}
      onClick={() => setQuery("")}
    />
  );

  return (
    <aside
      style={{ width }}
      className="fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar border-r border-border transition-[width] duration-200"
    >
      {/* Collapsed, the wordmark won't fit — the tile mark stands in, and the
          toggle sits under it rather than beside it. */}
      <div
        className={cn(
          "flex shrink-0 items-center",
          collapsed ? "h-24 flex-col justify-center gap-2" : "h-24 gap-2 px-5",
        )}
      >
        <SidebarBrand
          href="/dashboard"
          label="MOTEE HRIS Portal"
          wordmark="/hr-logo.png"
          collapsed={collapsed}
        />
        {!collapsed && <div className="flex-1" />}
        <SidebarToggle collapsed={collapsed} onToggle={toggle} />
      </div>

      {/* Collapsed, the search field becomes the button that reopens the rail —
          there's nowhere to type, but the affordance shouldn't vanish. */}
      <div className={cn("shrink-0 pb-2", collapsed ? "px-2" : "px-3")}>
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="Search modules"
            title="Search modules"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <Search size={22} strokeWidth={1.75} />
          </button>
        ) : (
          <div className="relative">
            <Search
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules..."
              aria-label="Search modules"
              className="w-full h-9 rounded-md bg-accent/40 border border-border pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searching && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/60">
        {searching ? (
          <ul className="flex flex-col gap-1">
            {matches.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted-foreground">
                No modules match &ldquo;{query.trim()}&rdquo;.
              </li>
            ) : (
              matches.map((route) => renderRouteLink(route))
            )}
          </ul>
        ) : (
          <>
        <ul
          data-tutorial="sidebar-overview"
          className="flex flex-col gap-2 mb-4"
        >
          {overviewRoutes.map((route) => renderRouteLink(route))}
        </ul>

        {grouped.map((section, idx) => (
          <div key={section.group} className="mb-2">
            {/* Collapsed, a group header is just a label with nothing to label
                — a rule keeps the grouping legible without the words. */}
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

            {/* Collapsing a group hides its icons too, which would strand the
                user with no way back — so the rail always shows every item. */}
            {(collapsed || openGroups[section.group]) && (
              <ul className="flex flex-col gap-2 mt-2">
                {section.items.map((route) => renderRouteLink(route))}
              </ul>
            )}
          </div>
        ))}

        {!collapsed && (
          <div data-tutorial="sidebar-upgrade" className="shrink-0 px-3 pb-4">
            <div className="rounded-md bg-primary/10 p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
                  <Zap size={12} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  Upgrade Plan
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Unlock advanced HR features, analytics &amp; priority support.
              </p>
              <button className="w-full h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold transition-opacity hover:opacity-90">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
