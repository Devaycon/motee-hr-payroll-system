import { ReactNode, Suspense } from "react";
import EmployeeLayout from "@/src/layout/employee";

// Suspense lets pages that read useSearchParams() prerender at build time.
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <EmployeeLayout>
      <Suspense>{children}</Suspense>
    </EmployeeLayout>
  );
};

export default Layout;
