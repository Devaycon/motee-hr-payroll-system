"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Wallet,
  Clock,
  CircleCheck,
  Banknote,
  Paperclip,
  BellRing,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  DataTable,
  sortableHeader,
} from "@/src/components/shared/data-table";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  EMPLOYEE_EXPENSES,
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseClaim,
} from "@/src/data/employee-expenses-demo";
import { ExpenseFormModal } from "./components/expense-form-modal";
import { ClaimProgress } from "./components/claim-progress";
import { SubmissionSuccessDialog } from "./components/submission-success-dialog";
import { InsightsCard } from "./components/insights-card";
import { SmartSearch } from "./components/smart-search";
import { buildInsights } from "./insights";
import { parseExpenseQuery } from "./nl-search";

/** Which KPI card is currently driving the list (client feedback §8.7). */
type CardFilter =
  | "all"
  | "pending"
  | "approved"
  | "reimbursed"
  | "needs_action";

const CARD_FILTER_LABELS: Record<Exclude<CardFilter, "all">, string> = {
  pending: "Pending",
  approved: "Approved",
  reimbursed: "Reimbursed",
  needs_action: "Needs your action",
};

/** Details of the claim just submitted, driving the confirmation dialog. */
interface SubmittedClaim {
  id: string;
  reference: string;
  attachmentCount: number;
}

/** Human-facing claim reference, e.g. EXP-2026-00124. */
function buildReference(dateSubmitted: string, sequence: number): string {
  const year = dateSubmitted.slice(0, 4) || String(new Date().getFullYear());
  return `EXP-${year}-${String(sequence).padStart(5, "0")}`;
}

