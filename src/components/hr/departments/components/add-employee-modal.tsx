"use client";

import { useState, useMemo } from "react";
import { Search, UserPlus, X, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import { useEmployees } from "@/src/components/hr/employees/hooks";
import type { EmployeeRow } from "@/src/lib/types/employees";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentName: string;
  currentMembers: EmployeeRow[];
  onAdd: (employees: EmployeeRow[]) => void;
}

export function AddEmployeeModal({
  open,
  onOpenChange,
  departmentName,
  currentMembers,
  onAdd,
}: AddEmployeeModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: employees } = useEmployees();
  const allEmployees = useMemo(() => employees ?? [], [employees]);

  const currentIds = new Set(currentMembers.map((m) => m.id));

  const available = useMemo(
    () => allEmployees.filter((e) => !currentIds.has(e.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEmployees, currentMembers],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return available;
    return available.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q),
    );
  }, [available, search]);

  function toggleEmployee(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const toAdd = allEmployees.filter((e) => selected.has(e.id)).map((e) => ({
      ...e,
      department: departmentName,
    }));
    onAdd(toAdd);
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  }

  function handleClose() {
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  }

  const selectedEmployees = allEmployees.filter((e) => selected.has(e.id));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Add Employees to {departmentName}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, title, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm pl-8"
            />
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedEmployees.map((e) => (
                <Badge
                  key={e.id}
                  variant="secondary"
                  className="text-xs gap-1.5 pr-1 pl-2 py-0.5"
                >
                  {e.name}
                  <button
                    onClick={() => toggleEmployee(e.id)}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0 max-h-72 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-xs text-muted-foreground">
                No employees found.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((emp, idx) => {
                const isSelected = selected.has(emp.id);
                return (
                  <button
                    key={emp.id}
                    onClick={() => toggleEmployee(emp.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors w-full",
                      idx !== filtered.length - 1 &&
                        "border-b border-border/50",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/60",
                    )}
                  >
                    <PersonAvatar
                      name={emp.name}
                      initials={emp.initials}
                      gender={emp.gender}
                      className="size-8 shrink-0"
                      fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {emp.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {emp.jobTitle} · {emp.department}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-border",
                      )}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="px-5 py-3 flex flex-row items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} employee${selected.size > 1 ? "s" : ""} selected`
              : "Select employees to add"}
          </span>
          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleConfirm}
              disabled={selected.size === 0}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add{" "}
              {selected.size > 0
                ? `${selected.size} Employee${selected.size > 1 ? "s" : ""}`
                : "Employees"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
