import { ReactNode } from "react";
import HrLayout from "@/src/layout/hr";
import { HrAccessGuard } from "@/src/layout/hr/access-guard";
import RouteGuard from "@/src/components/RouteGuard";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAuth requireSetup>
      <HrLayout>
        <HrAccessGuard>{children}</HrAccessGuard>
      </HrLayout>
    </RouteGuard>
  );
};

export default Layout;
