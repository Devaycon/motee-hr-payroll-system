import { ReactNode } from "react";
import RouteGuard from "@/src/components/RouteGuard";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return <RouteGuard requireAuth={false}>{children}</RouteGuard>;
};

export default AuthLayout;
