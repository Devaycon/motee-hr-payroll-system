"use client";

import { useMemo, useState } from "react";
import { Banknote, BellRing, CircleCheck, Clock, Wallet } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { isClaimOpen } from "@/src/lib/expenses/stages";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import { useHrExpenseClaims } from "./hooks";
import { ClaimsTable } from "./components/claims-table";

/** KPI drill-downs; "all" clears the filter. */
type CardFilter = "all" | "submitted" | "approved" | "reimbursed";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Claims paid out in the last `days`. Kept out of the component so the clock
 *  is never read during render (`react-hooks/purity`). */
function reimbursedWithin(claims: ExpenseClaim[], days: number): ExpenseClaim[] {
  const cutoff = Date.now() - days * DAY_MS;
  return claims.filter(
    (c) =>
      c.status === "reimbursed" &&
      new Date(`${c.dateSubmitted}T00:00:00`).getTime() >= cutoff,
  );
}

/**
 * HR's review queue for employee expense claims. It reads the same
 * `s.expenses.claims` the employee portal writes, so a decision here shows up
 * on the employee's own claim immediately — there is no mirrored copy to drift.
 */
export function ExpenseClaimsPage() {
  const { format } = useCurrency();
  const { claims, stages, template, ready, onMyDesk } = useHrExpenseClaims();

  const [tab, setTab] = useState<string | null>(null);
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [query, setQuery] = useState("");

  // Claims never submitted are the employee's private business.
  const visible = useMemo(
    () => claims.filter((c) => c.status !== "draft"),
    [claims],
  );

  const reimbursedRecently = useMemo(
    () => reimbursedWithin(visible, 30),
    [visible],
  );

  const stats = useMemo<HrStatCardItem[]>(() => {
    const sum = (rows: ExpenseClaim[]) => rows.reduce((a, c) => a + c.amount, 0);
    const money = (rows: ExpenseClaim[]) => format(sum(rows), { compact: true });
    const inReview = visible.filter((c) => c.status === "submitted");
    const approved = visible.filter((c) => c.status === "approved");
    const card = (key: CardFilter) => ({
      active: cardFilter === key,
      onClick: () => setCardFilter((prev) => (prev === key ? "all" : key)),
    });

    return [
      {
        icon: BellRing,
        label: "Awaiting You",
        value: onMyDesk.length,
        sub: "Pending your approval",
        tone: "red",
        active: tab === "desk",
        onClick: () => setTab("desk"),
      },
      {
        icon: Clock,
        label: "In Review",
        value: money(inReview),
        sub: `${inReview.length} awaiting a first decision`,
        tone: "amber",
        ...card("submitted"),
      },
      {
        icon: CircleCheck,
        label: "Approved",
        value: money(approved),
        sub: `${approved.length} moving to payment`,
        tone: "blue",
        ...card("approved"),
      },
      {
        icon: Banknote,
        label: "Reimbursed (30d)",
        value: money(reimbursedRecently),
        sub: `${reimbursedRecently.length} paid out`,
        tone: "emerald",
        ...card("reimbursed"),
      },
      {
        icon: Wallet,
        label: "Value In Progress",
        value: money(visible.filter((c) => isClaimOpen(c.status))),
        sub: "Not yet paid",
        tone: "violet",
        active: cardFilter === "all",
        onClick: () => setCardFilter("all"),
      },
    ];
  }, [visible, onMyDesk, reimbursedRecently, cardFilter, tab, format]);

  const filtered = useMemo(() => {
    const byCard =
      cardFilter === "all"
        ? visible
        : visible.filter((c) => c.status === cardFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byCard;
    return byCard.filter((c) =>
      [c.title, c.merchant, c.employeeName, c.reference, c.department]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [visible, cardFilter, query]);

  const deskFiltered = useMemo(() => {
    const ids = new Set(onMyDesk.map((c) => c.id));
    return filtered.filter((c) => ids.has(c.id));
  }, [filtered, onMyDesk]);

  // Land on the desk when there's something to decide, otherwise the full list.
  const activeTab = tab ?? (onMyDesk.length > 0 ? "desk" : "all");

  if (!ready) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expense Claims</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review, approve and reimburse the claims your people have filed.
          Decisions follow the{" "}
          {template ? `“${template.name}”` : "default"} approval chain.
        </p>
      </div>

      <HrStatCardsGrid stats={stats} columns={5} />

      <Tabs value={activeTab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            {
              value: "desk",
              label: `Pending My Approval (${deskFiltered.length})`,
            },
            { value: "all", label: `All claims (${filtered.length})` },
            { value: "chain", label: "Approval chain" },
          ]}
        />

        {activeTab !== "chain" && (
          <div className="mt-4">
            <Input
              placeholder="Search by employee, claim, merchant or reference…"
              className="max-w-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        <TabsContent value="desk" className="mt-5">
          <ClaimsTable
            claims={deskFiltered}
            stages={stages}
            emptyMessage="Nothing is waiting on you right now."
          />
        </TabsContent>

        <TabsContent value="all" className="mt-5">
          <ClaimsTable
            claims={filtered}
            stages={stages}
            emptyMessage="No expense claims have been submitted yet."
          />
        </TabsContent>

        <TabsContent value="chain" className="mt-5">
          {/* The generic chain editor — the same one the Submissions hub uses,
              so HR edits expense approvals where they review them. */}
          <ApprovalChainTab documentType="expense_claim" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
