"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import {
  KeyRound,
  Lock,
  LockOpen,
  MoreHorizontal,
  ShieldCheck,
  ShieldMinus,
  ShieldOff,
  UserCog,
  Users as UsersIcon,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  DataTable,
  actionsColumn,
  sortableHeader,
} from "@/src/components/shared/data-table";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  resetPassword,
  setAccountRoles,
  setAccountState,
} from "@/src/lib/stores/users-slice";
import { setUserAccessLevels } from "@/src/lib/stores/auth-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { addAuditEntry } from "@/src/lib/stores/audit-slice";
import {
  USER_STATE_LABELS,
  USER_STATE_STYLES,
  type UserAccount,
  type UserAccountState,
} from "@/src/lib/types/users";
import { cn } from "@/src/lib/utils";
import { formatDateTime } from "@/src/lib/utils/format-date";
import { useUserAccounts } from "./hooks";
import { AssignRolesModal } from "./components/assign-roles-modal";

/** A state change that needs a reason before it is applied. */
interface PendingChange {
  account: UserAccount;
  next: UserAccountState;
}

const CHANGE_COPY: Record<
  Exclude<UserAccountState, "active">,
  { title: string; description: string; verb: string }
> = {
  locked: {
    title: "Lock this account",
    description:
      "They will not be able to sign in until the account is unlocked. Nothing else about their access changes.",
    verb: "Lock account",
  },
  restricted: {
    title: "Restrict this account",
    description:
      "They can still sign in, but their data access is narrowed to their own record regardless of what their roles grant.",
    verb: "Restrict access",
  },
  revoked: {
    title: "Revoke access",
    description:
      "Access is withdrawn entirely. The account record is kept so the audit trail stays intact, and it can be restored later.",
    verb: "Revoke access",
  },
};

