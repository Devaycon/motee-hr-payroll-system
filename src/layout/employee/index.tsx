"use client";

import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar/sidebar";
import { LogoPatternBackground } from "@/src/components/shared/logo-pattern-background";
import { MoteeFollowingPointer } from "@/src/components/shared/motee-following-pointer";
import { SidebarInset } from "@/src/layout/shared/sidebar-collapse";
import { useCurrentUser } from "@/src/lib/auth/demo-identity";
import { PresenceCheckWatcher } from "@/src/components/employee/attendance/presence-check-watcher";

const EmployeeLayout = ({ children }: { children: ReactNode }) => {
  // Resolves (and seeds) the signed-in user so self-service and the admin
  // portal are the same person even on a cold load.
  useCurrentUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <SidebarInset>
        <Navbar />
        <main className="relative flex-1 overflow-hidden p-6">
          <LogoPatternBackground />
          {/* <MoteeFollowingPointer logoSrc="/single-logo.png" /> */}
          <div className="relative z-10">{children}</div>
        </main>
      </SidebarInset>
      {/* Mounted once here rather than inside the Attendance page — a
          presence check should keep firing regardless of which page the
          employee is on while clocked in. */}
      <PresenceCheckWatcher />
    </div>
  );
};

export default EmployeeLayout;
