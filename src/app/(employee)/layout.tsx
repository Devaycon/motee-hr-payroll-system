import { ReactNode } from "react";
import RouteGuard from "@/src/components/RouteGuard";
import { NotLive } from "@/src/components/shared/not-live";

// Self-service has no screens on the live API yet, so the whole portal is held
// back. Restore `EmployeeLayout` around `children` as its modules are wired.
const Layout = ({ children: _children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAuth requireSetup>
      <div className="flex min-h-screen">
        <NotLive />
      </div>
    </RouteGuard>
  );
};

export default Layout;