export function ExpensesPage() {
  const { format, code } = useCurrency();
  const [claims, setClaims] = useState<ExpenseClaim[]>(EMPLOYEE_EXPENSES);
  const [modalOpen, setModalOpen] = useState(false);
  /** Drill-down set by the KPI cards; "all" shows every claim. */
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [submitted, setSubmitted] = useState<SubmittedClaim | null>(null);
  /** §8.8 — natural-language query text. */
  const [query, setQuery] = useState("");
  /** §9.15 — the draft being reopened, if any. */
  const [editingDraft, setEditingDraft] = useState<ExpenseClaim | null>(null);

  /** Merchants already claimed against, offered as autocomplete (§9.4). */
  const knownMerchants = useMemo(
    () => Array.from(new Set(claims.map((c) => c.merchant).filter(Boolean))).sort(),
    [claims],
  );

  /**
   * §8.7 — claims the employee has to do something about: rejected ones, and
   * anything submitted without a receipt (which gets returned for one).
   */
  const needsAction = useMemo(
    () =>
      claims.filter(
        (c) =>
          c.status === "rejected" ||
          (c.status !== "draft" && (c.attachments?.length ?? 0) === 0),
      ),
    [claims],
  );

  const stats = useMemo<HrStatCardItem[]>(() => {
    const sum = (rows: ExpenseClaim[]) =>
      rows.reduce((acc, c) => acc + c.amount, 0);
    const pending = claims.filter(
      (c) => c.status === "submitted" || c.status === "draft",
    );
    const approved = claims.filter((c) => c.status === "approved");
    const reimbursed = claims.filter((c) => c.status === "reimbursed");
    // Totals use the compact form so six-figure sums fit the card (§8.1).
    const money = (rows: ExpenseClaim[]) => format(sum(rows), { compact: true });
    const card = (key: CardFilter) => ({
      active: cardFilter === key,
      onClick: () => setCardFilter((prev) => (prev === key ? "all" : key)),
    });
    return [
      {
        icon: Wallet,
        label: "Total Claimed",
        value: money(claims),
        sub: `${claims.length} claims`,
        tone: "violet",
        active: cardFilter === "all",
        onClick: () => setCardFilter("all"),
      },
      {
        icon: Clock,
        label: "Pending",
        value: money(pending),
        sub: `${pending.length} awaiting review`,
        tone: "amber",
        ...card("pending"),
      },
      {
        icon: CircleCheck,
        label: "Approved",
        value: money(approved),
        sub: `${approved.length} approved`,
        tone: "emerald",
        ...card("approved"),
      },
      {
        icon: Banknote,
        label: "Reimbursed",
        value: money(reimbursed),
        sub: `${reimbursed.length} paid out`,
        tone: "blue",
        ...card("reimbursed"),
      },
      {
        icon: BellRing,
        label: "Needs Your Action",
        value: needsAction.length,
        sub: "Rejected or missing a receipt",
        tone: "red",
        ...card("needs_action"),
      },
    ];
  }, [claims, format, cardFilter, needsAction]);

  /** §8.5 — derived from the same claims the table shows. */
  const insights = useMemo(
    () => buildInsights(claims, (n) => format(n, { decimals: true })),
    [claims, format],
  );

  /** §8.8 — the query, interpreted. */
  const parsedQuery = useMemo(
    () => parseExpenseQuery(query, knownMerchants),
    [query, knownMerchants],
  );

  const visibleClaims = useMemo(() => {
    const byCard = (() => {
      switch (cardFilter) {
        case "pending":
          return claims.filter(
            (c) => c.status === "submitted" || c.status === "draft",
          );
        case "approved":
          return claims.filter((c) => c.status === "approved");
        case "reimbursed":
          return claims.filter((c) => c.status === "reimbursed");
        case "needs_action":
          return needsAction;
        default:
          return claims;
      }
    })();
    // The card drill-down and the search compose — searching inside "Pending"
    // should stay inside Pending.
    if (!query.trim()) return byCard;
    return byCard.filter(parsedQuery.test);
  }, [claims, cardFilter, needsAction, query, parsedQuery]);

  const columns = useMemo<ColumnDef<ExpenseClaim>[]>(
    () => [
      {
        accessorKey: "title",
        header: sortableHeader("Expense"),
        cell: ({ row }) => (
          <div>
            <span className="text-sm font-medium text-foreground">
              {row.original.title}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {/* §9.15 — drafts are only useful if it's obvious you can pick
                  one back up, so say so rather than relying on a row click. */}
              {row.original.status === "draft"
                ? `${row.original.merchant || "No merchant yet"} · Click to continue`
                : row.original.merchant}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: sortableHeader("Category"),
        cell: ({ row }) => {
          const Icon = EXPENSE_CATEGORY_ICONS[row.original.category];
          return (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {EXPENSE_CATEGORY_LABELS[row.original.category]}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: sortableHeader("Amount"),
        cell: ({ row }) => {
          const { currency, amount } = row.original;
          // Show the original currency code when it differs from the tenant
          // default. Claims are entered to the penny, so keep the decimals (§8.1).
          const showCode = currency && currency !== code;
          return (
            <span className="text-sm font-medium text-foreground">
              {showCode
                ? `${currency} ${amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : format(amount, { decimals: true })}
            </span>
          );
        },
      },
      {
        accessorKey: "dateSubmitted",
        header: sortableHeader("Date"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.dateSubmitted)}
          </span>
        ),
      },
      {
        id: "attachments",
        header: "Receipt",
        cell: ({ row }) => {
          const files = row.original.attachments ?? [];
          if (files.length === 0)
            return <span className="text-xs text-muted-foreground">—</span>;
          // Straight to the file for a single receipt; a count when there are
          // several, since the row has no room to list them.
          return (
            <a
              href={files[0].dataUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              title={files.map((f) => f.name).join(", ")}
            >
              <Paperclip className="h-3 w-3" />
              {files.length === 1 ? "View" : `${files.length} files`}
            </a>
          );
        },
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => <ClaimProgress status={row.original.status} />,
      },
    ],
    [format, code],
  );

  function handleSave(claim: Omit<ExpenseClaim, "id">) {
    // §9.15 — reopening a draft replaces it rather than filing a second copy.
    const id = editingDraft?.id ?? `exp-${Date.now()}`;
    setClaims((prev) =>
      editingDraft
        ? prev.map((c) => (c.id === id ? { ...claim, id } : c))
        : [{ ...claim, id }, ...prev],
    );
    setModalOpen(false);
    setEditingDraft(null);

    // A draft isn't a submission, so it gets a quiet confirmation rather than
    // the §9.17 "what happens next" dialog.
    if (claim.status === "draft") {
      toast.success("Draft saved", {
        description: "Reopen it from the list when you're ready to submit.",
      });
      return;
    }

    // §9.17 — a dialog with the reference and next steps replaces the toast.
    setSubmitted({
      id,
      reference: buildReference(claim.dateSubmitted, claims.length + 1),
      attachmentCount: claim.attachments?.length ?? 0,
    });
  }

  /** §9.15 — pick a draft back up where it was left. */
  function handleOpenDraft(claim: ExpenseClaim) {
    setEditingDraft(claim);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingDraft(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Submit and track your expense claims and reimbursements.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Expense Claim
        </Button>
      </div>

      <HrStatCardsGrid stats={stats} columns={5} />

      {/* §8.5 — what the numbers above actually mean. */}
      <InsightsCard insights={insights} />

      {/* §8.8 — natural-language query over the claim list. */}
      <SmartSearch
        value={query}
        onChange={setQuery}
        parsed={parsedQuery}
        resultCount={visibleClaims.length}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({visibleClaims.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All claims
          </Button>
        </div>
      )}

      <DataTable
        exportTitle="My Expense Claims"
        columns={columns}
        data={visibleClaims}
        getRowId={(c) => c.id}
        // The §8.8 smart search above replaces the table's plain substring box.
        enableGlobalFilter={false}
        onRowClick={(c) => c.status === "draft" && handleOpenDraft(c)}
        emptyMessage={
          query.trim()
            ? "No claims match that search."
            : "No expense claims yet."
        }
      />

      <ExpenseFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        knownMerchants={knownMerchants}
        existingClaims={claims}
        editingClaim={editingDraft}
      />

      <SubmissionSuccessDialog
        open={Boolean(submitted)}
        reference={submitted?.reference ?? ""}
        attachmentCount={submitted?.attachmentCount ?? 0}
        onClose={() => setSubmitted(null)}
        onSubmitAnother={() => {
          setSubmitted(null);
          setModalOpen(true);
        }}
        onViewClaim={() => {
          // No per-claim page yet, so surface the new row where it landed.
          setSubmitted(null);
          setCardFilter("pending");
        }}
      />
    </div>
  );
}
