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
import { useAppSelector } from "@/src/lib/stores/hooks";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useAssignAccessLevelMutation,
  useUnassignAccessLevelMutation,
} from "@/src/store/services/access-levels";
import { useForgotPasswordMutation } from "@/src/store/services/auth";
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

export function UsersPage() {
  const { accounts, loading } = useUserAccounts();
  const [assignAccessLevel] = useAssignAccessLevelMutation();
  const [unassignAccessLevel] = useUnassignAccessLevelMutation();
  const [forgotPassword] = useForgotPasswordMutation();
  const levels = useAppSelector((s) => s.accessLevels.levels);

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

  /** Sends the account holder the same reset code "Forgot password" does. */
  async function handleReset(account: UserAccount) {
    try {
      await forgotPassword({ email: account.email }).unwrap();
      toast.success(`Password reset sent to ${account.email}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send the password reset."));
    }
  }

  /** Roles are held per access level, so a change is a set of grants and
   *  removals against the levels that differ. */
  async function handleAssignRoles(ids: string[]) {
    if (!assigning) return;
    const before = new Set(assigning.accessLevelIds);
    const after = new Set(ids);
    try {
      for (const id of ids) {
        if (!before.has(id)) {
          await assignAccessLevel({
            id,
            body: { userId: assigning.id },
          }).unwrap();
        }
      }
      for (const id of assigning.accessLevelIds) {
        if (!after.has(id)) {
          await unassignAccessLevel({ id, userId: assigning.id }).unwrap();
        }
      }
      toast.success(`Roles updated for ${assigning.name}`);
      setAssigning(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update the roles."));
    }
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
      {
        // §13.1 (Correction 2 feedback) — sign-in activity, distinct from
        // "Last change" above (which tracks account-state edits, not logins).
        id: "lastLoginAt",
        header: "Last Login",
        cell: ({ row }) =>
          row.original.lastLoginAt ? (
            <span className="text-[11px] text-muted-foreground">
              {formatDateTime(row.original.lastLoginAt)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Never</span>
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
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [levelNameById],
  );

  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

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

      <AssignRolesModal
        account={assigning}
        onClose={() => setAssigning(null)}
        onSave={handleAssignRoles}
      />
    </div>
  );
}
