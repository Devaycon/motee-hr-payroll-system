"use client";

import { useState } from "react";
import { Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import { approvalDelegationSchema } from "@/src/lib/validations/approvals";
import {
  useCreateApprovalDelegationMutation,
  useDeleteApprovalDelegationMutation,
  useGetApprovalDelegationsQuery,
  useGetMyApprovalDelegationsQuery,
} from "@/src/store/services/approval-delegations";
import type { ApprovalDelegationDto } from "@/src/types/approval-delegations";

function DelegationList({
  title,
  empty,
  delegations,
  showDelegator,
}: {
  title: string;
  empty: string;
  delegations: ApprovalDelegationDto[];
  showDelegator: boolean;
}) {
  const [deleteDelegation] = useDeleteApprovalDelegationMutation();

  async function handleDelete(id: string) {
    try {
      await deleteDelegation(id).unwrap();
      toast.success("Delegation removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the delegation."));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {delegations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {delegations.map((delegation) => (
              <li
                key={delegation.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    {showDelegator
                      ? `${delegation.delegatorName} → ${delegation.delegateName}`
                      : delegation.delegateName}
                    {delegation.isActive && (
                      <Badge variant="outline" className="text-[10px]">
                        Active now
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(delegation.startDate)} –{" "}
                    {formatDate(delegation.endDate)}
                    {delegation.reason ? ` · ${delegation.reason}` : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Remove delegation"
                  onClick={() => handleDelete(delegation.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Hand your approvals to someone else for a period, e.g. while on leave. */
export function DelegationsTab() {
  const employees = useAppSelector((s) => s.locale.data?.employees) ?? [];
  const myEmployeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const { data: mine } = useGetMyApprovalDelegationsQuery();
  // Listing everyone's delegations needs an admin permission; without it the
  // section is simply left out.
  const { data: everyone, isError: cannotSeeAll } =
    useGetApprovalDelegationsQuery();
  const [createDelegation, { isLoading: saving }] =
    useCreateApprovalDelegationMutation();

  const [delegateEmployeeId, setDelegate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleCreate() {
    const parsed = approvalDelegationSchema.safeParse({
      delegateEmployeeId,
      startDate,
      endDate,
      reason: reason || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await createDelegation(parsed.data).unwrap();
      toast.success("Delegation set");
      setDelegate("");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not set the delegation."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Delegate my approvals
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Cover</Label>
              <Select value={delegateEmployeeId} onValueChange={setDelegate}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Choose a colleague" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.id !== myEmployeeId)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-sm">
                        {e.fullName}
                        {e.jobTitle ? ` · ${e.jobTitle}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="text-xs">Reason (optional)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual leave"
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={saving}
              onClick={handleCreate}
            >
              Set delegation
            </Button>
          </div>
        </CardContent>
      </Card>

      <DelegationList
        title="My delegations"
        empty="You have not delegated your approvals."
        delegations={mine?.data ?? []}
        showDelegator={false}
      />

      {!cannotSeeAll && (
        <DelegationList
          title="All delegations"
          empty="Nobody has a delegation in place."
          delegations={everyone?.data ?? []}
          showDelegator
        />
      )}
    </div>
  );
}
