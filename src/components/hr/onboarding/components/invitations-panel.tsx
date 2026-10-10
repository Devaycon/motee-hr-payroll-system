"use client";

import { Download, MailX, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  useDownloadEmployeeImportTemplateMutation,
  useGetEmployeeImportColumnsQuery,
  useGetEmployeeInvitationsQuery,
  useResendEmployeeInvitationMutation,
  useRevokeEmployeeInvitationMutation,
} from "@/src/store/services/employees";

/** Invitations that have gone out and not been taken up yet. */
export function PendingInvitations() {
  const { data } = useGetEmployeeInvitationsQuery();
  const [resend] = useResendEmployeeInvitationMutation();
  const [revoke] = useRevokeEmployeeInvitationMutation();
  const invitations = data?.data ?? [];

  if (invitations.length === 0) return null;

  async function handleResend(employeeId: string, name: string) {
    try {
      await resend(employeeId).unwrap();
      toast.success(`Invitation resent to ${name}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not resend the invitation."));
    }
  }

  async function handleRevoke(employeeId: string, name: string) {
    try {
      await revoke(employeeId).unwrap();
      toast.success(`Invitation to ${name} withdrawn`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not withdraw the invitation."));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <h3 className="text-sm font-semibold text-foreground">
          Pending invitations ({invitations.length})
        </h3>
        <ul className="divide-y divide-border rounded-md border border-border">
          {invitations.map((invitation) => (
            <li
              key={invitation.employeeId}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  {invitation.name}
                  {invitation.expired && (
                    <Badge
                      variant="outline"
                      className="border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-600 dark:text-rose-400"
                    >
                      Expired
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {invitation.email} · sent {formatDate(invitation.sentAt)} ·
                  expires {formatDate(invitation.expiresAt)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() =>
                    handleResend(invitation.employeeId, invitation.name)
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resend
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground"
                  onClick={() =>
                    handleRevoke(invitation.employeeId, invitation.name)
                  }
                >
                  <MailX className="h-3.5 w-3.5" />
                  Withdraw
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** The spreadsheet the bulk import accepts, and what each column means. */
export function ImportTemplateCard() {
  const { data } = useGetEmployeeImportColumnsQuery();
  const [downloadTemplate, { isLoading }] =
    useDownloadEmployeeImportTemplateMutation();
  const columns = data?.data ?? [];

  async function handleDownload() {
    try {
      await downloadTemplate().unwrap();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not download the template."));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Bulk import template
          </h3>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={isLoading}
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download template
          </Button>
        </div>
        {columns.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Required columns:{" "}
            <span className="text-foreground">
              {columns
                .filter((c) => c.required)
                .map((c) => c.key)
                .join(", ")}
            </span>
            . Optional:{" "}
            {columns
              .filter((c) => !c.required)
              .map((c) => c.key)
              .join(", ")}
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
