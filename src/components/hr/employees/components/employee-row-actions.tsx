"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  KeyRound,
  Award,
  UserMinus,
  UserCheck,
  DoorOpen,
  Trash2,
  RotateCcw,
  Send,
  ScrollText,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { EXIT_REASON_LABELS } from "@/src/data/offboarding-demo";
import type { ExitReason } from "@/src/lib/types/offboarding";
import { isActionEnabled, type EmployeeAction } from "../actions";
import type { EmployeeRow } from "../types";

export interface ExitDetails {
  exitReason: ExitReason;
  lastWorkingDate: string;
}

export interface EmployeeRowHandlers {
  onView: (employee: EmployeeRow) => void;
  onEdit: (employee: EmployeeRow) => void;
  onSendCredentials: (employee: EmployeeRow) => void;
  onResendInvite: (employee: EmployeeRow) => void;
  onViewActivityLog: (employee: EmployeeRow) => void;
  onSendKudos: (employee: EmployeeRow) => void;
  onDeactivate: (employee: EmployeeRow) => void;
  onReactivate: (employee: EmployeeRow) => void;
  onExit: (employee: EmployeeRow, details: ExitDetails) => void;
  onDelete: (employee: EmployeeRow) => void;
  onRestore: (employee: EmployeeRow) => void;
}

interface EmployeeRowActionsProps extends EmployeeRowHandlers {
  employee: EmployeeRow;
}

/**
 * Row action menu for the Employees table (client feedback §1.2).
 *
 * Every action is always rendered; which ones are clickable comes from the
 * status matrix in `../actions.ts` so the rules live in one place.
 */
export function EmployeeRowActions({
  employee,
  onView,
  onEdit,
  onSendCredentials,
  onResendInvite,
  onViewActivityLog,
  onSendKudos,
  onDeactivate,
  onReactivate,
  onExit,
  onDelete,
  onRestore,
}: EmployeeRowActionsProps) {
  const can = (action: EmployeeAction) =>
    isActionEnabled(action, employee.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          disabled={!can("view")}
          onClick={() => onView(employee)}
        >
          <Eye className="w-3.5 h-3.5" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          disabled={!can("edit")}
          onClick={() => onEdit(employee)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Employee
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          disabled={!can("credentials")}
          onClick={() => onSendCredentials(employee)}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Send/Resend Login Credentials
        </DropdownMenuItem>
        {/* §3.1 — only live while onboarding is still in flight. */}
        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          disabled={!can("resend_invite")}
          onClick={() => onResendInvite(employee)}
        >
          <Send className="w-3.5 h-3.5" />
          Resend Onboarding Invitation
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          disabled={!can("activity_log")}
          onClick={() => onViewActivityLog(employee)}
        >
          <ScrollText className="w-3.5 h-3.5" />
          View Activity Log
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          disabled={!can("kudos")}
          onClick={() => onSendKudos(employee)}
        >
          <Award className="w-3.5 h-3.5" />
          Send Kudos
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {can("reactivate") ? (
          <DropdownMenuItem
            className="text-xs gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 dark:text-emerald-400"
            onClick={() => onReactivate(employee)}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Reactivate Employee
          </DropdownMenuItem>
        ) : (
          <ConfirmItem
            disabled={!can("deactivate")}
            icon={<UserMinus className="w-3.5 h-3.5" />}
            label="Deactivate Employee"
            title="Deactivate Employee"
            description={
              <>
                This only suspends system access —{" "}
                <span className="font-semibold text-foreground">
                  {employee.name}
                </span>{" "}
                remains employed. They move to the Inactive tab and can no longer
                sign in, and you can reactivate them at any time. To record that
                they are leaving the organisation, use Start Offboarding instead.
              </>
            }
            confirmLabel="Deactivate"
            onConfirm={() => onDeactivate(employee)}
          />
        )}

        <StartOffboardingItem
          disabled={!can("exit")}
          employee={employee}
          onConfirm={(details) => onExit(employee, details)}
        />

        <DropdownMenuSeparator />

        {can("restore") ? (
          <DropdownMenuItem
            className="text-xs gap-2 cursor-pointer"
            onClick={() => onRestore(employee)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Employee
          </DropdownMenuItem>
        ) : (
          <ConfirmItem
            disabled={!can("delete")}
            destructive
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Delete Employee"
            title="Delete Employee"
            description={
              <>
                <span className="font-semibold text-foreground">
                  {employee.name}
                </span>{" "}
                will be moved to the Deleted tab. Their record is kept and can be
                restored from there.
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => onDelete(employee)}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ConfirmItemProps {
  disabled?: boolean;
  destructive?: boolean;
  icon: React.ReactNode;
  label: string;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}

/**
 * A menu item that opens a confirmation dialog. When disabled it renders as a
 * plain greyed item so the action stays visible without being triggerable.
 */
function ConfirmItem({
  disabled,
  destructive,
  icon,
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
}: ConfirmItemProps) {
  const itemClass = destructive
    ? "text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
    : "text-xs gap-2 cursor-pointer";

  if (disabled) {
    return (
      <DropdownMenuItem className="text-xs gap-2" disabled>
        {icon}
        {label}
      </DropdownMenuItem>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className={itemClass}
          onSelect={(e) => e.preventDefault()}
        >
          {icon}
          {label}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface StartOffboardingItemProps {
  disabled?: boolean;
  employee: EmployeeRow;
  onConfirm: (details: ExitDetails) => void;
}

/**
 * "Start Offboarding" needs the real exit reason and last working date up
 * front — an offboarding record silently stamped "resignation, today"
 * regardless of the truth corrupts every exit-reason report downstream, so
 * unlike the other row actions this one is a small form, not a bare confirm.
 */
function StartOffboardingItem({
  disabled,
  employee,
  onConfirm,
}: StartOffboardingItemProps) {
  const [open, setOpen] = useState(false);
  const [exitReason, setExitReason] = useState<ExitReason>("resignation");
  const [lastWorkingDate, setLastWorkingDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  if (disabled) {
    return (
      <DropdownMenuItem className="text-xs gap-2" disabled>
        <DoorOpen className="w-3.5 h-3.5" />
        Start Offboarding
      </DropdownMenuItem>
    );
  }

  function submit() {
    onConfirm({ exitReason, lastWorkingDate });
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setExitReason("resignation");
          setLastWorkingDate(new Date().toISOString().slice(0, 10));
        }
      }}
    >
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          onSelect={(e) => e.preventDefault()}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          Start Offboarding
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Offboarding</DialogTitle>
          <DialogDescription>
            This records that <span className="font-semibold text-foreground">{employee.name}</span>{" "}
            is leaving the organisation and starts the offboarding process. They
            move to the Offboarding Notice tab and a pending record is created
            on the Offboarding pipeline for approval. To suspend access without
            ending employment, use Deactivate Employee instead.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Reason for leaving</Label>
            <Select
              value={exitReason}
              onValueChange={(v) => setExitReason(v as ExitReason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EXIT_REASON_LABELS) as ExitReason[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {EXIT_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Last working date</Label>
            <Input
              type="date"
              value={lastWorkingDate}
              onChange={(e) => setLastWorkingDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Start Offboarding</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
