import { SchemeBuilder } from "@/src/components/hr/sickness/scheme-builder";

export default async function SchemeRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SchemeBuilder schemeId={id} />;
}
