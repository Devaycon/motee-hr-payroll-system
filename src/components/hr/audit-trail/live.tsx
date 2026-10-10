"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScrollText, Search, X } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { formatDateTime } from "@/src/lib/utils/format-date";
import {
  useGetAuditTrailCatalogueQuery,
  useGetAuditTrailQuery,
} from "@/src/store/services/audit-trail";
import type { AuditAction, AuditEntryDto } from "@/src/types/audit-trail";

const PAGE_SIZE = 25;
const ALL = "all";

const ACTION_STYLES: Partial<Record<AuditAction, string>> = {
  create:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  update: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  delete: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  reject: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  approve:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/** Waits for typing to pause so each keystroke is not its own request. */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function EntryRow({ entry }: { entry: AuditEntryDto }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <button
        type="button"
        className="flex flex-wrap items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-foreground">{entry.description}</span>
          <span className="text-xs text-muted-foreground">
            {entry.actorName ?? "System"} · {entry.module} ·{" "}
            {formatDateTime(entry.createdAt)}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] capitalize", ACTION_STYLES[entry.action])}
        >
          {entry.action}
        </Badge>
      </button>
      {open && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 rounded-md bg-muted/40 p-3 text-xs sm:grid-cols-2">
          {[
            ["Record", entry.entityType],
            ["Record id", entry.entityId],
            ["Request", [entry.httpMethod, entry.endpoint].filter(Boolean).join(" ")],
            ["Result", entry.httpStatus?.toString()],
            ["Took", entry.durationMs != null ? `${entry.durationMs} ms` : null],
            ["IP address", entry.ipAddress],
            ["Correlation id", entry.correlationId],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label as string} className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">{label}</dt>
                <dd className="break-all text-foreground">{value}</dd>
              </div>
            ))}
          {entry.changes && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <dt className="text-muted-foreground">Changes</dt>
              <dd className="whitespace-pre-wrap break-all text-foreground">
                {entry.changes}
              </dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}

/** Who did what, when — filtered and paged by the server. */
export function LiveAuditTrailPage() {
  const searchParams = useSearchParams();
  // Deep link from a record's "activity log" action.
  const entityId = searchParams.get("entityId") ?? undefined;

  const [search, setSearch] = useState("");
  const [action, setAction] = useState(ALL);
  const [moduleFilter, setModuleFilter] = useState(ALL);
  const [statusClass, setStatusClass] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search);

  const { data: catalogue } = useGetAuditTrailCatalogueQuery();
  const { data, isLoading, isFetching } = useGetAuditTrailQuery({
    Search: debouncedSearch || undefined,
    Action: action === ALL ? undefined : (action as AuditAction),
    Module: moduleFilter === ALL ? undefined : moduleFilter,
    StatusClass: statusClass === ALL ? undefined : statusClass,
    From: from || undefined,
    To: to || undefined,
    EntityId: entityId,
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const result = data?.data;

  /** Any filter change starts again from the first page. */
  const filter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const options = (values: string[] | undefined, allLabel: string) => (
    <>
      <SelectItem value={ALL} className="text-sm">
        {allLabel}
      </SelectItem>
      {(values ?? []).map((value) => (
        <SelectItem key={value} value={value} className="text-sm capitalize">
          {value}
        </SelectItem>
      ))}
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Audit Trail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A record of every change made in your organisation.
        </p>
      </div>

      {entityId && (
        <div className="flex items-center gap-2 text-sm text-foreground">
          Showing activity for one record.
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
            <a href="/admin/audit-trail">
              <X className="h-3 w-3" />
              Show everything
            </a>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => filter(setSearch)(e.target.value)}
            placeholder="Search the audit trail"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={action} onValueChange={filter(setAction)}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options(catalogue?.data?.actions, "All actions")}
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={filter(setModuleFilter)}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options(catalogue?.data?.modules, "All modules")}
          </SelectContent>
        </Select>
        <Select value={statusClass} onValueChange={filter(setStatusClass)}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options(catalogue?.data?.statusClasses, "All results")}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={from}
          onChange={(e) => filter(setFrom)(e.target.value)}
          className="h-8 w-40 text-sm"
          aria-label="From date"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => filter(setTo)(e.target.value)}
          className="h-8 w-40 text-sm"
          aria-label="To date"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !result?.items.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <ScrollText className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No activity matches these filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {result.items.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </ul>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {result.totalItems} entries · page {result.page}
              {result.totalPages ? ` of ${result.totalPages}` : ""}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={!result.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
