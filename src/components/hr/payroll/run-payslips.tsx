"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Eye, MoreHorizontal, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { PayslipDocument } from "@/src/components/shared/payslip/payslip-document";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { buildPayslips } from "@/src/lib/payroll/run-builder";
import { usePayrollActions, useRun } from "@/src/lib/payroll/use-payroll";
import type { Payslip } from "@/src/lib/payroll/types";
import { ListPagination } from "@/src/components/shared/list-pagination";
import { money } from "./components/shared";

/** Width the payslip is laid out at before it is scaled down to a thumbnail. */
const PAPER_WIDTH = 880;
const THUMB_WIDTH = 64;
const PAGE_SIZE = 10;

const hrPayslipHref = (p: Payslip) =>
  `/organization/employees/${encodeURIComponent(p.employeeId)}/payslips/${encodeURIComponent(p.id)}`;

/**
 * Every payslip in a run as a table — a thumbnail of each slip, its figures,
 * and per-row view / download / resend. A finalized run lists the issued
 * payslips; an open run lists watermarked draft previews. Printing (one slip,
 * or all filtered ones) still puts one payslip on each A4 page.
 */
export function RunPayslipsPage({ runId }: { runId: string }) {
  const { run, data, bundle, loading } = useRun(runId);
  const actions = usePayrollActions();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<Payslip | null>(null);
  /** The slips being printed: null when idle, one id for a download, all shown for the bulk button. */
  const [printing, setPrinting] = useState<{ ids: string[]; title: string } | null>(null);

  const locked = run?.status === "finalized" || run?.status === "disbursed";
  const payslips = useMemo(() => {
    if (!run || !data || !bundle) return [];
    const list =
      run.status === "finalized" || run.status === "disbursed"
        ? data.payslips.filter((p) => p.runId === run.id)
        : buildPayslips({ run, bundle, data, status: "draft", approvedBy: null, generatedAt: run.calculatedAt ?? run.createdAt });
    return [...list].sort((a, b) => a.reference.localeCompare(b.reference));
  }, [run, data, bundle]);
  const shown = payslips.filter(
    (p) => !q || `${p.employee.fullName} ${p.employee.departmentName} ${p.employee.employeeNumber}`.toLowerCase().includes(q.toLowerCase()),
  );
  // Clamped so a narrowing filter never strands the table on an empty page.
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = shown.slice(pageStart, pageStart + PAGE_SIZE);

  // Print once the chosen slips are in the print root; the document title
  // becomes the suggested PDF file name.
  useEffect(() => {
    if (!printing) return;
    const previous = document.title;
    document.title = printing.title;
    const done = () => {
      document.title = previous;
      setPrinting(null);
    };
    window.addEventListener("afterprint", done, { once: true });
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", done);
      document.title = previous;
    };
  }, [printing]);

  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!run) return <p className="py-20 text-center text-sm text-muted-foreground">Run not found.</p>;

  const download = (p: Payslip) => setPrinting({ ids: [p.id], title: `${p.reference} ${p.employee.fullName}` });
  const resend = (p: Payslip) => {
    actions.resendPayslip(p);
    toast.success(`Payslip resent to ${p.employee.fullName}`, { description: p.employee.email || undefined });
  };
  const toPrint = printing ? payslips.filter((p) => printing.ids.includes(p.id)) : [];

  return (
    <div className="flex flex-col gap-5 pb-10">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html { font-size: 10px !important; }
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .payslip-bulk-root, .payslip-bulk-root * { visibility: visible !important; }
          .payslip-bulk-root { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
          .payslip-bulk-root .payslip-paper { break-after: page; page-break-after: always; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .payslip-bulk-root .payslip-paper:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <Link href={`${PAYROLL_HREF}/${run.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {run.title}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Payslips · {run.title}</h1>
          <p className="text-xs text-muted-foreground">
            {payslips.length} payslip{payslips.length === 1 ? "" : "s"} {locked ? "as issued" : "— draft previews, not valid until the run is finalized"}. Printing puts one payslip on each A4 page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input className="h-8 w-56 text-xs" placeholder="Filter by name, ID or department" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!shown.length}
            onClick={() => setPrinting({ ids: shown.map((p) => p.id), title: `Payslips ${run.title}` })}
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save {shown.length} as PDF
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card print:hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-22 pl-4">Payslip</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  {payslips.length ? "No payslips match that filter." : "No payslips in this run yet."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-2 pl-4">
                    <button
                      type="button"
                      onClick={() => setPreview(p)}
                      className="block cursor-zoom-in rounded-md ring-offset-background transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`Preview ${p.employee.fullName}'s payslip`}
                    >
                      <PayslipThumbnail payslip={p} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{p.employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.employee.employeeNumber} · {p.employee.departmentName}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{money(p.computation.gross)}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-amber-600">{money(p.computation.totalDeductions)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">{money(p.computation.net)}</TableCell>
                  <TableCell>
                    <StatusBadge payslip={p} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Payslip actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {p.status === "final" ? (
                          <DropdownMenuItem asChild className="gap-2 text-xs">
                            <Link href={hrPayslipHref(p)}>
                              <Eye className="h-3.5 w-3.5" /> View payslip
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="gap-2 text-xs" onClick={() => setPreview(p)}>
                            <Eye className="h-3.5 w-3.5" /> Preview draft
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2 text-xs" onClick={() => download(p)}>
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-xs" disabled={p.status !== "final"} onClick={() => resend(p)}>
                          <Send className="h-3.5 w-3.5" /> Resend payslip
                          {p.status !== "final" && <span className="ml-auto text-[10px] text-muted-foreground">Not issued</span>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="border-t px-4 pb-3 pt-1">
            <ListPagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              summary={`Showing ${pageStart + 1}–${pageStart + pageRows.length} of ${shown.length} payslips`}
            />
          </div>
        )}
      </div>

      {/* Only filled while printing — the table above is hidden on paper. */}
      <div className="payslip-bulk-root hidden">
        {toPrint.map((p) => (
          <PayslipDocument key={p.id} payslip={p} />
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-230 print:hidden">
          {preview && (
            <>
              <DialogHeader className="flex-row items-center justify-between gap-3 pr-8">
                <DialogTitle className="text-base">
                  {preview.employee.fullName} · {preview.period.label}
                </DialogTitle>
                <div className="flex gap-2">
                  {preview.status === "final" && (
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <Link href={hrPayslipHref(preview)}>
                        <Eye className="h-3.5 w-3.5" /> Open page
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" className="gap-1.5" onClick={() => { const p = preview; setPreview(null); download(p); }}>
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </Button>
                </div>
              </DialogHeader>
              <PayslipDocument payslip={preview} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** The real payslip, laid out at paper width and scaled down — so the thumbnail is always the actual slip. */
function PayslipThumbnail({ payslip }: { payslip: Payslip }) {
  const scale = THUMB_WIDTH / PAPER_WIDTH;
  return (
    <div
      aria-hidden
      className="pointer-events-none relative h-22.5 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"
      style={{ width: THUMB_WIDTH }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: PAPER_WIDTH, transform: `scale(${scale})` }}>
        <PayslipDocument payslip={payslip} />
      </div>
    </div>
  );
}

function StatusBadge({ payslip }: { payslip: Payslip }) {
  if (payslip.status === "draft")
    return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600">Draft</Badge>;
  if (payslip.verification.revoked)
    return <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-600">Revoked</Badge>;
  return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600">Issued</Badge>;
}
