"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Pencil,
  Check,
  X,
  Clock,
  ShieldAlert,
  Plus,
  ChevronRight,
  CircleCheck,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  applyEdit,
  requestEdit,
  approveRequest,
  rejectRequest,
  cancelRequest,
} from "@/src/lib/stores/profile-edits-slice";
import {
  getEmployeeProfileFields,
  getFieldString,
  PROFILE_GROUP_LABELS,
  PROFILE_GROUP_ORDER,
  type ProfileField,
  type ProfileFieldGroup,
} from "@/src/lib/profile/fields";
import { formatDate } from "@/src/lib/utils/format-date";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { RowActions } from "@/src/components/hr/employees/employee-detail/row-actions";
import { RecordDetailModal } from "@/src/components/hr/employees/employee-detail/record-detail-modal";
import { optionLabel } from "./record-form";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";

type Mode = "edit" | "request";

/**
 * Bank changes are the highest-risk edit in the system (payroll redirection),
 * so they carry a stricter explanation requirement than other fields —
 * client feedback round 2, §B7.
 */
const BANK_REASON_MIN = 15;
const DEFAULT_REASON_MIN = 3;

/**
 * How a stored value is shown. Raw values are snake_case, so never print one —
 * a field's own `optionLabels` wins, otherwise fall back to the humaniser.
 */
function fieldValueLabel(field: ProfileField, value: string): string {
  if (!value) return value;
  if (field.type !== "select") return value;
  return field.optionLabels?.[value] ?? optionLabel(value);
}

function reasonMinLength(groups: ProfileFieldGroup[]): number {
  return groups.includes("bank") ? BANK_REASON_MIN : DEFAULT_REASON_MIN;
}

function reasonError(reason: string, groups: ProfileFieldGroup[]): string | null {
  const min = reasonMinLength(groups);
  if (reason.trim().length >= min) return null;
  return groups.includes("bank")
    ? "Bank detail changes need a full explanation — say why the account is changing."
    : "Please give a brief reason for the change.";
}

