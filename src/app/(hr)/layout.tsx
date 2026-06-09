import { ReactNode } from "react";
import HrLayout from "@/src/layout/hr";
import { HrAccessGuard } from "@/src/layout/hr/access-guard";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <HrLayout>
      <HrAccessGuard>{children}</HrAccessGuard>
    </HrLayout>
  );
};

export default Layout;
