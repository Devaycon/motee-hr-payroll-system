import { RiskDetailPage } from "@/src/components/hr/workforce-risk/risk-detail";

export const metadata = { title: "Workforce Risk" };

export default async function WorkforceRiskDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RiskDetailPage id={decodeURIComponent(id)} />;
}
