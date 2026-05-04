import { ReactNode } from "react";
import MoteeLayout from "@/src/layout/motee";

const Layout = ({ children }: { children: ReactNode }) => {
  return <MoteeLayout>{children}</MoteeLayout>;
};

export default Layout;
