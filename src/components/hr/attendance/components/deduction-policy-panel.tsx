"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Percent, Clock3 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updatePolicy } from "@/src/lib/stores/attendance-deduction-policy-slice";
import type { DeductionBasis, DeductionRule } from "@/src/lib/types/attendance";

const BASIS_LABELS: Record<DeductionBasis, string> = {
  flat: "Flat amount",
  percent_of_daily_rate: "% of daily rate",
};

interface RuleCardProps {
  title: string;
  description: string;
  perInstanceLabel: string;
  currency: string;
  rule: DeductionRule;
  onChange: (rule: DeductionRule) => void;
}

function RuleCard({
  title,
  description,
  perInstanceLabel,
  currency,
  rule,
  onChange,
}: RuleCardProps) {
  return (
    <div className="rounded-lg border border-border p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">{title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
        <Switch
          checked={rule.enabled}
          onCheckedChange={(v) => onChange({ ...rule, enabled: v })}
        />
      </div>
      {rule.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Basis</Label>
            <Select
              value={rule.basis}
              onValueChange={(v) =>
                onChange({ ...rule, basis: v as DeductionBasis })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BASIS_LABELS) as DeductionBasis[]).map((b) => (
                  <SelectItem key={b} value={b} className="text-xs">
                    {BASIS_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">
              Amount {perInstanceLabel}
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {rule.basis === "flat" ? currency : "%"}
              </span>
              <Input
                type="number"
                min={0}
                className="h-8 text-xs pl-8"
                value={rule.amount}
                onChange={(e) =>
                  onChange({ ...rule, amount: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DeductionPolicyPanel() {
  const dispatch = useAppDispatch();
  const policy = useAppSelector((s) => s.attendanceDeductionPolicy.policy);
  // Re-sync the draft when the underlying policy changes (e.g. the server
  // snapshot lands after a refresh) — adjusted during render rather than in
  // an effect, so it doesn't cost an extra commit.
  const [prevPolicy, setPrevPolicy] = useState(policy);
  const [form, setForm] = useState(policy);
  if (policy !== prevPolicy) {
    setPrevPolicy(policy);
    setForm(policy);
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(policy);

  function handleSave() {
    dispatch(
      updatePolicy({
        graceMinutes: Math.max(0, form.graceMinutes),
        currency: form.currency,
        lateDeduction: form.lateDeduction,
        absenceDeduction: form.absenceDeduction,
        earlyDepartureDeduction: form.earlyDepartureDeduction,
        updatedBy: "HR Admin",
      }),
    );
    toast.success("Deduction policy saved.");
  }

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Grace Period</CardTitle>
          </div>
          <CardDescription>
            How many minutes after the scheduled start time a clock-in is
            still counted as present rather than late. Used everywhere a punch
            is judged against an employee&apos;s schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-40 space-y-1.5">
            <Label className="text-[11px]">Grace period (minutes)</Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-xs"
              value={form.graceMinutes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  graceMinutes: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Deduction Rules</CardTitle>
          </div>
          <CardDescription>
            Demo-scoped configuration — these figures are computed onto
            timesheets and the attendance detail page for illustration, and
            are not wired to an actual payroll run.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5 max-w-48">
            <Label className="text-[11px]">Currency label</Label>
            <Input
              className="h-8 text-xs"
              value={form.currency}
              onChange={(e) =>
                setForm((f) => ({ ...f, currency: e.target.value }))
              }
              placeholder="e.g. NGN"
            />
          </div>

          <RuleCard
            title="Late Arrival"
            description="Charged once per late clock-in (after the grace period above)."
            perInstanceLabel="per late arrival"
            currency={form.currency}
            rule={form.lateDeduction}
            onChange={(lateDeduction) =>
              setForm((f) => ({ ...f, lateDeduction }))
            }
          />

          <RuleCard
            title="Unpaid Absence"
            description="Charged once per day marked absent."
            perInstanceLabel="per absence day"
            currency={form.currency}
            rule={form.absenceDeduction}
            onChange={(absenceDeduction) =>
              setForm((f) => ({ ...f, absenceDeduction }))
            }
          />

          <RuleCard
            title="Early Departure"
            description="Charged once per day marked as an early departure."
            perInstanceLabel="per early departure"
            currency={form.currency}
            rule={form.earlyDepartureDeduction}
            onChange={(earlyDepartureDeduction) =>
              setForm((f) => ({ ...f, earlyDepartureDeduction }))
            }
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              className="text-xs h-8"
              onClick={handleSave}
              disabled={!dirty}
            >
              Save policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
