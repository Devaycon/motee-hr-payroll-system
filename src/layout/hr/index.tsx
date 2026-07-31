"use client";

import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar/sidebar";
import { LogoPatternBackground } from "@/src/components/shared/logo-pattern-background";
import { MoteeFollowingPointer } from "@/src/components/shared/motee-following-pointer";
import { SidebarInset } from "@/src/layout/shared/sidebar-collapse";
import { useCurrentUser } from "@/src/lib/auth/demo-identity";

const HrLayout = ({ children }: { children: ReactNode }) => {
  // Resolves (and seeds) the signed-in user so the admin portal and
  // self-service are the same person even on a cold load.
  useCurrentUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <SidebarInset>
        <Navbar />
        <main className="relative flex-1 overflow-clip p-6">
          <LogoPatternBackground />
          {/* <MoteeFollowingPointer logoSrc="/single-logo.png" /> */}
          <div className="relative z-10">{children}</div>
        </main>
      </SidebarInset>
    </div>
  );
};

export default HrLayout;
