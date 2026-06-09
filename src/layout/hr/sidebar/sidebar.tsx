"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, Search, X } from "lucide-react";
import { routes } from "./routes";
import type { Route } from "./routes";
import { useVisibleRoutes } from "./permissions";
import { cn } from "@/src/lib/utils";

const Sidebar = () => {
  const pathname = usePathname();
  const visibleRoutes = useVisibleRoutes(routes);
  const [query, setQuery] = useState("");

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

  const renderRouteLink = (route: Route) => {
    const Icon = route.icon;
    const active = isActive(route.link, route.exact);
    return (
      <li key={`${route.group}-${route.label}`}>
        <Link
          href={route.link}
          onClick={() => setQuery("")}
          className={cn(
            "flex items-center gap-2.5 px-3 py-4 text-sm transition-colors",
            active
              ? "bg-primary text-white border-l-4 border-[#4ED251]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {Icon && <Icon size={15} strokeWidth={1.75} className="shrink-0" />}
          <span className="flex-1 truncate">{route.label}</span>
          {route.badge !== undefined && (
            <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold px-1">
              {route.badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[20%] flex-col bg-sidebar border-r border-border">
      <div className="flex h-24 items-center px-5 shrink-0">
        <Image
          src="/hr-logo.png"
          alt="HR Management"
          width={200}
          height={36}
          className="object-contain"
        />
      </div>

      <div className="px-3 pb-2 shrink-0">
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
          {overviewRoutes.map((route) => {
            const Icon = route.icon;
            const active = isActive(route.link, route.exact);
            return (
              <li key={route.label}>
                <Link
                  href={route.link}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-4 text-sm transition-colors",
                    active
                      ? "bg-primary text-white border-l-4 border-[#4ED251]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {Icon && (
                    <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  )}
                  <span className="flex-1 truncate">{route.label}</span>
                  {route.badge !== undefined && (
                    <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold px-1">
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
                  const active = isActive(route.link, route.exact);
                  return (
                    <li key={route.label}>
                      <Link
                        href={route.link}
                        className={cn(
                          "flex items-center gap-2.5  px-3 py-4 text-sm transition-colors",
                          active
                            ? "bg-primary text-white border-l-4 border-[#4ED251]"
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
                          <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold px-1">
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
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
