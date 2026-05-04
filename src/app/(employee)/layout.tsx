import { ReactNode } from "react";
import EmployeeLayout from "@/src/layout/employee";

const Layout = ({ children }: { children: ReactNode }) => {
  return <EmployeeLayout>{children}</EmployeeLayout>;
};

export default Layout;
