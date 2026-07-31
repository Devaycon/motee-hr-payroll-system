"use client";

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
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import { isActionEnabled, type EmployeeAction } from "../actions";
import type { EmployeeRow } from "../types";

export interface EmployeeRowHandlers {
  onView: (employee: EmployeeRow) => void;
  onEdit: (employee: EmployeeRow) => void;
  onSendCredentials: (employee: EmployeeRow) => void;
  onSendKudos: (employee: EmployeeRow) => void;
  onDeactivate: (employee: EmployeeRow) => void;
  onReactivate: (employee: EmployeeRow) => void;
  onExit: (employee: EmployeeRow) => void;
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

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-xs gap-2 cursor-pointer"
          disabled={!can("credentials")}
          onClick={() => onSendCredentials(employee)}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Send Login Credentials
        </DropdownMenuItem>
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
                <span className="font-semibold text-foreground">
                  {employee.name}
                </span>{" "}
                will be moved to the Inactive tab and will no longer be able to
                sign in. You can reactivate them at any time.
              </>
            }
            confirmLabel="Deactivate"
            onConfirm={() => onDeactivate(employee)}
          />
        )}

        <ConfirmItem
          disabled={!can("exit")}
          icon={<DoorOpen className="w-3.5 h-3.5" />}
          label="Exit Employee"
          title="Initiate Offboarding"
          description={
            <>
              This starts the offboarding process for{" "}
              <span className="font-semibold text-foreground">
                {employee.name}
              </span>
              . They move to the Offboarding Notice tab and a pending record is
              created on the Offboarding pipeline for approval.
            </>
          }
          confirmLabel="Initiate Offboarding"
          onConfirm={() => onExit(employee)}
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
