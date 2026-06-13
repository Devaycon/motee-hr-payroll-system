"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
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
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { addRecord, updateRecord } from "@/src/lib/stores/collection-edits-slice";
import { getFieldString } from "@/src/lib/profile/fields";
import type { CollectionSchema } from "@/src/lib/profile/collections";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Human-readable option label: "full_time" → "Full Time". */
export function optionLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type Mode = "create" | "edit";

interface DialogState {
  open: boolean;
  mode: Mode;
  record: Record<string, unknown> | null;
}

export function useRecordForm(schema: CollectionSchema, employeeId: string) {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<DialogState>({
    open: false,
    mode: "create",
    record: null,
  });
  // Pending intent shown behind the override-warning before the form opens.
  const [warn, setWarn] = useState<{ mode: Mode; record: Record<string, unknown> | null } | null>(
    null,
  );

  const openCreate = useCallback(() => setWarn({ mode: "create", record: null }), []);
  const openEdit = useCallback(
    (record: object) => setWarn({ mode: "edit", record: record as Record<string, unknown> }),
    [],
  );
  const proceed = useCallback(() => {
    setWarn((w) => {
      if (w) setState({ open: true, mode: w.mode, record: w.record });
      return null;
    });
  }, []);
  const close = useCallback(
    () => setState((s) => ({ ...s, open: false })),
    [],
  );

  const handleSubmit = (values: Record<string, unknown>) => {
    if (state.mode === "edit" && state.record) {
      const id = String(
        state.record[schema.idField ?? "id"] ?? state.record.id ?? "",
      );
      dispatch(updateRecord({ key: schema.key, id, patch: values }));
      toast.success(`${schema.singular} updated`);
    } else {
      const base = schema.defaults?.(employeeId) ?? {};
      const record = {
        id: uid(schema.idPrefix),
        ...base,
        ...values,
      };
      dispatch(addRecord({ key: schema.key, record }));
      toast.success(`${schema.singular} added`);
    }
    close();
  };

  const source = schema.source ?? schema.singular;
  const node = (
    <>
      <AlertDialog open={!!warn} onOpenChange={(o) => !o && setWarn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Override system-driven data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="capitalize">{schema.singular}</span> records are managed by the{" "}
              <span className="font-medium text-foreground">{source}</span> module.{" "}
              {warn?.mode === "edit" ? "Editing" : "Adding"} one here overrides system-driven data
              for this employee and may diverge from the source until reconciled. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceed}>I understand, continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecordFormDialog
        open={state.open}
        mode={state.mode}
        schema={schema}
        record={state.record}
        onOpenChange={(o) => (o ? null : close())}
        onSubmit={handleSubmit}
      />
    </>
  );

  return { openCreate, openEdit, node };
}

function RecordFormDialog({
  open,
  mode,
  schema,
  record,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: Mode;
  schema: CollectionSchema;
  record: Record<string, unknown> | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const seed: Record<string, string> = {};
      for (const f of schema.fields) {
        seed[f.key] = record ? getFieldString(record, f.key) : "";
      }
      setValues(seed);
    }
  }

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    const out: Record<string, unknown> = {};
    for (const f of schema.fields) {
      const raw = values[f.key] ?? "";
      if (f.type === "boolean") {
        out[f.key] = raw === "true";
        continue;
      }
      if (raw === "") continue;
      out[f.key] = f.type === "number" ? Number(raw) : raw;
    }
    if (Object.keys(out).length === 0) {
      toast.error("Please fill at least one field.");
      return;
    }
    onSubmit(out);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold capitalize">
            {mode === "create" ? `Add ${schema.singular}` : `Edit ${schema.singular}`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {schema.fields.map((f) => (
            <div
              key={f.key}
              className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
            >
              <Label className="text-xs">{f.label}</Label>
              {f.type === "boolean" ? (
                <Select
                  value={values[f.key] === "true" ? "true" : "false"}
                  onValueChange={(v) => set(f.key, v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="text-sm">Yes</SelectItem>
                    <SelectItem value="false" className="text-sm">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : f.type === "select" && f.options ? (
                <Select value={values[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
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
                  className="text-sm"
                />
              ) : (
                <Input
                  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="h-9 text-sm"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === "create" ? "Add" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Small "Add" button for a Section header. */
export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onClick}>
      <Plus className="w-3.5 h-3.5" /> {label}
    </Button>
  );
}

/** Row edit pencil. */
export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-6 w-6 text-muted-foreground"
      title="Edit"
      onClick={onClick}
    >
      <Pencil className="w-3 h-3" />
    </Button>
  );
}
