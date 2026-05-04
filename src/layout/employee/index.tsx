"use client";

import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar/sidebar";
import { MoteeFollowingPointer } from "@/src/components/shared/motee-following-pointer";
import { AnimatedDotBackground } from "@/src/components/shared/animated-dot-background";

const EmployeeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-[20%] flex flex-1 flex-col">
        <Navbar />
        <main className="relative flex-1 overflow-hidden p-6">
          <AnimatedDotBackground dotColor="#4ED251" />
          <div className="pointer-events-none absolute inset-0 bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
          <MoteeFollowingPointer logoSrc="/employee-logo.png" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
