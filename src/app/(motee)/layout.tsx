import { ReactNode } from "react";
import RouteGuard from "@/src/components/RouteGuard";
import { PlatformShell } from "@/src/layout/motee/platform-shell";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAuth>
      <PlatformShell>{children}</PlatformShell>
    </RouteGuard>
  );
};

export default Layout;
