"use client";

import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar/sidebar";
import { LogoPatternBackground } from "@/src/components/shared/logo-pattern-background";
import { MoteeFollowingPointer } from "@/src/components/shared/motee-following-pointer";

const HrLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-[20%] flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="relative flex-1 overflow-clip p-6">
          <LogoPatternBackground />
          {/* <MoteeFollowingPointer logoSrc="/single-logo.png" /> */}
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default HrLayout;
