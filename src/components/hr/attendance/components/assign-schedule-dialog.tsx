"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useAssignWorkScheduleMutation } from "@/src/store/services/attendance";
import type { WorkSchedule } from "../types";

/**
 * Work Patterns ⋯ → Assign to employees. Puts the chosen people on this
 * pattern (PUT /attendance/schedules/employees/{employeeId} per person).
 */
export function AssignScheduleDialog({
  schedule,
  onClose,
}: {
  schedule: WorkSchedule | null;
  onClose: () => void;
}) {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const [assign] = useAssignWorkScheduleMutation();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (employees ?? [])
      .filter((e) => e.status !== "terminated")
      .filter(
        (e) =>
          !q ||
          e.fullName.toLowerCase().includes(q) ||
          (e.departmentName ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, search]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function save() {
    if (!schedule || picked.size === 0) return;
    setSaving(true);
    let done = 0;
    try {
      for (const employeeId of picked) {
        await assign({ employeeId, body: { scheduleId: schedule.id } }).unwrap();
        done++;
      }
      toast.success(`${done} employee${done === 1 ? "" : "s"} moved to ${schedule.name}`);
      setPicked(new Set());
      onClose();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not assign the work pattern.") +
          (done ? ` (${done} were assigned before the error.)` : ""),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!schedule} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign &ldquo;{schedule?.name}&rdquo;</DialogTitle>
          <DialogDescription>
            The chosen employees work this pattern from now on; it replaces their current one.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or department…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-border p-1">
          {list.map((e) => (
            <label
              key={e.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"
            >
              <Checkbox checked={picked.has(e.id)} onCheckedChange={() => toggle(e.id)} />
              <span className="flex-1 truncate font-medium">{e.fullName}</span>
              <span className="truncate text-[10px] text-muted-foreground">{e.departmentName}</span>
            </label>
          ))}
          {list.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">No one matches.</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={picked.size === 0 || saving} onClick={() => void save()}>
            {saving ? "Assigning…" : `Assign ${picked.size || ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
