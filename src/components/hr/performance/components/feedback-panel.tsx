"use client";

import { MessageSquare } from "lucide-react";
import { isServerId, useIsLive } from "@/src/lib/live/use-is-live";
import { formatDate } from "@/src/lib/utils/format-date";
import { useGetFeedbackQuery } from "@/src/store/services/performance";

const TYPE_LABEL: Record<string, string> = {
  peer: "Peer",
  upward: "From a report",
  downward: "From a manager",
  manager: "Manager",
};

/**
 * Signed in: the feedback colleagues have given this employee
 * (GET /performance/feedback?AboutEmployeeId=…), for the reviewer.
 */
export function FeedbackAboutPanel({ employeeId }: { employeeId?: string }) {
  const live = useIsLive() && !!employeeId && isServerId(employeeId);
  const q = useGetFeedbackQuery({ AboutEmployeeId: employeeId, PageSize: 20 }, { skip: !live });
  if (!live) return null;
  const items = q.data?.data.items ?? [];
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <MessageSquare className="h-3 w-3" /> Feedback received ({items.length})
      </p>
      {q.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No feedback on record.</p>
      ) : (
        items.map((f) => (
          <div key={f.id} className="rounded-md bg-muted/40 px-2.5 py-2">
            <p className="text-xs">{f.message}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {f.fromName} · {TYPE_LABEL[f.type] ?? f.type} · {formatDate(f.createdAt)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
