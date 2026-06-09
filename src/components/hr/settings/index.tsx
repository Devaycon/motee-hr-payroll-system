"use client";

import { useState, type ReactNode } from "react";
import {
  User,
  CalendarClock,
  ShieldCheck,
  Users,
  Plug,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { AccountCategory } from "./components/account-category";
import { AbsenceCategory } from "./components/absence-category";
import { SecurityCategory } from "./components/security-category";
import { PermissionsCategory } from "./components/permissions-category";
import { IntegrationsCategory } from "./components/integrations-category";

interface Category {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  render: () => ReactNode;
}

const CATEGORIES: Category[] = [
  {
    id: "account",
    label: "Account",
    description: "Profile, modules, pick lists and notifications.",
    icon: User,
    render: () => <AccountCategory />,
  },
  {
    id: "absence",
    label: "Absence & Attendance",
    description: "Working patterns, holidays and blackout periods.",
    icon: CalendarClock,
    render: () => <AbsenceCategory />,
  },
  {
    id: "security",
    label: "Security",
    description: "Two-factor authentication and password policy.",
    icon: ShieldCheck,
    render: () => <SecurityCategory />,
  },
  {
    id: "permissions",
    label: "Permissions & Approvals",
    description: "Roles, permissions and approval workflows.",
    icon: Users,
    render: () => <PermissionsCategory />,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "API access and calendar subscriptions.",
    icon: Plug,
    render: () => <IntegrationsCategory />,
  },
];

export function SettingsPage() {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold text-foreground">
          Settings &amp; Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage account, absence policies, security, permissions and
          integrations.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Category rail */}
        <nav className="flex shrink-0 gap-2 overflow-x-auto lg:sticky lg:top-24 lg:w-64 lg:flex-col lg:self-start lg:overflow-visible">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = category.id === activeId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveId(category.id)}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors lg:w-full",
                  isActive
                    ? "border-transparent bg-[#ff8b2d] text-white shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-muted/50",
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0",
                    isActive ? "text-white" : "text-muted-foreground",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {category.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 hidden text-xs leading-tight lg:block",
                      isActive ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    {category.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">{active.render()}</div>
      </div>
    </div>
  );
}
