import { ReturnToWorkForm } from "@/src/components/hr/sickness/return-to-work";

export default async function ReturnToWorkFormRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReturnToWorkForm id={id} />;
}
