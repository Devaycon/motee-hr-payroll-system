import { ReactNode } from "react";
import RouteGuard from "@/src/components/RouteGuard";

const SetupLayout = ({ children }: { children: ReactNode }) => {
  return <RouteGuard requireAuth>{children}</RouteGuard>;
};

export default SetupLayout;
