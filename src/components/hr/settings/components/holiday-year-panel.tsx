"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarRange, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import type { HolidayYearConfig } from "../types";
import { formatDate } from "../utils";

interface Props {
  cycles: HolidayYearConfig[];
}

interface FormState {
  label: string;
  startDate: string;
  endDate: string;
}

const EMPTY: FormState = { label: "", startDate: "", endDate: "" };

export function HolidayYearPanel({ cycles: initial }: Props) {
  const [cycles, setCycles] = useState<HolidayYearConfig[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HolidayYearConfig | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setOpen(true);
  }

  function openEdit(cycle: HolidayYearConfig) {
    setEditing(cycle);
    setForm({
      label: cycle.label,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    });
    setError("");
    setOpen(true);
  }

  function handleSave() {
    if (!form.label.trim() || !form.startDate || !form.endDate) {
      setError("Label, start date and end date are all required.");
      return;
    }
    if (form.startDate >= form.endDate) {
      setError("End date must be after the start date.");
      return;
    }

    if (editing) {
      setCycles((prev) =>
        prev.map((c) =>
          c.id === editing.id ? { ...c, ...form, label: form.label.trim() } : c,
        ),
      );
      toast.success("Holiday year updated.");
    } else {
      setCycles((prev) => [
        ...prev,
        {
          id: `hy-${Date.now()}`,
          label: form.label.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: prev.length === 0,
        },
      ]);
      toast.success("Holiday year added.");
    }
    setOpen(false);
  }

  function handleActivate(id: string) {
    setCycles((prev) => prev.map((c) => ({ ...c, isActive: c.id === id })));
    toast.success("Active holiday year updated.");
  }

  function handleDelete(cycle: HolidayYearConfig) {
    setCycles((prev) => prev.filter((c) => c.id !== cycle.id));
    toast.success("Holiday year removed.");
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="text-base">Holiday Year</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Define the start and end of each holiday year cycle.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Add Cycle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cycles.map((cycle) => (
          <div
            key={cycle.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {cycle.label}
                </p>
                {cycle.isActive && (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(cycle.startDate)} &ndash; {formatDate(cycle.endDate)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!cycle.isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => handleActivate(cycle.id)}
                >
                  Set active
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => openEdit(cycle)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={cycle.isActive}
                    className="text-destructive hover:bg-destructive/10 disabled:text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Holiday Year</AlertDialogTitle>
                    <AlertDialogDescription>
                      Remove{" "}
                      <span className="font-semibold">{cycle.label}</span>? This
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleDelete(cycle)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {cycles.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No holiday year cycles configured.
          </p>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Holiday Year" : "Add Holiday Year"}
            </DialogTitle>
            <DialogDescription>
              Set the cycle label and its date range.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Label</label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Calendar Year 2027"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
