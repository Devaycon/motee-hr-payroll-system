"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Radio, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Switch } from "@/src/components/ui/switch";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateSettings } from "@/src/lib/stores/presence-check-slice";
import { isoDateOf } from "@/src/lib/types/attendance";
import { summarizePresenceDay } from "@/src/lib/types/presence-check";
import { secondsToHHMM } from "@/src/lib/utils/format-duration";

/** Minimal table primitives, matching the dense read-only tables elsewhere. */
function Table({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {columns.map((c) => (
              <th
                key={c}
                className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function PresenceCheckPanel() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.presenceCheck.settings);
  const prompts = useAppSelector((s) => s.presenceCheck.prompts);
  const sessions = useAppSelector((s) => s.attendance.sessions);

  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);

  // Refreshes the "still open" sessions' active/inactive split without
  // requiring HR to reload the page.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const dirty =
    form.enabled !== settings.enabled ||
    form.intervalMinMinutes !== settings.intervalMinMinutes ||
    form.intervalMaxMinutes !== settings.intervalMaxMinutes ||
    form.responseWindowSeconds !== settings.responseWindowSeconds ||
    form.missThreshold !== settings.missThreshold ||
    form.pauseDuringBreaks !== settings.pauseDuringBreaks;

  function handleSave() {
    const intervalMinMinutes = Math.max(1, form.intervalMinMinutes);
    const intervalMaxMinutes = Math.max(intervalMinMinutes, form.intervalMaxMinutes);
    dispatch(
      updateSettings({
        enabled: form.enabled,
        intervalMinMinutes,
        intervalMaxMinutes,
        responseWindowSeconds: Math.max(10, form.responseWindowSeconds),
        missThreshold: Math.max(1, form.missThreshold),
        pauseDuringBreaks: form.pauseDuringBreaks,
        updatedBy: "HR Admin",
      }),
    );
    toast.success(
      form.enabled
        ? "Presence check-ins enabled."
        : "Presence check-ins disabled.",
    );
  }

  const todayIso = isoDateOf(new Date());
  const nowIso = new Date().toISOString();
  const todaysByEmployee = new Map<string, typeof prompts>();
  for (const p of prompts) {
    if (p.sessionDate !== todayIso) continue;
    const list = todaysByEmployee.get(p.employeeId) ?? [];
    list.push(p);
    todaysByEmployee.set(p.employeeId, list);
  }

  const rows = Array.from(todaysByEmployee.entries())
    .map(([employeeId, empPrompts]) => {
      const session = sessions[employeeId];
      const sessionStart = session?.clockInAt ?? empPrompts[0].triggeredAt;
      const sessionEnd = session?.clockOutAt ?? nowIso;
      return summarizePresenceDay(
        employeeId,
        empPrompts[0].employeeName,
        todayIso,
        empPrompts,
        settings.missThreshold,
        sessionStart,
        sessionEnd,
      );
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="text-base">
                Presence Check-ins
              </CardTitle>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
            />
          </div>
          <CardDescription>
            While an employee is clocked in, periodically prompt them to
            confirm they&apos;re active. Missed prompts build a
            productivity split of active vs. inactive time for the day.
          </CardDescription>
        </CardHeader>
        {form.enabled && (
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Prompt interval range (minutes)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-xs"
                    value={form.intervalMinMinutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        intervalMinMinutes: Number(e.target.value) || 1,
                      }))
                    }
                  />
                  <span className="text-xs text-muted-foreground shrink-0">
                    to
                  </span>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-xs"
                    value={form.intervalMaxMinutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        intervalMaxMinutes: Number(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Each prompt fires at a random time within this range, so
                  employees can&apos;t predict exactly when the next one
                  lands.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Response window (seconds)
                </Label>
                <Input
                  type="number"
                  min={10}
                  className="h-8 text-xs"
                  value={form.responseWindowSeconds}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      responseWindowSeconds: Number(e.target.value) || 10,
                    }))
                  }
                />
                <p className="text-[10px] text-muted-foreground">
                  How long an employee has to click the prompt before it
                  counts as missed.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Mark inactive after this many missed prompts in a row
                </Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={form.missThreshold}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      missThreshold: Number(e.target.value) || 1,
                    }))
                  }
                />
                <p className="text-[10px] text-muted-foreground">
                  Set to 1 to log inactive on the very first missed prompt,
                  or higher to allow for the odd missed click.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pause during breaks</Label>
                <div className="flex items-center gap-2 pt-1.5">
                  <Switch
                    checked={form.pauseDuringBreaks}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, pauseDuringBreaks: v }))
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    Don&apos;t prompt while an employee is on a logged break
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                className="text-xs h-8"
                onClick={handleSave}
                disabled={!dirty}
              >
                Save settings
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {form.enabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Today&apos;s productivity</h3>
          </div>
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">
              No presence check-ins recorded yet today.
            </p>
          ) : (
            <Table
              columns={[
                "Employee",
                "Prompts",
                "Confirmed",
                "Missed",
                "Active time",
                "Inactive time",
                "Status",
              ]}
            >
              {rows.map((r) => {
                const session = sessions[r.employeeId];
                const stillClockedIn =
                  session?.date === todayIso && !session.clockOutAt;
                const lastStatus = r.periods[r.periods.length - 1]?.status;
                const isFlagged = stillClockedIn && lastStatus === "inactive";
                const label = stillClockedIn
                  ? isFlagged
                    ? "Currently inactive"
                    : "Active"
                  : r.inactiveSeconds > 0
                    ? "Had inactivity"
                    : "Active all day";
                return (
                  <tr
                    key={r.employeeId}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-foreground">
                      {r.employeeName}
                    </td>
                    <td className="px-3 py-2">{r.totalPrompts}</td>
                    <td className="px-3 py-2">{r.confirmed}</td>
                    <td className="px-3 py-2">{r.missed}</td>
                    <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400">
                      {secondsToHHMM(r.activeSeconds)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2",
                        r.inactiveSeconds > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {r.inactiveSeconds > 0
                        ? secondsToHHMM(r.inactiveSeconds)
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="secondary"
                        className={
                          isFlagged
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : r.inactiveSeconds > 0
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
