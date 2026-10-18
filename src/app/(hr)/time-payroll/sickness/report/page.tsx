"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SicknessShell } from "@/src/components/hr/sickness/shell";
import { ReportSicknessForm } from "@/src/components/hr/sickness/report-form";
import { SICKNESS_BASE } from "@/src/components/hr/sickness/hooks";

export default function ReportSicknessRoute() {
  const router = useRouter();
  const employee = useSearchParams().get("employee") ?? undefined;
  return (
    <SicknessShell>
      <h2 className="text-xl font-semibold">Report Sickness</h2>
      <ReportSicknessForm
        mode="hr"
        initialEmployeeId={employee}
        onDone={(id) => router.push(id ? `${SICKNESS_BASE}/records/${id}` : SICKNESS_BASE)}
      />
    </SicknessShell>
  );
}
