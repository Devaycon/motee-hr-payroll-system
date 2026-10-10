"use client";

import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { useLogout } from "@/src/lib/auth/session";
import {
  useCurrentUser,
  DEMO_IDENTITY_PLACEHOLDER,
} from "@/src/lib/auth/demo-identity";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// const formatTime = (date: Date) =>
//   date.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   });

const Navbar = () => {
  const [now, setNow] = useState(new Date());
  const logout = useLogout();
  // Same resolution as the self-service navbar, so switching portals never
  // looks like it switched who you are.
  const user = useCurrentUser();
  const adminName = user?.name ?? DEMO_IDENTITY_PLACEHOLDER.name;
  const adminInitials = user?.initials ?? DEMO_IDENTITY_PLACEHOLDER.initials;
  const adminSubtitle = user?.roleName ?? DEMO_IDENTITY_PLACEHOLDER.jobTitle;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-18 items-center justify-between bg-sidebar border-b border-border px-6">
        <div className="flex items-center gap-3 flex-1 max-w-xs" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5">
            <span className="flex items-center gap-2">
              <Calendar size={13} className="text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {formatDate(now)}
              </span>
            </span>
            {/* <span className="h-3.5 w-px bg-border" />
            <span className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                {formatTime(now)}
              </span>
            </span> */}
          </div>

          <span data-tutorial="theme">
            <ThemeToggle />
          </span>

          <Popover>
            <PopoverTrigger asChild>
              <div
                data-tutorial="profile"
                className="cursor-pointer flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2"
              >
                <PersonAvatar
                  name={adminName}
                  initials={adminInitials}
                  size="sm"
                  className="size-7"
                  fallbackClassName="bg-primary text-primary-foreground text-xs font-semibold"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground leading-none">
                    {adminName}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {adminSubtitle}
                  </span>
                </div>
                <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1.5">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>
    </>
  );
};

export default Navbar;
