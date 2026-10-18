import { ReactNode, Suspense } from "react";
import MoteeLayout from "@/src/layout/motee";

// Suspense lets pages that read useSearchParams() prerender at build time.
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <MoteeLayout>
      <Suspense>{children}</Suspense>
    </MoteeLayout>
  );
};

export default Layout;
