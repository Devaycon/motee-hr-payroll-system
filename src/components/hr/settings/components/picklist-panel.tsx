"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, ListChecks } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
import type { PickList, PickListOption } from "../types";

interface Props {
  lists: PickList[];
}

export function PickListPanel({ lists: initial }: Props) {
  const [lists, setLists] = useState<PickList[]>(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PickListOption | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const activeList = lists.find((l) => l.id === activeId);

  function openAdd() {
    setEditing(null);
    setValue("");
    setError("");
    setDialogOpen(true);
  }

  function openEdit(option: PickListOption) {
    setEditing(option);
    setValue(option.value);
    setError("");
    setDialogOpen(true);
  }

  function handleSave() {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setError("Value is required.");
      return;
    }
    const duplicate = activeList?.options.some(
      (o) =>
        o.value.toLowerCase() === trimmed.toLowerCase() &&
        o.id !== editing?.id,
    );
    if (duplicate) {
      setError("This value already exists in the list.");
      return;
    }

    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeId) return l;
        if (editing) {
          return {
            ...l,
            options: l.options.map((o) =>
              o.id === editing.id ? { ...o, value: trimmed } : o,
            ),
          };
        }
        return {
          ...l,
          options: [
            ...l.options,
            {
              id: `opt-${Date.now()}`,
              value: trimmed,
              isDefault: l.options.length === 0,
            },
          ],
        };
      }),
    );
    toast.success(editing ? "Value updated." : "Value added.");
    setDialogOpen(false);
  }

  function handleDelete(option: PickListOption) {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== activeId) return l;
        const remaining = l.options.filter((o) => o.id !== option.id);
        // If we removed the default, promote the first remaining option.
        if (option.isDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isDefault: true };
        }
        return { ...l, options: remaining };
      }),
    );
    toast.success("Value deleted.");
  }

  function handleSetDefault(option: PickListOption) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === activeId
          ? {
              ...l,
              options: l.options.map((o) => ({
                ...o,
                isDefault: o.id === option.id,
              })),
            }
          : l,
      ),
    );
    toast.success(`"${option.value}" set as default.`);
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4.5 w-4.5 text-primary" />
          <CardTitle className="text-base">Pick Lists</CardTitle>
        </div>
        <CardDescription>
          Configure the dropdown options used across modules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pick List</label>
            <Select value={activeId} onValueChange={setActiveId}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Value
          </Button>
        </div>

        {activeList && (
          <>
            <p className="text-xs text-muted-foreground">
              {activeList.description}
            </p>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Value</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeList.options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell className="font-medium">
                        {option.value}
                      </TableCell>
                      <TableCell>
                        {option.isDefault ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          >
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Default
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => handleSetDefault(option)}
                          >
                            Set default
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEdit(option)}
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
                                <AlertDialogTitle>
                                  Delete Value
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove{" "}
                                  <span className="font-semibold">
                                    {option.value}
                                  </span>{" "}
                                  from {activeList.name}? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(option)}
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
                  {activeList.options.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground py-6"
                      >
                        No values yet. Add one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Value" : "Add Value"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this option's label."
                : `Add a new option to ${activeList?.name ?? "the list"}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Value</label>
            <Input
              value={value}
              autoFocus
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="e.g. Marketing"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
