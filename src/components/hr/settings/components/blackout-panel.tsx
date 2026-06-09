"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarX } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
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
import type { BlackoutPeriod } from "../types";
import { formatDate } from "../utils";

interface Props {
  periods: BlackoutPeriod[];
}

interface FormState {
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const EMPTY: FormState = { name: "", startDate: "", endDate: "", reason: "" };

export function BlackoutPanel({ periods: initial }: Props) {
  const [periods, setPeriods] = useState<BlackoutPeriod[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlackoutPeriod | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setOpen(true);
  }

  function openEdit(period: BlackoutPeriod) {
    setEditing(period);
    setForm({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      reason: period.reason ?? "",
    });
    setError("");
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setError("Name, start date and end date are required.");
      return;
    }
    if (form.startDate > form.endDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    if (editing) {
      setPeriods((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                name: form.name.trim(),
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason.trim() || undefined,
              }
            : p,
        ),
      );
      toast.success("Blackout period updated.");
    } else {
      setPeriods((prev) => [
        ...prev,
        {
          id: `bo-${Date.now()}`,
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim() || undefined,
        },
      ]);
      toast.success("Blackout period added.");
    }
    setOpen(false);
  }

  function handleDelete(period: BlackoutPeriod) {
    setPeriods((prev) => prev.filter((p) => p.id !== period.id));
    toast.success("Blackout period removed.");
  }

  const sorted = [...periods].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarX className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="text-base">Company Blackout</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Periods when employees cannot request leave.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Add Period
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((period) => (
          <div
            key={period.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {period.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(period.startDate)} &ndash;{" "}
                {formatDate(period.endDate)}
              </p>
              {period.reason && (
                <p className="text-xs text-muted-foreground/80 italic">
                  {period.reason}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => openEdit(period)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Blackout Period</AlertDialogTitle>
                    <AlertDialogDescription>
                      Remove{" "}
                      <span className="font-semibold">{period.name}</span>?
                      Employees will be able to request leave during these dates
                      again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleDelete(period)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No blackout periods defined.
          </p>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Blackout Period" : "Add Blackout Period"}
            </DialogTitle>
            <DialogDescription>
              Define a date range during which leave cannot be requested.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Year-End Close"
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Why is leave restricted during this period?"
                rows={3}
              />
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
