import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hire Detail" };

const HireTrackerDetailPage = dynamic(() =>
  import("@/src/components/hr/hire-tracker/detail").then(
    (m) => m.HireTrackerDetailPage,
  ),
);

export default async function HireTrackerDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HireTrackerDetailPage id={id} />;
}
