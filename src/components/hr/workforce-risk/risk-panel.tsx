"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { cn } from "@/src/lib/utils";
import { useCan } from "@/src/lib/permissions/use-can";
import { RISK_KIND_LABELS, RISK_KINDS, isRiskOpen, type RiskKind } from "@/src/lib/types/workforce-risk";
import type { RiskEntry } from "@/src/lib/workforce-risk/register";
import { RISK_MODULE, useRiskRegister } from "./hooks";
import { BasisBadge, KindBadge, PriorityBadge, StatusBadge, matchesLensFilters, riskHref, whereLabel } from "./shared";

const PREVIEW_ROWS = 6;

type KindTab = RiskKind | "all";

/**
 * "Emerging Workforce Risks & Recommended Actions" — the concise section the
 * client asked for on the Workforce Lens overview. Follows the Lens's branch
 * and department filters, so narrowing the Lens narrows the risks with it.
 */
interface RiskPanelProps {
  branch: string;
  department: string;
  /** Rows shown before "View all" sends you to the register. */
  limit?: number;
}

export function RiskPanel(props: RiskPanelProps) {
  const canView = useCan(RISK_MODULE, "view");
  if (!canView) return null;
  return <RiskPanelBody {...props} />;
}

function RiskPanelBody({ branch, department, limit = PREVIEW_ROWS }: RiskPanelProps) {
  const router = useRouter();
  const { loading, entries } = useRiskRegister();
  const [tab, setTab] = useState<KindTab>("all");

  const open = useMemo(
    () => entries.filter((e) => isRiskOpen(e.status) && matchesLensFilters(e, branch, department)),
    [entries, branch, department],
  );
  const shown = tab === "all" ? open : open.filter((e) => e.risk.kind === tab);
  const count = (k: RiskKind) => open.filter((e) => e.risk.kind === k).length;
  const overdue = open.filter((e) => e.overdue).length;

  const query = new URLSearchParams();
  if (tab !== "all") query.set("kind", tab);
  if (branch !== "all") query.set("branch", branch);
  const allHref = `/organization/workforce-lens/risks${query.size ? `?${query}` : ""}`;

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">Emerging Workforce Risks &amp; Recommended Actions</h2>
          <p className="text-xs text-muted-foreground">
            What needs attention, why it matters and who is acting on it.
            {overdue > 0 && (
              <span className="ml-1 font-medium text-rose-600 dark:text-rose-400">
                {overdue} overdue {overdue === 1 ? "action" : "actions"}.
              </span>
            )}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href={allHref}>
            Open risk register
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as KindTab)} className="px-4 pt-3">
        <PageTabsList
          tabs={[
            { value: "all", label: `All open (${open.length})` },
            ...RISK_KINDS.map((k) => ({ value: k, label: `${RISK_KIND_LABELS[k]} (${count(k)})` })),
          ]}
        />
      </Tabs>

      <div className="p-4 pt-3">
        {loading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-10 text-center">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <p className="text-sm font-medium">Nothing open here</p>
            <p className="text-xs text-muted-foreground">No risks match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <RiskTable entries={shown.slice(0, limit)} onOpen={(e) => router.push(riskHref(e))} />
            </div>
            {shown.length > limit && (
              <Link href={allHref} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                View all {shown.length}
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** The register table, shared by the Lens section and the register page. */
export function RiskTable({ entries, onOpen }: { entries: RiskEntry[]; onOpen: (e: RiskEntry) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[90px]">Priority</TableHead>
          <TableHead>Issue</TableHead>
          <TableHead>Branch / Department</TableHead>
          <TableHead className="hidden lg:table-cell">Potential impact</TableHead>
          <TableHead className="hidden md:table-cell">Recommended action</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow
            key={e.key}
            className={cn("cursor-pointer align-top", e.overdue && "bg-rose-500/5")}
            onClick={() => onOpen(e)}
          >
            <TableCell>
              <PriorityBadge priority={e.risk.priority} />
            </TableCell>
            <TableCell className="min-w-[200px] whitespace-normal">
              <p className="text-sm font-medium">{e.risk.title}</p>
              <p className="text-xs text-muted-foreground">{e.risk.affected.label}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <KindBadge kind={e.risk.kind} />
                {e.risk.basis === "forecast" && <BasisBadge basis="forecast" />}
              </div>
            </TableCell>
            <TableCell className="text-xs">{whereLabel(e)}</TableCell>
            <TableCell className="hidden max-w-[260px] whitespace-normal text-xs text-muted-foreground lg:table-cell">
              <p className="line-clamp-3">{e.risk.impact}</p>
            </TableCell>
            <TableCell className="hidden max-w-[260px] whitespace-normal text-xs md:table-cell">
              <p className="line-clamp-3">{e.recommendation}</p>
            </TableCell>
            <TableCell className="text-xs">{e.owner ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
            <TableCell className="whitespace-nowrap text-xs tabular-nums">
              {e.dueDate ?? "—"}
              {e.overdue && (
                <span className="mt-0.5 flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="size-3" />
                  {e.escalated ? "Escalate" : "Overdue"}
                </span>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={e.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
