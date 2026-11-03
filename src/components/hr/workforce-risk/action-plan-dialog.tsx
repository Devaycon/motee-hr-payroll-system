"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { PerfBranch } from "@/src/lib/branches/performance";
import type { RiskEntry } from "@/src/lib/workforce-risk/register";
import { defaultDueDate, type ActionPlanDraft } from "./hooks";

const INACTIVE = new Set(["terminated", "resigned", "exited", "inactive", "left", "offboarded"]);

/**
 * Who should own it by default: the branch manager for a branch-wide risk,
 * the person's line manager for an individual one. Never the person the risk
 * is about — nobody verifies their own right to work.
 */
function suggestedOwner(entry: RiskEntry, employees: LocaleEmployee[], branches: PerfBranch[]): string {
  const a = entry.risk.affected;
  if (a.scope === "branch") {
    const manager = branches.find((b) => b.id === a.branchId)?.managerEmployeeId;
    if (manager) return manager;
  }
  if (a.scope === "employee") {
    const manager = employees.find((e) => e.id === a.ids[0])?.managerId;
    if (manager) return manager;
  }
  return "";
}

function PersonSelect({
  people,
  value,
  onChange,
  placeholder,
}: {
  people: LocaleEmployee[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {people.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.fullName} · {p.jobTitle}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ActionPlanDialog({
  entry,
  open,
  onOpenChange,
  employees,
  branches,
  onCreate,
}: {
  entry: RiskEntry;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employees: LocaleEmployee[];
  branches: PerfBranch[];
  onCreate: (draft: ActionPlanDraft) => void;
}) {
  const me = useAppSelector((s) => s.auth.user?.employeeId ?? "");
  const people = useMemo(
    () =>
      employees
        .filter((e) => !INACTIVE.has(String(e.status).toLowerCase()))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [employees],
  );

  const blank = (): ActionPlanDraft => ({
    recommendation: entry.recommendation,
    ownerId: suggestedOwner(entry, employees, branches),
    collaboratorIds: [],
    verifierId: me,
    dueDate: defaultDueDate(entry),
    escalateAfterDays: entry.risk.priority === "critical" ? 1 : 3,
  });
  const [draft, setDraft] = useState<ActionPlanDraft>(blank);

  useEffect(() => {
    if (open) setDraft(blank());
    // Reset on open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof ActionPlanDraft>(k: K, v: ActionPlanDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  // The person a risk is about can't own or verify it.
  const subjectIds = entry.risk.affected.scope === "employee" ? entry.risk.affected.ids : [];
  const pickable = people.filter((p) => !subjectIds.includes(p.id));

  const problems = [
    !draft.recommendation.trim() && "Describe the action.",
    !draft.ownerId && "Choose an accountable owner.",
    !draft.verifierId && "Choose who verifies the result.",
    draft.verifierId && draft.verifierId === draft.ownerId && "The verifier must be someone other than the owner.",
    !draft.dueDate && "Set a due date.",
  ].filter(Boolean) as string[];

  const submit = () => {
    if (problems.length > 0) {
      toast.error(problems[0]);
      return;
    }
    onCreate(draft);
    toast.success("Action plan created and assigned");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create action plan</DialogTitle>
          <DialogDescription>
            {entry.risk.title} · {entry.risk.affected.label}. The owner&apos;s task goes to their HR Action Centre; the
            verifier signs it off before the risk can be closed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Action</Label>
            <Textarea rows={3} value={draft.recommendation} onChange={(e) => set("recommendation", e.target.value)} />
            <p className="text-xs text-muted-foreground">Starts from the recommendation; edit it to fit.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Accountable owner</Label>
              <PersonSelect people={pickable} value={draft.ownerId} onChange={(v) => set("ownerId", v)} placeholder="Select owner" />
            </div>
            <div className="space-y-1.5">
              <Label>Verified by</Label>
              <PersonSelect people={pickable} value={draft.verifierId} onChange={(v) => set("verifierId", v)} placeholder="Select verifier" />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" className="h-9" value={draft.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Escalate to verifier after</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  className="h-9 w-20"
                  value={draft.escalateAfterDays}
                  onChange={(e) => set("escalateAfterDays", Math.max(0, Number(e.target.value) || 0))}
                />
                <span className="text-xs text-muted-foreground">days overdue</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Supporting collaborators (optional)</Label>
            <ScrollArea className="h-36 rounded-md border">
              <ul className="p-2">
                {pickable
                  .filter((p) => p.id !== draft.ownerId)
                  .map((p) => {
                    const checked = draft.collaboratorIds.includes(p.id);
                    return (
                      <li key={p.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(on) =>
                              set(
                                "collaboratorIds",
                                on ? [...draft.collaboratorIds, p.id] : draft.collaboratorIds.filter((x) => x !== p.id),
                              )
                            }
                          />
                          {p.fullName}
                          <span className="text-xs text-muted-foreground">{p.jobTitle}</span>
                        </label>
                      </li>
                    );
                  })}
              </ul>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create &amp; assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
