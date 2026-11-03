"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateRiskSettings } from "@/src/lib/stores/workforce-risk-slice";
import { DEFAULT_RISK_SETTINGS, RISK_RULES, ruleApplies, type RiskRuleSettings } from "@/src/lib/workforce-risk/rules";

const THRESHOLDS: { key: keyof Omit<RiskRuleSettings, "disabledRules">; label: string; unit: string }[] = [
  { key: "rtwWarningDays", label: "Warn before right-to-work expiry", unit: "days" },
  { key: "probationWarningDays", label: "Warn before probation ends", unit: "days" },
  { key: "sicknessRiseThreshold", label: "Sickness rate rise that marks a trend", unit: "pts" },
  { key: "attendanceFallThreshold", label: "Attendance fall that marks a trend", unit: "pts" },
  { key: "understaffedBelowPct", label: "Understaffed below", unit: "% of target" },
];

/**
 * Organisation-specific rule configuration. Branch KPI targets are shared
 * with Branch Performance and are edited there, so the two can't disagree.
 */
export function RiskSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const dispatch = useAppDispatch();
  const tenantId = useAppSelector((s) => s.locale.data?.tenant.id ?? "");
  const country = useAppSelector((s) => s.locale.country);
  const saved = useAppSelector((s) => s.workforceRisk.settings[tenantId]) ?? DEFAULT_RISK_SETTINGS;
  const [draft, setDraft] = useState<RiskRuleSettings>(saved);

  useEffect(() => {
    if (open) setDraft(saved);
    // Reset only when the dialog opens, not on every store change while editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string, on: boolean) =>
    setDraft((d) => ({
      ...d,
      disabledRules: on ? d.disabledRules.filter((r) => r !== id) : [...d.disabledRules, id],
    }));

  const save = () => {
    dispatch(updateRiskSettings({ tenantId, settings: draft }));
    toast.success("Risk rules updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Risk rule settings</DialogTitle>
          <DialogDescription>
            Thresholds for this organisation. Branch targets (attendance, training, staffing…) come from Branch
            Performance settings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {THRESHOLDS.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-3">
              <Label htmlFor={t.key} className="text-sm font-normal">
                {t.label}
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  id={t.key}
                  type="number"
                  min={0}
                  className="h-8 w-20 text-right"
                  value={draft[t.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [t.key]: Math.max(0, Number(e.target.value) || 0) }))}
                />
                <span className="w-20 text-xs text-muted-foreground">{t.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 border-t border-border pt-3">
          <p className="mb-2 text-sm font-medium">Rules</p>
          <ul className="flex flex-col gap-2">
            {RISK_RULES.filter((r) => ruleApplies(r.id, country)).map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
                <Switch checked={!draft.disabledRules.includes(r.id)} onCheckedChange={(on) => toggle(r.id, on)} />
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
