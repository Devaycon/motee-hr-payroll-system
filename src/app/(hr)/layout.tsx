import { ReactNode, Suspense } from "react";
import HrLayout from "@/src/layout/hr";
import { HrAccessGuard } from "@/src/layout/hr/access-guard";

// Suspense lets pages that read useSearchParams() prerender at build time.
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <HrLayout>
      <HrAccessGuard>
        <Suspense>{children}</Suspense>
      </HrAccessGuard>
    </HrLayout>
  );
};

export default Layout;
