import { LeaveSchemeBuilder } from "@/src/components/hr/leave/schemes/scheme-builder";
import { NotIntegrated } from "@/src/components/shared/not-integrated";

// Leave schemes have no API yet; the rest of /time-payroll/leave is live.
export default async function LeaveSchemeRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <NotIntegrated page label="Leave schemes">
      <LeaveSchemeBuilder schemeId={id} />
    </NotIntegrated>
  );
}
