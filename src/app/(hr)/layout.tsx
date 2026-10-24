import { ReactNode, Suspense } from "react";
import HrLayout from "@/src/layout/hr";
import { HrAccessGuard } from "@/src/layout/hr/access-guard";
import RouteGuard from "@/src/components/RouteGuard";

// Suspense lets pages that read useSearchParams() prerender at build time.
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAuth requireSetup>
      <HrLayout>
        <HrAccessGuard>
          <Suspense>{children}</Suspense>
        </HrAccessGuard>
      </HrLayout>
    </RouteGuard>
  );
};

export default Layout;
