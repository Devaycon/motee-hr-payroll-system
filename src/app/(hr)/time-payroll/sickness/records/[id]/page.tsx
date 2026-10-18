import { SicknessRecordDetail } from "@/src/components/hr/sickness/record-detail";

export default async function SicknessRecordRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SicknessRecordDetail id={id} />;
}
