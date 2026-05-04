import { ReactNode } from "react";
import HrLayout from "@/src/layout/hr";

const Layout = ({ children }: { children: ReactNode }) => {
  return <HrLayout>{children}</HrLayout>;
};

export default Layout;
