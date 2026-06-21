import { ReactNode } from "react";

/**
 * Standalone full-screen shell for the joiner onboarding wizard — no HR/employee
 * sidebar, since a new joiner has no account yet. Providers come from the root
 * layout.
 */
const JoinLayout = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export default JoinLayout;
