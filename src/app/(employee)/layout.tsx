import { ReactNode, Suspense } from "react";
import EmployeeLayout from "@/src/layout/employee";
import RouteGuard from "@/src/components/RouteGuard";
import { NotIntegrated } from "@/src/components/shared/not-integrated";

// Self-service has no screens on the API yet, so every page in it is shown as
// designed but inert. Lift the wrapper page by page as they are integrated.
// Suspense lets pages that read useSearchParams() prerender at build time.
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAuth requireSetup>
      <EmployeeLayout>
        <NotIntegrated page label="Self-service">
          <Suspense>{children}</Suspense>
        </NotIntegrated>
      </EmployeeLayout>
    </RouteGuard>
  );
};

export default Layout;
