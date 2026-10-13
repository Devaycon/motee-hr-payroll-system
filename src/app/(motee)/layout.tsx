import { ReactNode } from "react";
import MoteeLayout from "@/src/layout/motee";
import RouteGuard from "@/src/components/RouteGuard";
import { NotIntegrated } from "@/src/components/shared/not-integrated";

// The platform console's screens are not wired to the API yet, so every page
// in it is shown as designed but inert.
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <RouteGuard requireAuth>
      <MoteeLayout>
        <NotIntegrated page label="The platform console">
          {children}
        </NotIntegrated>
      </MoteeLayout>
    </RouteGuard>
  );
};

export default Layout;
