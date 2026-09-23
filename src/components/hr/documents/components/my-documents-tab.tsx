"use client";

import { Inbox, Check, X, FileText } from "lucide-react";
import { formatDate } from "@/src/lib/utils/format-date";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  reviewSelfServiceDocument,
  dequeueSelfServiceDocument,
  type SelfServiceDocumentSubmission,
} from "@/src/lib/stores/my-documents-slice";

/**
 * §8.3 (Correction 2 feedback) — "My Documents — self-service area."
 * Employees upload their own documents on the employee-side "My Documents"
 * page; this is where HR reviews/approves those uploads, closing the loop
 * the client asked for ("routed to HR for review/approval").
 */
interface MyDocumentsTabProps {
  /** Files the approved submission into the employee's folder. */
  onApprove: (submission: SelfServiceDocumentSubmission) => void;
}

const DOC_TYPE_CATEGORY_HINT: Record<string, string> = {
  Passport: "Identity",
  "Right to Work": "Right to Work",
  "Proof of Address": "Identity",
  "Driving Licence": "Identity",
  Certificate: "Qualification",
};

export function MyDocumentsTab({ onApprove }: MyDocumentsTabProps) {
  const dispatch = useAppDispatch();
  const submissions = useAppSelector((s) => s.myDocuments.submissions);

  const pending = submissions.filter((s) => s.status === "awaiting_review");
  const decided = submissions.filter((s) => s.status !== "awaiting_review");

  function handleApprove(s: SelfServiceDocumentSubmission) {
    onApprove(s);
    dispatch(reviewSelfServiceDocument({ id: s.id, status: "approved" }));
    dispatch(dequeueSelfServiceDocument(s.id));
  }

  function handleReject(s: SelfServiceDocumentSubmission) {
    dispatch(reviewSelfServiceDocument({ id: s.id, status: "rejected" }));
    dispatch(dequeueSelfServiceDocument(s.id));
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-20 text-center">
        <Inbox className="size-8 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No self-service uploads waiting</p>
          <p className="text-xs text-muted-foreground">
            Documents employees upload from their own &quot;My Documents&quot; page appear here for review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Awaiting review</p>
            <Badge variant="secondary">{pending.length}</Badge>
          </div>
          {pending.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Nothing waiting on you right now.
            </p>
          ) : (
            pending.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PersonAvatar name={s.employeeName} initials={s.employeeInitials} className="size-8" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{s.employeeName}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="size-3" />
                      {s.name}
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {DOC_TYPE_CATEGORY_HINT[s.docType] ?? s.docType}
                      </Badge>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Submitted {formatDate(s.submittedAt)}
                      {s.expiryDate && ` · Expires ${formatDate(s.expiryDate)}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleReject(s)}
                  >
                    <X className="size-3.5" /> Reject
                  </Button>
                  <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleApprove(s)}>
                    <Check className="size-3.5" /> Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {decided.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Recently decided</p>
            </div>
            {decided.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <PersonAvatar name={s.employeeName} initials={s.employeeInitials} className="size-7" />
                  <p className="truncate text-xs text-foreground">
                    {s.employeeName} · {s.name}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    s.status === "approved"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-600"
                      : "border-red-500/20 bg-red-500/10 text-[10px] text-red-600"
                  }
                >
                  {s.status === "approved" ? "Approved" : "Rejected"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
