import { ReactNode, Suspense } from "react";
import EmployeeLayout from "@/src/layout/employee";
import RouteGuard from "@/src/components/RouteGuard";
import { SelfServiceGate } from "@/src/layout/employee/self-service-gate";

// Self-service pages are shown as designed but inert until they are on the
// API; SelfServiceGate lifts the blur for the ones that are.
// Suspense lets pages that read useSearchParams() prerender at build time.
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAuth requireSetup>
      <EmployeeLayout>
        <SelfServiceGate>
          <Suspense>{children}</Suspense>
        </SelfServiceGate>
      </EmployeeLayout>
    </RouteGuard>
  );
};

export default Layout;