// ── field edit / request dialog ─────────────────────────────────────────────
function FieldEditDialog({
  open,
  onOpenChange,
  field,
  currentValue,
  mode,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  field: ProfileField | null;
  currentValue: string;
  mode: Mode;
  onSubmit: (value: string, reason: string) => void;
}) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [prevOpen, setPrevOpen] = useState(false);

  // Reset inputs whenever the dialog opens for a new field.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValue(currentValue);
      setReason("");
    }
  }

  if (!field) return null;

  const handleSubmit = () => {
    if (value.trim() === "" && field.type !== "text") {
      toast.error("Please enter a value.");
      return;
    }
    if (mode === "request") {
      const err = reasonError(reason, [field.group]);
      if (err) {
        toast.error(err);
        return;
      }
    }
    onSubmit(value, reason.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "edit" ? "Edit" : "Request change"} — {field.label}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {mode === "request" && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Current value</Label>
              <p className="text-sm text-foreground rounded-md bg-muted/50 px-3 py-2">
                {currentValue || "—"}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {mode === "edit" ? "New value" : "Requested value"}
            </Label>
            {field.type === "select" && field.options ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((o) => (
                    <SelectItem key={o} value={o} className="text-sm">
                      {optionLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-9 text-sm"
              />
            )}
          </div>
          {mode === "request" && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  field.group === "bank"
                    ? "Explain why your bank account is changing — this is checked before payroll is redirected."
                    : "Why does this need to change?"
                }
                className="text-sm"
              />
              {field.group === "bank" && (
                <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0" />
                  Bank changes are verified by HR before payroll is updated.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "edit" ? "Save" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── bulk edit modal (all fields in a section at once) ───────────────────────
function BulkFieldsEditModal({
  open,
  onOpenChange,
  title,
  employee,
  employeeId,
  mode,
  groups,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  employee: LocaleEmployee;
  employeeId: string;
  mode: Mode;
  groups?: ProfileFieldGroup[];
}) {
  const dispatch = useAppDispatch();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const allFields = getEmployeeProfileFields(employee);
  const fields = groups ? allFields.filter((f) => groups.includes(f.group)) : allFields;

  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [prevOpen, setPrevOpen] = useState(false);

  // Reseed from the employee whenever the modal opens.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const seed: Record<string, string> = {};
      for (const f of fields) seed[f.key] = getFieldString(employee, f.key);
      setValues(seed);
      setReason("");
    }
  }

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    // Only non-system fields whose value actually changed are submitted.
    const changed = fields.filter(
      (f) => !f.system && (values[f.key] ?? "") !== getFieldString(employee, f.key),
    );
    if (changed.length === 0) {
      toast.message("No changes to save.");
      return;
    }
    if (mode === "request") {
      const err = reasonError(
        reason,
        changed.map((f) => f.group),
      );
      if (err) {
        toast.error(err);
        return;
      }
    }
    for (const f of changed) {
      const value = values[f.key] ?? "";
      if (mode === "edit") {
        dispatch(applyEdit({ employeeId, field: f.key, value }));
      } else {
        dispatch(
          requestEdit({
            employeeId,
            field: f.key,
            label: f.label,
            currentValue: getFieldString(employee, f.key),
            requestedValue: value,
            reason: reason.trim(),
            requestedBy: actorName,
          }),
        );
      }
    }
    const n = changed.length;
    toast.success(
      mode === "edit"
        ? `${n} change${n > 1 ? "s" : ""} saved`
        : `${n} change${n > 1 ? "s" : ""} requested`,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Edit {title} Information
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div
              key={f.key}
              className={cn("space-y-1.5", f.type === "textarea" && "sm:col-span-2")}
            >
              <Label className="text-xs flex items-center gap-1.5">
                {f.label}
                {f.system && (
                  <Badge
                    variant="outline"
                    className="text-[9px] gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600"
                    title={`System-driven${f.source ? ` · ${f.source}` : ""} — edit individually to override`}
                  >
                    <ShieldAlert className="w-2.5 h-2.5" /> System
                  </Badge>
                )}
              </Label>
              {f.type === "select" && f.options ? (
                <Select
                  value={values[f.key] ?? ""}
                  onValueChange={(v) => set(f.key, v)}
                  disabled={f.system}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o} value={o} className="text-sm">
                        {optionLabel(o)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  rows={3}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  disabled={f.system}
                  className="text-sm"
                />
              ) : (
                <Input
                  type={
                    f.type === "date"
                      ? "date"
                      : f.type === "email"
                        ? "email"
                        : f.type === "number"
                          ? "number"
                          : f.type === "tel"
                            ? "tel"
                            : "text"
                  }
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  disabled={f.system}
                  className="h-9 text-sm"
                />
              )}
            </div>
          ))}
        </div>
        {mode === "request" && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                groups?.includes("bank")
                  ? "Explain why your bank account is changing — this is checked before payroll is redirected."
                  : "Why do these need to change?"
              }
              className="text-sm"
            />
            {groups?.includes("bank") && (
              <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0" />
                Bank changes are verified by HR before payroll is updated.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === "edit" ? "Save changes" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── request-a-change category picker ───────────────────────────────────────
/**
 * The categories an employee can raise a change against (client feedback
 * round 2, §B2a). Each maps onto existing `ProfileFieldGroup`s so the picker
 * reuses `BulkFieldsEditModal` rather than introducing a parallel form.
 */
const REQUEST_CATEGORIES: {
  key: string;
  label: string;
  description: string;
  groups?: ProfileFieldGroup[];
  photo?: boolean;
}[] = [
  {
    key: "personal",
    label: "Personal Details",
    description: "Name, date of birth, gender, marital status, nationality",
    groups: ["personal"],
  },
  {
    key: "contact",
    label: "Contact Details",
    description: "Email addresses and phone numbers",
    groups: ["contact"],
  },
  {
    key: "address",
    label: "Address",
    description: "Home, work and correspondence addresses",
    groups: ["address"],
  },
  {
    key: "bank",
    label: "Bank Details",
    description: "Account name, number and sort code",
    groups: ["bank"],
  },
  {
    key: "emergency",
    label: "Emergency Contact & Next of Kin",
    description: "Who we contact in an emergency",
    groups: ["emergency"],
  },
  {
    key: "identity",
    label: "National Insurance & Tax Details",
    description: "NI number, tax references and other identifiers",
    groups: ["identity"],
  },
  {
    key: "work",
    label: "Work Pattern",
    description: "Working days, hours and contracted pattern",
    groups: ["work"],
  },
  {
    key: "photo",
    label: "Profile Photo",
    description: "Upload a new picture for your profile",
    photo: true,
  },
];

/**
 * The missing front door for profile change requests. Previously the only way
 * to raise one was a hover-revealed pencil buried inside four tabs, which is
 * why the client reported there was "nowhere to indicate what needs updating".
 */
export function RequestProfileChangeButton({
  employee,
  employeeId,
  mode,
  onPhotoRequest,
  variant = "default",
}: {
  employee: LocaleEmployee;
  employeeId: string;
  mode: Mode;
  /** Opens the photo dialog — owned by the page so it can show the avatar. */
  onPhotoRequest?: () => void;
  variant?: "default" | "outline";
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    (typeof REQUEST_CATEGORIES)[number] | null
  >(null);

  const categories = REQUEST_CATEGORIES.filter((c) => !c.photo || onPhotoRequest);

  return (
    <>
      <Button
        size="sm"
        variant={variant}
        className="h-8 gap-1.5 text-xs"
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="w-3.5 h-3.5" />
        {mode === "edit" ? "Edit Profile Details" : "Request Profile Change"}
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              What would you like to change?
            </DialogTitle>
            <DialogDescription className="text-xs">
              {mode === "request"
                ? "Pick a section, then tell us what needs updating. HR reviews every request before it takes effect."
                : "Pick a section to edit."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  if (c.photo) onPhotoRequest?.();
                  else setActiveCategory(c);
                }}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.description}</span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {activeCategory?.groups && (
        <BulkFieldsEditModal
          open
          onOpenChange={(o) => !o && setActiveCategory(null)}
          title={activeCategory.label}
          employee={employee}
          employeeId={employeeId}
          mode={mode}
          groups={activeCategory.groups}
        />
      )}
    </>
  );
}

/** A read-only row shown alongside the editable fields (system facts). */
export type ProfileReadOnlyRow = {
  label: string;
  value: React.ReactNode;
  /** Tooltip on the value — used for the onboarding-method explanation. */
  title?: string;
  className?: string;
};

// ── grouped editable field list ────────────────────────────────────────────
export function ProfileFieldsEditor({
  employee,
  employeeId,
  mode,
  groups,
  bulkEditLabel,
  readOnlyRows,
}: {
  employee: LocaleEmployee;
  employeeId: string;
  mode: Mode;
  /** Restrict to these field groups; defaults to all. */
  groups?: ProfileFieldGroup[];
  /** When set, shows an "Edit <label>" button that opens a bulk-edit modal for these groups. */
  bulkEditLabel?: string;
  /**
   * Non-editable system rows prepended to the first group's grid, so identifiers
   * read as part of the same list instead of a separate card.
   */
  readOnlyRows?: ProfileReadOnlyRow[];
}) {
  const dispatch = useAppDispatch();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const actorId = useAppSelector((s) => s.auth.user?.employeeId);
  const requests = useAppSelector((s) =>
    s.profileEdits.requests.filter((r) => r.employeeId === employeeId),
  );
  const [editing, setEditing] = useState<ProfileField | null>(null);
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [warnField, setWarnField] = useState<ProfileField | null>(null);

  const allFields = getEmployeeProfileFields(employee);
  const fields = groups ? allFields.filter((f) => groups.includes(f.group)) : allFields;
  const pendingByField = new Set(
    requests.filter((r) => r.status === "pending").map((r) => r.field),
  );

  const openFor = (f: ProfileField) => {
    setEditing(f);
    setOpen(true);
  };

  // System-driven fields warn before opening the editor.
  const handlePencil = (f: ProfileField) => {
    if (f.system) setWarnField(f);
    else openFor(f);
  };

  const handleSubmit = (value: string, reason: string) => {
    if (!editing) return;
    if (mode === "edit") {
      dispatch(applyEdit({ employeeId, field: editing.key, value }));
      toast.success(`${editing.label} updated`);
    } else {
      dispatch(
        requestEdit({
          employeeId,
          field: editing.key,
          label: editing.label,
          currentValue: getFieldString(employee, editing.key),
          requestedValue: value,
          reason,
          requestedBy: actorName,
          requestedById: actorId,
        }),
      );
      toast.success(`Change requested for ${editing.label}`);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {bulkEditLabel && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setBulkOpen(true)}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit {bulkEditLabel}
          </Button>
        </div>
      )}
      {PROFILE_GROUP_ORDER.filter((group) =>
        fields.some((f) => f.group === group),
      ).map((group, groupIndex) => {
        const groupFields = fields.filter((f) => f.group === group);
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              {PROFILE_GROUP_LABELS[group]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {groupIndex === 0 &&
                readOnlyRows?.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center gap-2 py-1.5 border-b border-border/50"
                  >
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {r.label}:
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium text-foreground flex-1 min-w-0 truncate",
                        r.className,
                      )}
                      title={r.title}
                    >
                      {r.value || (
                        <span className="italic text-muted-foreground/50">—</span>
                      )}
                    </span>
                    {/* Spacer keeps these rows aligned with the editable ones,
                        which reserve room for the pencil. */}
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  </div>
                ))}
              {groupFields.map((f) => {
                const raw = getFieldString(employee, f.key);
                const val =
                  f.type === "date" && raw ? formatDate(raw) : fieldValueLabel(f, raw);
                const pending = pendingByField.has(f.key);
                return (
                  <div
                    key={f.key}
                    className="flex items-center gap-2 py-1.5 border-b border-border/50 group/row"
                  >
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {f.label}:
                    </span>
                    <span className={`text-xs font-medium text-foreground flex-1 min-w-0 truncate${f.type === "select" || f.key === "workMode" ? " capitalize" : ""}`}>
                      {val || <span className="italic text-muted-foreground/50">—</span>}
                    </span>
                    {f.system && (
                      <Badge
                        variant="outline"
                        className="text-[9px] gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 shrink-0"
                        title={`System-driven${f.source ? ` · ${f.source}` : ""}`}
                      >
                        <ShieldAlert className="w-2.5 h-2.5" /> System
                      </Badge>
                    )}
                    {pending && (
                      <Badge
                        variant="outline"
                        className="text-[9px] gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 shrink-0"
                      >
                        <Clock className="w-2.5 h-2.5" /> Requested
                      </Badge>
                    )}
                    {/* Always visible: hover-only revealed nothing on touch and
                        made the request flow undiscoverable (§B2). */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground/60 hover:text-foreground focus-visible:opacity-100 group-hover/row:text-foreground transition-colors"
                      title={mode === "edit" ? `Edit ${f.label}` : `Request a change to ${f.label}`}
                      aria-label={
                        mode === "edit" ? `Edit ${f.label}` : `Request a change to ${f.label}`
                      }
                      onClick={() => handlePencil(f)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <FieldEditDialog
        open={open}
        onOpenChange={setOpen}
        field={editing}
        currentValue={editing ? getFieldString(employee, editing.key) : ""}
        mode={mode}
        onSubmit={handleSubmit}
      />

      {bulkEditLabel && (
        <BulkFieldsEditModal
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          title={bulkEditLabel}
          employee={employee}
          employeeId={employeeId}
          mode={mode}
          groups={groups}
        />
      )}

      <AlertDialog open={!!warnField} onOpenChange={(o) => !o && setWarnField(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Override system-managed data?
            </AlertDialogTitle>
            {/* Same shape as the record-level warning in `record-form` — name
                what owns it, state the consequence, then ask. */}
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-foreground">{warnField?.label}</span>{" "}
                  is managed by the{" "}
                  <span className="font-medium text-foreground">
                    {warnField?.source ?? "system"}
                  </span>{" "}
                  module.
                </p>
                <p>
                  {mode === "edit" ? "Editing" : "Requesting a change to"} it here will
                  override the system-managed value for this employee and may cause it
                  to differ from the original data until the records are reconciled.
                </p>
                <p>Are you sure you want to continue?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const f = warnField;
                setWarnField(null);
                if (f) openFor(f);
              }}
            >
              Override &amp; Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── change-request list ─────────────────────────────────────────────────────
const REQ_TONES: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600",
};

/** Renders a change-request value — a thumbnail for image fields, text otherwise. */
function RequestValue({ field, value }: { field: string; value: string }) {
  if (!value) return <span>—</span>;
  if (field === "photoUrl") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={value}
        alt="Profile photo"
        className="h-10 w-10 rounded-md object-cover"
      />
    );
  }
  return <span>{value}</span>;
}

/** Date + time, or "—". Requests carry an ISO timestamp, not just a date. */
function fmtStamp(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${formatDate(iso)} · ${d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * The decision on a request, phrased as the answer to "what happened to this?".
 * A rejection leads with the reviewer's note, since that's the actionable part.
 */
function changeRequestOutcome(r: ChangeRequest) {
  if (r.status === "pending") {
    return {
      tone: "pending" as const,
      heading: "Waiting for HR review",
      body: "This is in the queue. You'll see the decision here, with the reason, once someone has reviewed it.",
    };
  }
  if (r.status === "rejected") {
    return {
      tone: "negative" as const,
      heading: "Why this was rejected",
      body:
        r.decisionNote ??
        "No reason was recorded against this decision — ask HR what needs to change before re-submitting.",
      by: r.decidedBy,
      at: r.decidedAt ? fmtStamp(r.decidedAt) : undefined,
    };
  }
  return {
    tone: "positive" as const,
    heading: "Approved and applied",
    body:
      r.decisionNote ??
      "The change was accepted and the employee record has been updated to the requested value.",
    by: r.decidedBy,
    at: r.decidedAt ? fmtStamp(r.decidedAt) : undefined,
  };
}

/**
 * Four-step progress for a request (§B6). Rejected requests stop at review.
 */
function RequestProgress({ status }: { status: ChangeRequest["status"] }) {
  const steps =
    status === "rejected"
      ? ["Request received", "Reviewed by HR", "Not approved"]
      : ["Request received", "Awaiting HR review", "Approved", "Profile updated"];
  const reached =
    status === "pending" ? 2 : status === "rejected" ? 3 : steps.length;

  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {steps.map((label, i) => {
        const done = i < reached;
        const isLast = i === steps.length - 1;
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                done
                  ? status === "rejected" && isLast
                    ? "text-rose-600"
                    : "text-emerald-600"
                  : "text-muted-foreground/60",
              )}
            >
              <CircleCheck className="w-3 h-3" />
              {label}
            </span>
            {!isLast && <span className="text-muted-foreground/30 text-[10px]">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function ChangeRequestsTable({
  requests,
  audience,
  actorName,
  onRequestChange,
}: {
  requests: ChangeRequest[];
  audience: "employee" | "hr";
  actorName: string;
  /** Renders a CTA inside the empty state so it isn't a dead end (§B2d). */
  onRequestChange?: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const actorId = useAppSelector((s) => s.auth.user?.employeeId);
  const identity = useEmployeeIdentity();
  const [rejecting, setRejecting] = useState<ChangeRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [viewing, setViewing] = useState<ChangeRequest | null>(null);

  /**
   * Requests only started carrying actor ids recently, and the seeded actor is
   * the generic "HR" — so fall back to a name lookup, and accept that some
   * entries stay unlinked rather than pointing at the wrong person.
   */
  const actorIdFor = (name?: string, storedId?: string) =>
    storedId ?? identity.resolve(name)?.systemId ?? null;

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          {audience === "employee"
            ? "You haven't submitted any profile change requests."
            : "No profile change requests for this employee."}
        </p>
        <p className="text-xs text-muted-foreground">
          {audience === "employee"
            ? "Your personal information is up to date."
            : "Requests raised by this employee will appear here for review."}
        </p>
        {onRequestChange && <div className="mt-2">{onRequestChange}</div>}
      </div>
    );
  }

  return (
    <>
      {/* A scannable log, not a dossier: what changed, when, and where it got
          to. The reason, the people and the decision note all live one click
          away in the detail modal (§B6). */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Profile change log — every requested change, when it was submitted, and
            its current status. Open a row for the full detail.
          </caption>
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {["Field", "Change", "Submitted", "Status", ""].map((c, i) => (
                <th
                  key={c || `actions-${i}`}
                  scope="col"
                  className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0">
                <th
                  scope="row"
                  className="px-3 py-2 text-left text-sm font-medium text-foreground whitespace-nowrap"
                >
                  {r.label}
                </th>
                {/* Old → new on one line; the full values are in the modal. */}
                <td className="px-3 py-2 max-w-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="truncate text-muted-foreground line-through decoration-muted-foreground/40">
                      <RequestValue field={r.field} value={r.currentValue} />
                    </span>
                    <span className="text-muted-foreground/50">→</span>
                    <span className="truncate font-medium text-foreground">
                      <RequestValue field={r.field} value={r.requestedValue} />
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(r.requestedAt)}
                </td>
                <td className="px-3 py-2">
                  <Badge
                    variant="outline"
                    className={cn("w-fit text-[10px] capitalize", REQ_TONES[r.status])}
                  >
                    {r.status}
                  </Badge>
                </td>
                {/* Every row action lives behind one menu — "View details" is
                    always available, the decisions only while pending. */}
                <td className="px-3 py-2 text-right">
                  <RowActions
                    label={`Actions for ${r.label} request`}
                    onView={() => setViewing(r)}
                    extra={[
                      ...(r.status === "pending" && audience === "hr"
                        ? [
                            {
                              label: "Approve",
                              icon: Check,
                              separatorBefore: true,
                              onSelect: () => {
                                dispatch(approveRequest({ id: r.id, actorName, actorId }));
                                toast.success(`${r.label} change approved`);
                              },
                            },
                            {
                              label: "Reject",
                              icon: X,
                              destructive: true,
                              onSelect: () => {
                                setRejectNote("");
                                setRejecting(r);
                              },
                            },
                          ]
                        : []),
                      ...(r.status === "pending" && audience === "employee"
                        ? [
                            {
                              label: "Cancel request",
                              icon: X,
                              destructive: true,
                              separatorBefore: true,
                              onSelect: () => {
                                dispatch(cancelRequest(r.id));
                                toast.success("Request cancelled");
                              },
                            },
                          ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <RecordDetailModal
          open
          onClose={() => setViewing(null)}
          title={viewing.label}
          subtitle={`Profile change request · ${viewing.field}`}
          status={viewing.status}
          outcome={changeRequestOutcome(viewing)}
          about={{
            what: `A request to change ${viewing.label.toLowerCase()} from "${
              viewing.currentValue || "—"
            }" to "${viewing.requestedValue || "—"}".`,
            why: "Profile changes are reviewed by HR before they take effect, so the employee record stays accurate and auditable.",
            consequence:
              viewing.status === "approved"
                ? "The new value is live on the employee record."
                : viewing.status === "rejected"
                  ? "The record is unchanged. A new request can be raised once the issue above is resolved."
                  : "The record still shows the current value until this is approved.",
          }}
          fields={[
            { label: "Current value", value: viewing.currentValue || "—" },
            { label: "Requested value", value: viewing.requestedValue || "—" },
            { label: "Reason given", value: viewing.reason || "—", wide: true },
            {
              label: "Requested by",
              value: (
                <EmployeeLink
                  name={viewing.requestedBy}
                  employeeId={actorIdFor(viewing.requestedBy, viewing.requestedById)}
                />
              ),
            },
            { label: "Submitted", value: fmtStamp(viewing.requestedAt) },
            {
              label: viewing.status === "rejected" ? "Rejected by" : "Approved by",
              value: viewing.decidedBy ? (
                <EmployeeLink
                  name={viewing.decidedBy}
                  employeeId={actorIdFor(viewing.decidedBy, viewing.decidedById)}
                />
              ) : (
                "Not yet reviewed"
              ),
            },
            {
              label: "Decided",
              value: viewing.decidedAt ? fmtStamp(viewing.decidedAt) : "—",
            },
          ]}
        >
          <RequestProgress status={viewing.status} />
        </RecordDetailModal>
      )}

      {/* Rejecting captures a note — the slice already stores decisionNote, it
          just had no UI to collect it. */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Reject change — {rejecting?.label}
            </DialogTitle>
            <DialogDescription className="text-xs">
              The employee sees this explanation on their request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Reason for rejection <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Explain why this change can't be applied."
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectNote.trim().length < 3) {
                  toast.error("Please explain why the change was rejected.");
                  return;
                }
                dispatch(
                  rejectRequest({
                    id: rejecting!.id,
                    actorName,
                    actorId,
                    note: rejectNote.trim(),
                  }),
                );
                toast.success(`${rejecting!.label} change rejected`);
                setRejecting(null);
              }}
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
