import { ReactNode } from "react";
import { NotIntegrated } from "@/src/components/shared/not-integrated";

/**
 * Standalone full-screen shell for the joiner onboarding wizard — no HR/employee
 * sidebar, since a new joiner has no account yet. Providers come from the root
 * layout.
 *
 * The wizard is not wired to the joiner endpoints yet, so it is shown as
 * designed but inert.
 */
const JoinLayout = ({ children }: { children: ReactNode }) => {
  return (
    <NotIntegrated page label="The joiner onboarding wizard">
      {children}
    </NotIntegrated>
  );
};

export default JoinLayout;