export function UsersPage() {
  const dispatch = useAppDispatch();
  const { accounts, loading } = useUserAccounts();
  const levels = useAppSelector((s) => s.accessLevels.levels);
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "You";
  const currentRoleId = useAppSelector((s) => s.auth.user?.roleId);

  const [pending, setPending] = useState<PendingChange | null>(null);
  const [reason, setReason] = useState("");
  const [assigning, setAssigning] = useState<UserAccount | null>(null);

  const levelNameById = useMemo(
    () => new Map(levels.map((l) => [l.id, l.name])),
    [levels],
  );

  /** Drill-down set by the KPI cards; "all" shows every account. */
  const [stateFilter, setStateFilter] = useState<UserAccountState | "all">(
    "all",
  );

  /** The table rows, narrowed to whichever KPI card is selected. */
  const visibleAccounts = useMemo(
    () =>
      stateFilter === "all"
        ? accounts
        : accounts.filter((a) => a.state === stateFilter),
    [accounts, stateFilter],
  );

  const stats = useMemo<HrStatCardItem[]>(() => {
    const count = (s: UserAccountState) =>
      accounts.filter((a) => a.state === s).length;
    const card = (s: UserAccountState) => ({
      active: stateFilter === s,
      // Re-clicking the selected card clears back to every account.
      onClick: () => setStateFilter(stateFilter === s ? "all" : s),
    });
    return [
      {
        icon: UsersIcon,
        label: "Total Accounts",
        value: accounts.length,
        sub: "Provisioned user accounts",
        tone: "violet",
        active: stateFilter === "all",
        onClick: () => setStateFilter("all"),
      },
      {
        icon: ShieldCheck,
        label: "Active",
        value: count("active"),
        sub: "Can sign in normally",
        tone: "emerald",
        ...card("active"),
      },
      {
        icon: Lock,
        label: "Locked",
        value: count("locked"),
        sub: "Temporarily barred from signing in",
        tone: "amber",
        ...card("locked"),
      },
      {
        icon: ShieldOff,
        label: "Revoked",
        value: count("revoked"),
        sub: "Access withdrawn, record retained",
        tone: "red",
        ...card("revoked"),
      },
    ];
  }, [accounts, stateFilter]);

  /**
   * Apply a state change. Every one writes to the audit trail and notifies the
   * affected person — an account being locked without either is exactly the
   * kind of silent administrative action the audit module exists to prevent.
   */
  function applyChange(account: UserAccount, next: UserAccountState, why?: string) {
    dispatch(
      setAccountState({
        userId: account.id,
        accountState: next,
        reason: why,
        actorName,
      }),
    );
    dispatch(addAuditEntry({
      actorName,
      actionType: next === "active" ? "update" : "delete",
      module: "admin.users",
      description:
        next === "active"
          ? `Restored access for ${account.name}`
          : `${USER_STATE_LABELS[next]} account for ${account.name}${why ? ` — ${why}` : ""}`,
      resourceId: account.id,
    }));
    dispatch(
      pushNotification({
        title:
          next === "active"
            ? "Your account has been restored"
            : `Your account has been ${USER_STATE_LABELS[next].toLowerCase()}`,
        description:
          next === "active"
            ? `${actorName} restored full access to your account.`
            : `${actorName} ${USER_STATE_LABELS[next].toLowerCase()} your account${why ? `: ${why}` : "."}`,
        detail:
          next === "active"
            ? "You can sign in as normal."
            : `${why ?? "No reason was recorded."}\n\nContact your administrator if you believe this is a mistake.`,
        type: next === "active" ? "success" : "warning",
      }),
    );
    toast.success(
      next === "active"
        ? `${account.name}'s access restored`
        : `${account.name}'s account ${USER_STATE_LABELS[next].toLowerCase()}`,
    );
  }

  function handleReset(account: UserAccount) {
    dispatch(resetPassword({ userId: account.id, actorName }));
    dispatch(addAuditEntry({
      actorName,
      actionType: "update",
      module: "admin.users",
      description: `Forced a password reset for ${account.name}`,
      resourceId: account.id,
    }));
    dispatch(
      pushNotification({
        title: "Password reset required",
        description: `${actorName} has reset your password.`,
        detail:
          "Your password has been reset by an administrator. You will be asked to set a new one the next time you sign in.",
        type: "warning",
      }),
    );
    toast.success(`Password reset sent to ${account.email}`);
  }

  function handleAssignRoles(ids: string[]) {
    if (!assigning) return;
    dispatch(
      setAccountRoles({
        userId: assigning.id,
        accessLevelIds: ids,
        actorName,
      }),
    );
    // §1.13 — reassigning your own account must take effect immediately, or
    // the sidebar keeps showing what the old roles allowed.
    if (assigning.id === currentRoleId) {
      dispatch(setUserAccessLevels(ids));
    }
    dispatch(addAuditEntry({
      actorName,
      actionType: "update",
      module: "admin.users",
      description: `Assigned ${ids.length} role(s) to ${assigning.name}: ${ids
        .map((id) => levelNameById.get(id) ?? id)
        .join(", ")}`,
      resourceId: assigning.id,
    }));
    toast.success(`Roles updated for ${assigning.name}`);
    setAssigning(null);
  }

  const columns = useMemo<ColumnDef<UserAccount>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("User"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {row.original.initials}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground">
                {row.original.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "roles",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.accessLevelIds.map((id, i) => (
              <Badge
                key={id}
                variant={i === 0 ? "secondary" : "outline"}
                className="text-[10px]"
              >
                {levelNameById.get(id) ?? id}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "departmentName",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.departmentName}
          </span>
        ),
      },
      {
        id: "state",
        header: "Status",
        accessorFn: (a) => a.state,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <Badge
              variant="outline"
              className={cn("text-[10px]", USER_STATE_STYLES[row.original.state])}
            >
              {USER_STATE_LABELS[row.original.state]}
            </Badge>
            {row.original.reason && (
              <p className="text-[10px] text-muted-foreground">
                {row.original.reason}
              </p>
            )}
            {row.original.mustChangePassword && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                Password reset pending
              </p>
            )}
          </div>
        ),
      },
      {
        id: "changedAt",
        header: "Last change",
        cell: ({ row }) =>
          row.original.changedAt ? (
            <span className="text-[11px] text-muted-foreground">
              {formatDateTime(row.original.changedAt)}
              <br />
              by {row.original.changedBy}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      actionsColumn<UserAccount>((account) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="gap-2"
              onClick={() => setAssigning(account)}
            >
              <UserCog className="h-3.5 w-3.5" />
              Assign roles
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onClick={() => handleReset(account)}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset password
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {account.state === "locked" ? (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => applyChange(account, "active")}
              >
                <LockOpen className="h-3.5 w-3.5" />
                Unlock account
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  setPending({ account, next: "locked" });
                  setReason("");
                }}
              >
                <Lock className="h-3.5 w-3.5" />
                Lock account
              </DropdownMenuItem>
            )}

            {account.state === "restricted" ? (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => applyChange(account, "active")}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Remove restriction
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  setPending({ account, next: "restricted" });
                  setReason("");
                }}
              >
                <ShieldMinus className="h-3.5 w-3.5" />
                Restrict access
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            {account.state === "revoked" ? (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => applyChange(account, "active")}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Restore access
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  setPending({ account, next: "revoked" });
                  setReason("");
                }}
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Revoke access
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [levelNameById, actorName, currentRoleId],
  );

  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const copy = pending && pending.next !== "active" ? CHANGE_COPY[pending.next] : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administer individual accounts — who holds which roles, and who can
          currently sign in. Roles themselves are defined in Roles &amp;
          Permissions.
        </p>
      </div>

      <HrStatCardsGrid stats={stats} columns={4} />

      {stateFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {USER_STATE_LABELS[stateFilter]}{" "}
            <span className="text-muted-foreground">
              ({visibleAccounts.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setStateFilter("all")}
          >
            ← All accounts
          </Button>
        </div>
      )}

      <DataTable
        exportTitle="User Accounts"
        columns={columns}
        data={visibleAccounts}
        getRowId={(a) => a.id}
        searchPlaceholder="Search users…"
        emptyMessage="No user accounts provisioned."
      />

      {/* State changes need a reason — an account locked with no explanation is
          an argument waiting to happen. */}
      <Dialog
        open={Boolean(pending)}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="change-reason" className="text-xs">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="change-reason"
              placeholder="e.g. Left the company, pending IT review"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Recorded in the audit trail and sent to the account holder.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                if (!pending) return;
                applyChange(pending.account, pending.next, reason.trim());
                setPending(null);
              }}
            >
              {copy?.verb}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignRolesModal
        account={assigning}
        onClose={() => setAssigning(null)}
        onSave={handleAssignRoles}
      />
    </div>
  );
}
