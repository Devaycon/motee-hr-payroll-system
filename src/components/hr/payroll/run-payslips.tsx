"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PayslipDocument } from "@/src/components/shared/payslip/payslip-document";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { buildPayslips } from "@/src/lib/payroll/run-builder";
import { useRun } from "@/src/lib/payroll/use-payroll";

/**
 * Every payslip in a run on one page — for printing or "Save as PDF" in one
 * go (one payslip per A4 page). A finalized run shows the issued payslips;
 * an open run shows watermarked draft previews.
 */
export function RunPayslipsPage({ runId }: { runId: string }) {
  const { run, data, bundle, loading } = useRun(runId);
  const [q, setQ] = useState("");
  const payslips = useMemo(() => {
    if (!run || !data || !bundle) return [];
    const locked = run.status === "finalized" || run.status === "disbursed";
    const list = locked
      ? data.payslips.filter((p) => p.runId === run.id)
      : buildPayslips({ run, bundle, data, status: "draft", approvedBy: null, generatedAt: run.calculatedAt ?? run.createdAt });
    return [...list].sort((a, b) => a.reference.localeCompare(b.reference));
  }, [run, data, bundle]);
  const shown = payslips.filter((p) => !q || `${p.employee.fullName} ${p.employee.departmentName}`.toLowerCase().includes(q.toLowerCase()));

  if (loading || !data) return <Skeleton className="h-[800px] w-full rounded-xl" />;
  if (!run) return <p className="py-20 text-center text-sm text-muted-foreground">Run not found.</p>;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html { font-size: 10px !important; }
          body * { visibility: hidden !important; }
          .payslip-bulk-root, .payslip-bulk-root * { visibility: visible !important; }
          .payslip-bulk-root { position: absolute; left: 0; top: 0; width: 100%; }
          .payslip-bulk-root .payslip-paper { break-after: page; page-break-after: always; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .payslip-bulk-root .payslip-gap { display: none; }
        }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <Link href={`${PAYROLL_HREF}/${run.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {run.title}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Payslips · {run.title}</h1>
          <p className="text-xs text-muted-foreground">
            {payslips.length} payslip{payslips.length === 1 ? "" : "s"} {run.status === "finalized" || run.status === "disbursed" ? "as issued" : "— draft previews, not valid until the run is finalized"}. Printing puts one payslip on each A4 page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input className="h-8 w-56 text-xs" placeholder="Filter by name or department" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button size="sm" className="gap-1.5" onClick={() => window.print()} disabled={!shown.length}>
            <Printer className="h-3.5 w-3.5" /> Print / Save {shown.length} as PDF
          </Button>
        </div>
      </div>
      <div className="payslip-bulk-root flex flex-col gap-8">
        {shown.map((p) => (
          <div key={p.id}>
            <PayslipDocument payslip={p} />
            <div className="payslip-gap" />
          </div>
        ))}
      </div>
    </div>
  );
}
