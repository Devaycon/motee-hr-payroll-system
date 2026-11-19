import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Starter reconciliation" };

const StarterReconcilePage = dynamic(() => import("@/src/components/hr/payroll/starter-reconcile").then((m) => m.StarterReconcilePage));

export default async function StarterReconcileRoute({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  return <StarterReconcilePage batchId={decodeURIComponent(batchId)} />;
}
