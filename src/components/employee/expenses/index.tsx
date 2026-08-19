"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { addClaim, updateClaim } from "@/src/lib/stores/expenses-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import {
  useExpenseStages,
  useExpenseTemplate,
} from "@/src/lib/expenses/use-expense-stages";
import { useExpenseAttribution } from "@/src/lib/expenses/use-expense-attribution";
import { resolveDeskFrom } from "@/src/lib/expenses/desk";
import { statusForStageIndex } from "@/src/lib/expenses/stages";
import {
  buildExpenseReference,
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  newExpenseClaimId,
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

export function ExpensesPage() {
  const { format, code } = useCurrency();
  const router = useRouter();
  const dispatch = useAppDispatch();
  // Claims live in the store rather than local state so a claim survives the
  // trip to its detail page (and a refresh, and a deep link).
  const allClaims = useAppSelector((s) => s.expenses.claims);
  const user = useAppSelector((s) => s.auth.user);
  const bundle = useAppSelector((s) => s.locale.data);
  const actor = user?.name ?? "You";
  const stages = useExpenseStages();
  const template = useExpenseTemplate();
  useExpenseAttribution();

  // The store holds every employee's claims now that HR reviews them here —
  // this page is "mine". Claims filed before attribution have no owner yet, so
  // they stay visible rather than vanishing mid-migration.
  const claims = useMemo(
    () =>
      allClaims.filter(
        (c) => !c.employeeId || c.employeeId === user?.employeeId,
      ),
    [allClaims, user?.employeeId],
  );

  const [modalOpen, setModalOpen] = useState(false);
  /** Drill-down set by the KPI cards; "all" shows every claim. */
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");
  const [submitted, setSubmitted] = useState<SubmittedClaim | null>(null);
  /** §8.8 — natural-language query text. */
  const [query, setQuery] = useState("");
  /** §9.15 — the draft being reopened, if any. */
  const [editingDraft, setEditingDraft] = useState<ExpenseClaim | null>(null);

  // `?draft=` reopens a specific draft in the form — the detail page's
  // "Continue editing" hands the claim back to the modal that owns it.
  const draftParam = useSearchParams().get("draft");
  const [openedParam, setOpenedParam] = useState<string | null>(null);
  if (draftParam && draftParam !== openedParam && claims.length) {
    const match = claims.find((c) => c.id === draftParam);
    setOpenedParam(draftParam);
    if (match) {
      setEditingDraft(match);
      setModalOpen(true);
    }
  }

  /** Merchants already claimed against, offered as autocomplete (§9.4). */
  const knownMerchants = useMemo(
    () => Array.from(new Set(claims.map((c) => c.merchant).filter(Boolean))).sort(),
    [claims],
  );

  /**
   * §8.7 — claims the employee has to do something about: rejected ones, ones
   * an approver sent back, and anything submitted without a receipt (which
   * gets returned for one).
   */
  const needsAction = useMemo(
    () =>
      claims.filter(
        (c) =>
          c.status === "rejected" ||
          (c.status === "draft" && c.returned) ||
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
        sub: "Rejected, returned or missing a receipt",
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
                ? `${row.original.merchant || "No merchant yet"} · ${
                    row.original.returned
                      ? "Returned — open to fix"
                      : "Open to continue"
                  }`
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
        cell: ({ row }) => <ClaimProgress claim={row.original} stages={stages} />,
      },
    ],
    [format, code, stages],
  );

  function handleSave(claim: Omit<ExpenseClaim, "id">) {
    // §9.15 — reopening a draft replaces it rather than filing a second copy.
    const id = editingDraft?.id ?? newExpenseClaimId();
    // A reference is only issued on submission — a draft has nothing to quote
    // yet — and once issued it stays with the claim. References are drawn from
    // every claim, not just this employee's, so they stay unique.
    const reference =
      claim.status === "draft"
        ? editingDraft?.reference
        : (editingDraft?.reference ??
          buildExpenseReference(allClaims, claim.dateSubmitted));

    // Who filed it, so HR can attribute the claim and the chain can resolve a
    // line manager from it.
    const identity = {
      employeeId: user?.employeeId,
      employeeName: user?.name,
      employeeInitials: user?.initials,
      department: user?.departmentName,
    };

    // Submitting hands the claim to the first stage of the active chain.
    const submitting = claim.status !== "draft";
    const desk =
      submitting && user
        ? resolveDeskFrom(
            0,
            stages,
            template?.steps ?? [],
            {
              employeeId: user.employeeId,
              name: user.name,
              initials: user.initials,
              departmentName: user.departmentName,
            },
            bundle,
          )
        : null;

    const chainFields = submitting
      ? {
          chainTemplateId: template?.id,
          stageIndex: desk?.stageIndex ?? 0,
          currentApproverEmployeeId: desk?.approverEmployeeId ?? null,
          currentApproverName: desk?.approverName ?? null,
          reviewer: desk?.approverName ?? stages[0]?.approverLabel,
          // The resolver can walk past stages nobody can action, so the status
          // follows the stage actually landed on rather than assuming stage 0.
          status: desk
            ? statusForStageIndex(desk.stageIndex, stages.length)
            : claim.status,
        }
      : { stageIndex: -1 };

    if (editingDraft) {
      dispatch(
        updateClaim({
          id,
          changes: { ...claim, ...identity, ...chainFields, reference },
          actor,
          stageIndex: desk?.stageIndex ?? 0,
          approver: desk
            ? { employeeId: desk.approverEmployeeId, name: desk.approverName }
            : null,
        }),
      );
    } else {
      dispatch(
        addClaim({
          claim: { ...claim, ...identity, ...chainFields, id, reference },
          actor,
        }),
      );
    }

    setModalOpen(false);
    setEditingDraft(null);
    clearDraftParam();

    // A draft isn't a submission, so it gets a quiet confirmation rather than
    // the §9.17 "what happens next" dialog.
    if (claim.status === "draft") {
      toast.success("Draft saved", {
        description: "Reopen it from the list when you're ready to submit.",
      });
      return;
    }

    // The approver's queue is a different screen, so tell them it landed.
    dispatch(
      pushNotification({
        title: "Expense claim submitted",
        description: `${reference ?? claim.title} is with ${
          desk?.approverName ?? stages[0]?.approverLabel ?? "your approver"
        } for review.`,
      }),
    );

    // §9.17 — a dialog with the reference and next steps replaces the toast.
    setSubmitted({
      id,
      reference: reference ?? "",
      attachmentCount: claim.attachments?.length ?? 0,
    });
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingDraft(null);
    clearDraftParam();
  }

  /** Drops `?draft=` once the form is done with it, so a refresh doesn't reopen it. */
  function clearDraftParam() {
    if (draftParam) router.replace("/employee/expenses");
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
        // Every claim opens its own page — the six columns here can't carry the
        // receipt, the notes or the audit trail.
        onRowClick={(c) => router.push(`/employee/expenses/${c.id}`)}
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
          const id = submitted?.id;
          setSubmitted(null);
          if (id) router.push(`/employee/expenses/${id}`);
        }}
      />
    </div>
  );
}
