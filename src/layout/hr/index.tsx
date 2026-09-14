"use client";

import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar/sidebar";
import { LogoPatternBackground } from "@/src/components/shared/logo-pattern-background";
import { MoteeFollowingPointer } from "@/src/components/shared/motee-following-pointer";
import { SidebarInset } from "@/src/layout/shared/sidebar-collapse";
import { useCurrentUser } from "@/src/lib/auth/demo-identity";
import { RolePreviewBanner } from "@/src/components/hr/access-levels/components/preview-banner";
import { BranchScopeBanner } from "@/src/components/hr/branches/components/branch-scope-banner";

const HrLayout = ({ children }: { children: ReactNode }) => {
  // Resolves (and seeds) the signed-in user so the admin portal and
  // self-service are the same person even on a cold load.
  useCurrentUser();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <SidebarInset>
        <Navbar />
        {/* §1.10 — sits under the navbar so it is visible on every admin page
            for as long as the preview is on, not just where it was started. */}
        <RolePreviewBanner />
        {/* Same reasoning as the preview banner above: branch scope is set on
            the Branches page but applies everywhere, so its reminder — and its
            exit — have to live in the shell. */}
        <BranchScopeBanner />
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
