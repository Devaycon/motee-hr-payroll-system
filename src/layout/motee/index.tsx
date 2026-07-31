"use client";

import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar/sidebar";
import { LogoPatternBackground } from "@/src/components/shared/logo-pattern-background";
import { MoteeFollowingPointer } from "@/src/components/shared/motee-following-pointer";
import { SidebarInset } from "@/src/layout/shared/sidebar-collapse";

const MoteeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <SidebarInset>
        <Navbar />
        <main className="relative flex-1 overflow-hidden p-6">
          <LogoPatternBackground />
          <MoteeFollowingPointer logoSrc="/single-logo.png" />
          <div className="relative z-10">{children}</div>
        </main>
      </SidebarInset>
    </div>
  );
};

export default MoteeLayout;
