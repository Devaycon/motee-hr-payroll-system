import { LeaveSchemeBuilder } from "@/src/components/hr/leave/schemes/scheme-builder";

export default async function LeaveSchemeRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeaveSchemeBuilder schemeId={id} />;
}
