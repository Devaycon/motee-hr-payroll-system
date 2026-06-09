"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, Clock, ShieldAlert } from "lucide-react";
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
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";

type Mode = "edit" | "request";

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
    if (mode === "request" && reason.trim().length < 3) {
      toast.error("Please give a brief reason for the change.");
      return;
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
                    <SelectItem key={o} value={o} className="text-sm capitalize">
                      {o}
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
              <Label className="text-xs">Reason</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why does this need to change?"
                className="text-sm"
              />
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
    if (mode === "request" && reason.trim().length < 3) {
      toast.error("Please give a brief reason for the change.");
      return;
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
                      <SelectItem key={o} value={o} className="text-sm capitalize">
                        {o.replace(/_/g, " ")}
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
            <Label className="text-xs">Reason</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do these need to change?"
              className="text-sm"
            />
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

// ── grouped editable field list ────────────────────────────────────────────
export function ProfileFieldsEditor({
  employee,
  employeeId,
  mode,
  groups,
  bulkEditLabel,
}: {
  employee: LocaleEmployee;
  employeeId: string;
  mode: Mode;
  /** Restrict to these field groups; defaults to all. */
  groups?: ProfileFieldGroup[];
  /** When set, shows an "Edit <label>" button that opens a bulk-edit modal for these groups. */
  bulkEditLabel?: string;
}) {
  const dispatch = useAppDispatch();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
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
      {PROFILE_GROUP_ORDER.map((group) => {
        const groupFields = fields.filter((f) => f.group === group);
        if (groupFields.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              {PROFILE_GROUP_LABELS[group]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {groupFields.map((f) => {
                const raw = getFieldString(employee, f.key);
                const val = f.type === "date" && raw ? formatDate(raw) : raw;
                const pending = pendingByField.has(f.key);
                return (
                  <div
                    key={f.key}
                    className="flex items-center gap-2 py-1.5 border-b border-border/50 group/row"
                  >
                    <span className="text-xs text-muted-foreground w-36 shrink-0">
                      {f.label}:
                    </span>
                    <span className="text-xs font-medium text-foreground flex-1 truncate">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity"
                      title={mode === "edit" ? "Edit" : "Request change"}
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
              Override system-driven data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{warnField?.label}</span> is
              managed by the{" "}
              <span className="font-medium text-foreground">{warnField?.source ?? "system"}</span>{" "}
              module. {mode === "edit" ? "Editing" : "Requesting a change to"} it here overrides
              the system value for this employee and may diverge from the source of truth until
              it&apos;s reconciled. Continue?
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
              I understand, continue
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
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={value}
        alt="Profile photo"
        className="h-10 w-10 rounded-md object-cover"
      />
    );
  }
  return <span>{value}</span>;
}

export function ChangeRequestsTable({
  requests,
  audience,
  actorName,
}: {
  requests: ChangeRequest[];
  audience: "employee" | "hr";
  actorName: string;
}) {
  const dispatch = useAppDispatch();

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">No change requests.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {["Field", "Current", "Requested", "Reason", "Status", ""].map((c) => (
              <th
                key={c}
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
              <td className="px-3 py-2 text-foreground">{r.label}</td>
              <td className="px-3 py-2 text-muted-foreground">
                <RequestValue field={r.field} value={r.currentValue} />
              </td>
              <td className="px-3 py-2 font-medium text-foreground">
                <RequestValue field={r.field} value={r.requestedValue} />
              </td>
              <td className="px-3 py-2 text-muted-foreground max-w-xs">{r.reason}</td>
              <td className="px-3 py-2">
                <Badge variant="outline" className={cn("text-[10px] capitalize", REQ_TONES[r.status])}>
                  {r.status}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right">
                {r.status === "pending" && audience === "hr" && (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-emerald-600"
                      onClick={() => {
                        dispatch(approveRequest({ id: r.id, actorName }));
                        toast.success("Request approved");
                      }}
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-rose-600"
                      onClick={() => {
                        dispatch(rejectRequest({ id: r.id, actorName }));
                        toast.success("Request rejected");
                      }}
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                )}
                {r.status === "pending" && audience === "employee" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => {
                      dispatch(cancelRequest(r.id));
                      toast.success("Request cancelled");
                    }}
                  >
                    Cancel
                  </Button>
                )}
                {r.status !== "pending" && r.decidedBy && (
                  <span className="text-[11px] text-muted-foreground">by {r.decidedBy}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
