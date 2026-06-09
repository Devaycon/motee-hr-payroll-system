"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
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
import { Switch } from "@/src/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table";
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
import type { CompanyHoliday } from "../types";
import { formatDate } from "../utils";

interface Props {
  holidays: CompanyHoliday[];
}

interface FormState {
  name: string;
  date: string;
  nonWorking: boolean;
  excludedDepartments: string;
}

const EMPTY: FormState = {
  name: "",
  date: "",
  nonWorking: true,
  excludedDepartments: "",
};

export function CompanyHolidaysPanel({ holidays: initial }: Props) {
  const [holidays, setHolidays] = useState<CompanyHoliday[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyHoliday | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setOpen(true);
  }

  function openEdit(holiday: CompanyHoliday) {
    setEditing(holiday);
    setForm({
      name: holiday.name,
      date: holiday.date,
      nonWorking: holiday.nonWorking,
      excludedDepartments: holiday.excludedDepartments.join(", "),
    });
    setError("");
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.date) {
      setError("Name and date are required.");
      return;
    }
    const excluded = form.excludedDepartments
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    if (editing) {
      setHolidays((prev) =>
        prev.map((h) =>
          h.id === editing.id
            ? {
                ...h,
                name: form.name.trim(),
                date: form.date,
                nonWorking: form.nonWorking,
                excludedDepartments: excluded,
              }
            : h,
        ),
      );
      toast.success("Holiday updated.");
    } else {
      setHolidays((prev) => [
        ...prev,
        {
          id: `ch-${Date.now()}`,
          name: form.name.trim(),
          date: form.date,
          nonWorking: form.nonWorking,
          excludedDepartments: excluded,
        },
      ]);
      toast.success("Holiday added.");
    }
    setOpen(false);
  }

  function handleDelete(holiday: CompanyHoliday) {
    setHolidays((prev) => prev.filter((h) => h.id !== holiday.id));
    toast.success("Holiday deleted.");
  }

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="text-base">Company Holidays</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Public and company-specific holidays for the organisation.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Add Holiday
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Holiday</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Non-working</TableHead>
                <TableHead>Excluded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(holiday.date)}
                  </TableCell>
                  <TableCell>
                    {holiday.nonWorking ? (
                      <Badge variant="secondary">Day off</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Working
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {holiday.excludedDepartments.length > 0
                      ? holiday.excludedDepartments.join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEdit(holiday)}
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
                            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove{" "}
                              <span className="font-semibold">
                                {holiday.name}
                              </span>{" "}
                              from the holiday calendar?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(holiday)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No company holidays defined.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Holiday" : "Add Holiday"}
            </DialogTitle>
            <DialogDescription>
              Define the holiday name, date and options.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Christmas Day"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Non-working day</p>
                <p className="text-xs text-muted-foreground">
                  Mark this date as a day off.
                </p>
              </div>
              <Switch
                checked={form.nonWorking}
                onCheckedChange={(v) => setForm({ ...form, nonWorking: v })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Excluded Departments
              </label>
              <Input
                value={form.excludedDepartments}
                onChange={(e) =>
                  setForm({ ...form, excludedDepartments: e.target.value })
                }
                placeholder="Comma-separated, e.g. Sales, Support"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to apply to everyone.
              </p>
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
